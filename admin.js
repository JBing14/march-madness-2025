import { db, auth } from "./firebase.js";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  query,
  orderBy
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
const round2Controls = document.getElementById("round2Controls");
const round3Controls = document.getElementById("round3Controls");
const round4Controls = document.getElementById("round4Controls");
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
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
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
  await buildRound1Controls();
  await loadResults();
  await loadSubmissions();
}

/* ================= BUILD ROUND 1 ================= */

async function buildRound1Controls() {
  round1Controls.innerHTML = "";
  round2Controls.innerHTML = "";
  round3Controls.innerHTML = "";
  round4Controls.innerHTML = "";
  championSelect.innerHTML = `<option value="">Select Champion</option>`;

  const snap = await getDocs(collection(db, "brackets"));
  if (snap.empty) return;

  const round1 = snap.docs[0].data().picks.round1;

  Object.entries(round1).forEach(([game, data]) => {
    round1Controls.appendChild(
      createSelect(game, [data.slot1, data.slot2], 1)
    );
  });
}

/* ================= SELECT CREATION ================= */

function createSelect(game, options, level) {
  const sel = document.createElement("select");
  sel.dataset.game = game;
  sel.dataset.level = level;
  sel.innerHTML = `<option value="">${game}</option>`;
  options.forEach(t => sel.appendChild(new Option(t, t)));
  sel.onchange = () => rebuildFromLevel(level);
  return sel;
}

/* ================= CASCADE LOGIC ================= */

function rebuildFromLevel(level) {
  if (level <= 1) {
    buildNextRound(round1Controls, round2Controls, "round2", 2);
    round3Controls.innerHTML = "";
    round4Controls.innerHTML = "";
  }
  if (level <= 2) {
    buildNextRound(round2Controls, round3Controls, "round3", 3);
    round4Controls.innerHTML = "";
  }
  if (level <= 3) {
    buildNextRound(round3Controls, round4Controls, "round4", 4);
  }
  buildChampionOptions();
}

function buildNextRound(from, to, key, level) {
  to.innerHTML = "";
  officialResults[key] = {};

  const winners = [...from.querySelectorAll("select")]
    .map(s => s.value)
    .filter(Boolean);

  for (let i = 0; i < winners.length; i += 2) {
    if (!winners[i + 1]) break;
    to.appendChild(
      createSelect(
        `game${i / 2 + 1}`,
        [winners[i], winners[i + 1]],
        level
      )
    );
  }
}

function buildChampionOptions() {
  championSelect.innerHTML = `<option value="">Select Champion</option>`;
  [...round4Controls.querySelectorAll("select")].forEach(sel => {
    if (sel.value) championSelect.appendChild(new Option(sel.value, sel.value));
  });
}

/* ================= SAVE RESULTS ================= */

saveResultsBtn.onclick = async () => {
  officialResults.round1 = collect(round1Controls);
  officialResults.round2 = collect(round2Controls);
  officialResults.round3 = collect(round3Controls);
  officialResults.round4 = collect(round4Controls);
  officialResults.champion = championSelect.value;

  await setDoc(doc(db, "results", "current"), officialResults);
  scoreStatus.textContent = "Results saved.";
};

function collect(container) {
  const out = {};
  container.querySelectorAll("select").forEach(sel => {
    if (sel.value) out[sel.dataset.game] = sel.value;
  });
  return out;
}

/* ================= SCORING ================= */

scoreBtn.onclick = async () => {
  scoreStatus.textContent = "Scoring...";

  const snap = await getDocs(collection(db, "brackets"));

  for (const b of snap.docs) {
    const p = b.data().picks;
    const score = { r1: 0, r2: 0, r3: 0, r4: 0, r5: 0 };

    score.r1 = scoreRound(p.round1, officialResults.round1, POINTS.r1);
    score.r2 = scoreRound(p.round2, officialResults.round2, POINTS.r2);
    score.r3 = scoreRound(p.round3, officialResults.round3, POINTS.r3);
    score.r4 = scoreRound(p.round4, officialResults.round4, POINTS.r4);

    if (p.champion === officialResults.champion) {
      score.r5 = POINTS.r5;
    }

    await setDoc(doc(db, "scores", b.id), {
      entryName: b.data().entryName,
      total:
        score.r1 + score.r2 + score.r3 + score.r4 + score.r5,
      rounds: score
    });
  }

  scoreStatus.textContent = "Scoring complete.";
};

function scoreRound(picks, results, pts) {
  let sum = 0;
  for (const g in results || {}) {
    if (picks?.[g]?.pick === results[g]) sum += pts;
  }
  return sum;
}

/* ================= SUBMISSIONS ================= */

async function loadSubmissions() {
  const q = query(collection(db, "brackets"), orderBy("submittedAt", "desc"));
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
    tr.onclick = () =>
      (detailsEl.textContent = JSON.stringify(d.data().picks, null, 2));
    tableBody.appendChild(tr);
  });
}
