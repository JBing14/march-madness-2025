import { db, auth } from "./firebase.js";

import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

/* =========================
   CONFIG
========================= */

// 🔒 CHANGE THIS TO YOUR ADMIN EMAIL
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

const tableBody = document.getElementById("table-body");
const detailsEl = document.getElementById("details");
const countEl = document.getElementById("count");
const adminEmailEl = document.getElementById("adminEmail");

const scoreBtn = document.getElementById("scoreBtn");
const scoreStatus = document.getElementById("scoreStatus");

/* =========================
   AUTH HANDLING
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

  loadSubmissions();
});

/* =========================
   LOAD SUBMISSIONS
========================= */

async function loadSubmissions() {
  tableBody.innerHTML = "";
  detailsEl.textContent = "Click an entry to view picks…";

  const q = query(
    collection(db, "brackets"),
    orderBy("submittedAt", "desc")
  );

  const snapshot = await getDocs(q);
  countEl.textContent = snapshot.size;

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${data.entryName}</td>
      <td>${data.email}</td>
      <td>${data.tiebreaker}</td>
      <td>${data.submittedAt?.toDate().toLocaleString() || ""}</td>
    `;

    tr.onclick = () => {
      detailsEl.textContent = JSON.stringify(data.picks, null, 2);
    };

    tableBody.appendChild(tr);
  });
}

/* =========================
   SCORING ENGINE v1
========================= */

const POINTS = {
  r1: 1,
  r2: 3,
  r3: 5,
  r4: 7,
  r5: 20,
  bonus: 5
};

// ⚠️ TEMPORARY — hardcoded official results
// We replace this with UI next
const OFFICIAL_RESULTS = {
  round1: {
    game1: "Auburn",
    game2: "Louisville",
    game3: "Michigan",
    game4: "Texas A&M"
  },
  round2: {},
  round3: {},
  round4: {},
  champion: "Auburn",
  bonusWinners: {
    bonus1: "Auburn",
    bonus2: "Michigan",
    bonus3: "Marquette",
    bonus4: "Iowa St"
  }
};

scoreBtn.onclick = async () => {
  scoreStatus.textContent = "Scoring brackets...";

  // Save official results
  await setDoc(doc(db, "results", "current"), OFFICIAL_RESULTS);

  const bracketsSnap = await getDocs(collection(db, "brackets"));

  for (const bracketDoc of bracketsSnap.docs) {
    const bracket = bracketDoc.data().picks;

    let score = {
      r1: 0,
      r2: 0,
      r3: 0,
      r4: 0,
      r5: 0,
      bonus: 0
    };

    // Round scorer
    function scoreRound(userRound, officialRound, pts) {
      let total = 0;

      for (const game in officialRound) {
        const winner = officialRound[game];
        const pick = userRound[game];

        if (
          pick &&
          (pick.slot1 === winner || pick.slot2 === winner)
        ) {
          total += pts;
        }
      }

      return total;
    }

    score.r1 = scoreRound(bracket.round1, OFFICIAL_RESULTS.round1, POINTS.r1);
    score.r2 = scoreRound(bracket.round2, OFFICIAL_RESULTS.round2, POINTS.r2);
    score.r3 = scoreRound(bracket.round3, OFFICIAL_RESULTS.round3, POINTS.r3);
    score.r4 = scoreRound(bracket.round4, OFFICIAL_RESULTS.round4, POINTS.r4);

    if (bracket.champion === OFFICIAL_RESULTS.champion) {
      score.r5 = POINTS.r5;
    }

    for (const key in OFFICIAL_RESULTS.bonusWinners) {
      const team = OFFICIAL_RESULTS.bonusWinners[key];

      if (
        Object.values(bracket.round1).some(
          g => g.slot1 === team || g.slot2 === team
        )
      ) {
        score.bonus += POINTS.bonus;
      }
    }

    const total =
      score.r1 + score.r2 + score.r3 + score.r4 + score.r5 + score.bonus;

    await setDoc(doc(db, "scores", bracketDoc.id), {
      entryName: bracketDoc.data().entryName,
      total,
      rounds: score
    });
  }

  scoreStatus.textContent = "Scoring complete.";
};
