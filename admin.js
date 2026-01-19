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

/* =========================
   CONFIG
========================= */

const ADMIN_EMAIL = "jbgerloff@gmail.com";

/* =========================
   DOM ELEMENTS
========================= */

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

/* =========================
   CONSTANTS
========================= */

const POINTS = {
  r1: 1,
  r5: 20
};

const ROUND1_MATCHUPS = [
  ["Auburn", "Alabama St"],
  ["Louisville", "Creighton"],
  ["Michigan", "UC San Diego"],
  ["Texas A&M", "Yale"],
  ["Ole Miss", "San Diego St"],
  ["Iowa St", "Lipscomb"],
  ["Marquette", "New Mexico"],
  ["Michigan St", "Bryant"]
];

let officialResults = {
  round1: {},
  champion: ""
};

/* =========================
   AUTH
========================= */

loginBtn.onclick = async () => {
  loginError.textContent = "";
  try {
    await signInWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
  } catch (err) {
    loginError.textContent = err.message;
  }
};

logoutBtn.onclick = async () => {
  await signOut(auth);
};

onAuthStateChanged(auth, user => {
  if (!user || user.email !== ADMIN_EMAIL) {
    loginDiv.style.display = "block";
    dashboardDiv.style.display = "none";
    return;
  }

  loginDiv.style.display = "none";
  dashboardDiv.style.display = "block";
  adminEmailEl.textContent = user.email;

  initAdmin();
});

/* =========================
   INIT
========================= */

async function initAdmin() {
  buildRound1Controls();
  buildChampionOptions();
  await loadOfficialResults();
  await loadSubmissions();
}

/* =========================
   UI BUILDERS
========================= */

function buildRound1Controls() {
  round1Controls.innerHTML = "";

  ROUND1_MATCHUPS.forEach((m, i) => {
    const select = document.createElement("select");
    select.dataset.game = `game${i + 1}`;

    select.innerHTML = `
      <option value="">Game ${i + 1}</option>
      <option value="${m[0]}">${m[0]}</option>
      <option value="${m[1]}">${m[1]}</option>
    `;

    round1Controls.appendChild(select);
  });
}

function buildChampionOptions() {
  championSelect.innerHTML = `<option value="">Select Champion</option>`;

  ROUND1_MATCHUPS.flat().forEach(team => {
    const opt = document.createElement("option");
    opt.value = team;
    opt.textContent = team;
    championSelect.appendChild(opt);
  });
}

/* =========================
   RESULTS LOAD / SAVE
========================= */

async function loadOfficialResults() {
  const snap = await getDoc(doc(db, "results", "current"));
  if (!snap.exists()) return;

  officialResults = snap.data();

  Object.entries(officialResults.round1 || {}).forEach(([game, winner]) => {
    const sel = document.querySelector(`select[data-game="${game}"]`);
    if (sel) sel.value = winner;
  });

  championSelect.value = officialResults.champion || "";
}

saveResultsBtn.onclick = async () => {
  officialResults.round1 = {};

  document
    .querySelectorAll("#round1Controls select")
    .forEach(select => {
      if (select.value) {
        officialResults.round1[select.dataset.game] = select.value;
      }
    });

  officialResults.champion = championSelect.value;

  await setDoc(doc(db, "results", "current"), officialResults);

  scoreStatus.textContent = "Results saved.";
};

/* =========================
   SCORING
========================= */

scoreBtn.onclick = async () => {
  if (!auth.currentUser || auth.currentUser.email !== ADMIN_EMAIL) {
    alert("Admin access only.");
    return;
  }

  scoreStatus.textContent = "Loading official results...";

  const resultsSnap = await getDoc(doc(db, "results", "current"));
  if (!resultsSnap.exists()) {
    alert("No official results found. Save results first.");
    return;
  }

  officialResults = resultsSnap.data();

  scoreStatus.textContent = "Scoring brackets...";

  const snap = await getDocs(collection(db, "brackets"));

  for (const docSnap of snap.docs) {
    const p = docSnap.data().picks;

    let score = {
      r1: 0,
      r5: 0
    };

    // ROUND 1
    for (const game in officialResults.round1) {
      const winner = officialResults.round1[game];
      const userPick = p.round1?.[game]?.pick;

      if (userPick === winner) {
        score.r1 += POINTS.r1;
      }
    }

    // CHAMPION
    if (p.champion === officialResults.champion) {
      score.r5 = POINTS.r5;
    }

    const total = score.r1 + score.r5;

    await setDoc(doc(db, "scores", docSnap.id), {
      entryName: docSnap.data().entryName,
      total,
      rounds: score
    });
  }

  scoreStatus.textContent = "Scoring complete.";
};

/* =========================
   SUBMISSIONS TABLE
========================= */

async function loadSubmissions() {
  tableBody.innerHTML = "";

  const q = query(
    collection(db, "brackets"),
    orderBy("submittedAt", "desc")
  );

  const snap = await getDocs(q);
  countEl.textContent = snap.size;

  snap.forEach(docSnap => {
    const d = docSnap.data();

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.entryName}</td>
      <td>${d.email}</td>
      <td>${d.tiebreaker}</td>
      <td>${d.submittedAt?.toDate().toLocaleString() || ""}</td>
    `;

    tr.onclick = () => {
      detailsEl.textContent = JSON.stringify(d.picks, null, 2);
    };

    tableBody.appendChild(tr);
  });
}
