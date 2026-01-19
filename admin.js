import { db, auth } from "./firebase.js";
import {
  collection, query, orderBy, getDocs, doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

/* ===== CONFIG ===== */
const ADMIN_EMAIL = "jbgerloff@gmail.com";

/* ===== DOM ===== */
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

/* ===== AUTH ===== */
loginBtn.onclick = async () => {
  loginError.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (e) {
    loginError.textContent = e.message;
  }
};

logoutBtn.onclick = async () => { await signOut(auth); };

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

/* ===== DATA ===== */
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

const POINTS = { r1: 1, r2: 3, r3: 5, r4: 7, r5: 20, bonus: 5 };

let officialResults = {
  round1: {},
  champion: "",
  bonusWinners: {}
};

/* ===== INIT ===== */
async function initAdmin() {
  buildRound1Controls();
  buildChampionOptions();
  await loadExistingResults();
  await loadSubmissions();
}

/* ===== UI BUILDERS ===== */
function buildRound1Controls() {
  round1Controls.innerHTML = "";
  ROUND1_MATCHUPS.forEach((m, i) => {
    const sel = document.createElement("select");
    sel.dataset.game = `game${i + 1}`;
    sel.innerHTML = `
      <option value="">Game ${i + 1}</option>
      <option value="${m[0]}">${m[0]}</option>
      <option value="${m[1]}">${m[1]}</option>
    `;
    round1Controls.appendChild(sel);
  });
}

function buildChampionOptions() {
  championSelect.innerHTML = `<option value="">Select Champion</option>`;
  ROUND1_MATCHUPS.flat().forEach(t => {
    const o = document.createElement("option");
    o.value = t; o.textContent = t;
    championSelect.appendChild(o);
  });
}

/* ===== RESULTS SAVE/LOAD ===== */
saveResultsBtn.onclick = async () => {
  officialResults.round1 = {};
  document.querySelectorAll("#round1Controls select").forEach(sel => {
    if (sel.value) officialResults.round1[sel.dataset.game] = sel.value;
  });

  officialResults.champion = championSelect.value;

  const bonuses = {};
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    if (cb.checked) bonuses[cb.value] = cb.value;
  });
  officialResults.bonusWinners = bonuses;

  await setDoc(doc(db, "results", "current"), officialResults);
  scoreStatus.textContent = "Results saved.";
};

async function loadExistingResults() {
  const snap = await getDoc(doc(db, "results", "current"));
  if (!snap.exists()) return;
  officialResults = snap.data();

  Object.entries(officialResults.round1 || {}).forEach(([g, v]) => {
    const sel = document.querySelector(`select[data-game="${g}"]`);
    if (sel) sel.value = v;
  });
  championSelect.value = officialResults.champion || "";
}

/* ===== SCORING ===== */
scoreBtn.onclick = async () => {
  if (!auth.currentUser || auth.currentUser.email !== ADMIN_EMAIL) {
    alert("Admin only");
    return;
  }
  scoreStatus.textContent = "Scoring...";
  const bracketsSnap = await getDocs(collection(db, "brackets"));

  for (const d of bracketsSnap.docs) {
    const p = d.data().picks;
    let score = { r1: 0, r2: 0, r3: 0, r4: 0, r5: 0, bonus: 0 };

    for (const g in officialResults.round1) {
      const win = officialResults.round1[g];
      const pick = p.round1[g];
      if (pick && (pick.slot1 === win || pick.slot2 === win)) score.r1 += POINTS.r1;
    }
    if (p.champion === officialResults.champion) score.r5 = POINTS.r5;
    score.bonus = Object.keys(officialResults.bonusWinners).length * POINTS.bonus;

    const total = score.r1 + score.r2 + score.r3 + score.r4 + score.r5 + score.bonus;

    await setDoc(doc(db, "scores", d.id), {
      entryName: d.data().entryName,
      total,
      rounds: score
    });
  }
  scoreStatus.textContent = "Scoring complete.";
};

/* ===== SUBMISSIONS TABLE ===== */
async function loadSubmissions() {
  tableBody.innerHTML = "";
  const q = query(collection(db, "brackets"), orderBy("submittedAt", "desc"));
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
    tr.onclick = () => detailsEl.textContent = JSON.stringify(d.picks, null, 2);
    tableBody.appendChild(tr);
  });
}

