import { db, auth } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

/* ================= CONFIG ================= */

const ADMIN_EMAIL = "jbgerloff@gmail.com";

const POINTS = {
  r1: 1,
  r2: 3,
  r3: 5,
  r4: 7,
  r5: 20
};

/* ================= DOM ================= */

const loginDiv = document.getElementById("login");
const dashboardDiv = document.getElementById("dashboard");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");
const adminEmailEl = document.getElementById("adminEmail");

const round1Controls = document.getElementById("round1Controls");
const championSelect = document.getElementById("championSelect");
const saveResultsBtn = document.getElementById("saveResultsBtn");
const scoreBtn = document.getElementById("scoreBtn");
const scoreStatus = document.getElementById("scoreStatus");

const tableBody = document.getElementById("table-body");
const detailsEl = document.getElementById("details");
const countEl = document.getElementById("count");

/* ================= STATE ================= */

let officialResults = {
  round1: {},
  round2: {},
  round3: {},
  round4: {},
  champion: ""
};

/* ================= AUTH ================= */

loginBtn.onclick = async () => {
  loginError.textContent = "";
  try {
    await signInWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
  } catch (e) {
    loginError.textContent = e.message;
  }
};

logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, async user => {
  if (!user || user.email !== ADMIN_EMAIL) {
    loginDiv.style.display = "block";
    dashboardDiv.style.display = "none";
    return;
  }

  loginDiv.style.display = "none";
  dashboardDiv.style.display = "block";
  adminEmailEl.textContent = user.email;

  await initAdmin();
});

/* ================= INIT ================= */

async function initAdmin() {
  await buildRound1ControlsFromData();
  await loadResults();
  await loadSubmissions();
}

/* ================= BUILD CONTROLS ================= */

async function buildRound1ControlsFromData() {
  round1Controls.innerHTML = "";
  championSelect.innerHTML = `<option value="">Select Champion</option>`;

  const snap = await getDocs(collection(db, "brackets"));
  if (snap.empty) return;

  const firstBracket = snap.docs[0].data();
  const round1 = firstBracket.picks.round1;

  Object.entries(round1).forEach(([game, data]) => {
    const select = document.createElement("select");
    select.dataset.game = game;

    select.innerHTML = `
      <option value="">${game}</option>
      <option value="${data.slot1}">${data.slot1}</option>
      <option value="${data.slot2}">${data.slot2}</option>
    `;

    round1Controls.appendChild(select);

    [data.slot1, data.slot2].forEach(team => {
      if (![...championSelect.options].some(o => o.value === team)) {
        const opt = document.createElement("option");
        opt.value = team;
        opt.textContent = team;
        championSelect.appendChild(opt);
      }
    });
  });
}

/* ================= RESULTS ================= */

async function loadResults() {
  const snap = await getDoc(doc(db, "results", "current"));
  if (!snap.exists()) return;

  officialResults = snap.data();

  document.querySelectorAll("#round1Controls select").forEach(sel => {
    if (officialResults.round1?.[sel.dataset.game]) {
      sel.value = officialResults.round1[sel.dataset.game];
    }
  });

  championSelect.value = officialResults.champion || "";
}

saveResultsBtn.onclick = async () => {
  officialResults.round1 = {};

  document.querySelectorAll("#round1Controls select").forEach(sel => {
    if (sel.value) {
      officialResults.round1[sel.dataset.game] = sel.value;
    }
  });

  officialResults.champion = championSelect.value;

  await setDoc(doc(db, "results", "current"), officialResults);
  scoreStatus.textContent = "Results saved.";
};

/* ================= SCORING ================= */

scoreBtn.onclick = async () => {
  scoreStatus.textContent = "Scoring...";

  const bracketsSnap = await getDocs(collection(db, "brackets"));

  for (const b of bracketsSnap.docs) {
    const p = b.data().picks;

    let score = {
      r1: 0,
      r2: 0,
      r3: 0,
      r4: 0,
      r5: 0
    };

    // Round 1
    for (const game in officialResults.round1 || {}) {
      if (p.round1?.[game]?.pick === officialResults.round1[game]) {
        score.r1 += POINTS.r1;
      }
    }

    // Round 2
    for (const game in officialResults.round2 || {}) {
      if (p.round2?.[game]?.pick === officialResults.round2[game]) {
        score.r2 += POINTS.r2;
      }
    }

    // Round 3
    for (const game in officialResults.round3 || {}) {
      if (p.round3?.[game]?.pick === officialResults.round3[game]) {
        score.r3 += POINTS.r3;
      }
    }

    // Round 4
    for (const game in officialResults.round4 || {}) {
      if (p.round4?.[game]?.pick === officialResults.round4[game]) {
        score.r4 += POINTS.r4;
      }
    }

    // Champion
    if (p.champion === officialResults.champion) {
      score.r5 = POINTS.r5;
    }

    const total =
      score.r1 + score.r2 + score.r3 + score.r4 + score.r5;

    await setDoc(doc(db, "scores", b.id), {
      entryName: b.data().entryName,
      total,
      rounds: score
    });
  }

  scoreStatus.textContent = "Scoring complete.";
};

/* ================= SUBMISSIONS TABLE ================= */

async function loadSubmissions() {
  const q = query(
    collection(db, "brackets"),
    orderBy("submittedAt", "desc")
  );
  const snap = await getDocs(q);

  countEl.textContent = snap.size;
  tableBody.innerHTML = "";

  snap.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.data().entryName}</td>
      <td>${d.data().email}</td>
      <td>${d.data().tiebreaker}</td>
      <td>${d.data().submittedAt?.toDate().toLocaleString()}</td>
    `;
    tr.onclick = () => {
      detailsEl.textContent = JSON.stringify(
        d.data().picks,
        null,
        2
      );
    };
    tableBody.appendChild(tr);
  });
}
