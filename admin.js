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

const POINTS = { r1: 1, r5: 20 };

let officialResults = { round1: {}, champion: "" };

loginBtn.onclick = async () => {
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

async function initAdmin() {
  buildControls();
  await loadResults();
  await loadSubmissions();
}

function buildControls() {
  round1Controls.innerHTML = "";
  championSelect.innerHTML = `<option value="">Select Champion</option>`;
}

async function loadResults() {
  const snap = await getDoc(doc(db, "results", "current"));
  if (!snap.exists()) return;
  officialResults = snap.data();
}

saveResultsBtn.onclick = async () => {
  officialResults.round1 = {};
  document.querySelectorAll("#round1Controls select").forEach(sel => {
    if (sel.value) officialResults.round1[sel.dataset.game] = sel.value;
  });
  officialResults.champion = championSelect.value;
  await setDoc(doc(db, "results", "current"), officialResults);
  scoreStatus.textContent = "Results saved.";
};

scoreBtn.onclick = async () => {
  scoreStatus.textContent = "Scoring...";
  const brackets = await getDocs(collection(db, "brackets"));

  for (const b of brackets.docs) {
    const p = b.data().picks;
    let score = { r1: 0, r5: 0 };

    for (const game in officialResults.round1) {
      if (p.round1?.[game]?.pick === officialResults.round1[game]) {
        score.r1 += POINTS.r1;
      }
    }

    if (p.champion === officialResults.champion) {
      score.r5 = POINTS.r5;
    }

    await setDoc(doc(db, "scores", b.id), {
      entryName: b.data().entryName,
      total: score.r1 + score.r5,
      rounds: score
    });
  }

  scoreStatus.textContent = "Scoring complete.";
};

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
    tr.onclick = () => detailsEl.textContent = JSON.stringify(d.data().picks, null, 2);
    tableBody.appendChild(tr);
  });
}
