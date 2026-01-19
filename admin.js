import { db, auth } from "./firebase.js";
import {
  collection, query, orderBy, getDocs, doc, setDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const ADMIN_EMAIL = "jbgerloff@gmail.com";

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

const POINTS = { r1: 1, r5: 20, bonus: 5 };

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

let officialResults = { round1: {}, champion: "", bonusWinners: {} };

/* ===== AUTH ===== */

loginBtn.onclick = async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (e) {
    loginError.textContent = e.message;
  }
};

logoutBtn.onclick = () => signOut(auth);

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

/* ===== INIT ===== */

async function initAdmin() {
  buildControls();
  await loadSubmissions();
}

/* ===== UI ===== */

function buildControls() {
  round1Controls.innerHTML = "";
  ROUND1_MATCHUPS.forEach((m, i) => {
    const s = document.createElement("select");
    s.dataset.game = `game${i + 1}`;
    s.innerHTML = `
      <option value="">Game ${i + 1}</option>
      <option>${m[0]}</option>
      <option>${m[1]}</option>
    `;
    round1Controls.appendChild(s);
  });

  championSelect.innerHTML = `<option value="">Select Champion</option>`;
  ROUND1_MATCHUPS.flat().forEach(t => {
    const o = document.createElement("option");
    o.value = t; o.textContent = t;
    championSelect.appendChild(o);
  });
}

/* ===== SAVE RESULTS ===== */

saveResultsBtn.onclick = async () => {
  officialResults.round1 = {};
  document.querySelectorAll("#round1Controls select").forEach(s => {
    if (s.value) officialResults.round1[s.dataset.game] = s.value;
  });
  officialResults.champion = championSelect.value;
  await setDoc(doc(db, "results", "current"), officialResults);
  scoreStatus.textContent = "Results saved.";
};

/* ===== SCORE ===== */

scoreBtn.onclick = async () => {
  if (!auth.currentUser || auth.currentUser.email !== ADMIN_EMAIL) return;

  scoreStatus.textContent = "Scoring...";
  const snap = await getDocs(collection(db, "brackets"));

  for (const d of snap.docs) {
    const p = d.data().picks;
    let score = { r1: 0, r5: 0, bonus: 0 };

    for (const g in officialResults.round1) {
      if (p.round1[g]?.pick === officialResults.round1[g]) {
        score.r1 += POINTS.r1;
      }
    }

    if (p.champion === officialResults.champion) score.r5 = POINTS.r5;

    const total = score.r1 + score.r5;

    await setDoc(doc(db, "scores", d.id), {
      entryName: d.data().entryName,
      total,
      rounds: score
    });
  }

  scoreStatus.textContent = "Scoring complete.";
};

/* ===== SUBMISSIONS ===== */

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
