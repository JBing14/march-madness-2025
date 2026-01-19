import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* =========================
   FIREBASE INIT
========================= */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================
   DOM READY
========================= */

document.addEventListener("DOMContentLoaded", function () {

  /* =========================
     ELEMENTS
  ========================= */

  const round1El = document.getElementById("round-1-left");
  const round2El = document.getElementById("round-2-left");
  const round3El = document.getElementById("round-3-left");
  const round4El = document.getElementById("round-4-left");
  const champEl  = document.getElementById("round-5-left");

  if (!round1El || !round2El || !round3El || !round4El || !champEl) {
    console.error("Missing round containers");
    return;
  }

  let isLocked = false;

  /* =========================
     STATE
  ========================= */

  const round1 = [
    ["Auburn", "Alabama St"],
    ["Louisville", "Creighton"],
    ["Michigan", "UC San Diego"],
    ["Texas A&M", "Yale"],
    ["Ole Miss", "San Diego St"],
    ["Iowa St", "Lipscomb"],
    ["Marquette", "New Mexico"],
    ["Michigan St", "Bryant"]
  ];

  const round2 = Array(4).fill(null).map(() => [null, null]);
  const round3 = Array(2).fill(null).map(() => [null, null]);
  const round4 = [[null, null]];

  let champion = null;

  /* =========================
     RENDERING
  ========================= */

  function renderRound(container, matchups, handler) {
    const header = container.querySelector("strong");
    container.innerHTML = "";
    if (header) container.appendChild(header);

    matchups.forEach((matchup, mi) => {
      const matchEl = document.createElement("div");
      matchEl.className = "matchup";

      matchup.forEach((team, si) => {
        const btn = document.createElement("button");
        btn.className = "team";
        btn.textContent = team || "";

        if (team && handler && !isLocked) {
          btn.onclick = () => handler(mi, si, team);
        } else {
          btn.disabled = true;
        }

        matchEl.appendChild(btn);
      });

      container.appendChild(matchEl);
    });
  }

  function renderChampion() {
    champEl.innerHTML = "<strong>Champion</strong>";
    if (!champion) return;

    const btn = document.createElement("button");
    btn.className = "team champion";
    btn.textContent = champion;
    btn.disabled = true;

    champEl.appendChild(btn);
  }

  function render() {
    renderRound(round1El, round1, handleRound1Pick);
    renderRound(round2El, round2, handleRound2Pick);
    renderRound(round3El, round3, handleRound3Pick);
    renderRound(round4El, round4, handleRound4Pick);
    renderChampion();
  }

  /* =========================
     LOGIC
  ========================= */

  function clearRound(round) {
    round.forEach(m => {
      m[0] = null;
      m[1] = null;
    });
  }

  function handleRound1Pick(i, j, team) {
    if (isLocked) return;
    round2[Math.floor(i / 2)][i % 2] = team;
    clearRound(round3);
    clearRound(round4);
    champion = null;
    render();
  }

  function handleRound2Pick(i, j, team) {
    if (isLocked) return;
    round3[Math.floor(i / 2)][i % 2] = team;
    clearRound(round4);
    champion = null;
    render();
  }

  function handleRound3Pick(i, j, team) {
    if (isLocked) return;
    round4[0][i] = team;
    champion = null;
    render();
  }

  function handleRound4Pick(i, j, team) {
    if (isLocked) return;
    champion = team;
    render();
  }

  /* =========================
     SUBMIT (GLOBAL)
  ========================= */

  window.submitBracket = async function () {
  console.log("Submit clicked");

  if (isLocked) return;

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const tiebreaker = document.getElementById("tiebreaker").value.trim();

  if (!name || !email || !tiebreaker) {
    alert("Fill out all fields.");
    return;
  }

  if (!champion) {
    alert("Complete the bracket.");
    return;
  }

  isLocked = true;

  try {
    console.log("Saving to Firestore…");

    const q = query(
      collection(db, "brackets"),
      where("email", "==", email)
    );

    const snap = await getDocs(q);
    const entryNumber = snap.size + 1;

    const submission = {
      name,
      email,
      entryName: `${name} ${entryNumber}`,
      tiebreaker: Number(tiebreaker),
      submittedAt: serverTimestamp(),
      picks: { round1, round2, round3, round4, champion }
    };

    await addDoc(collection(db, "brackets"), submission);

    console.log("Saved successfully", submission);
    alert("Bracket submitted!");

    render();

  } catch (err) {
    console.error("FIREBASE ERROR:", err);
    alert("Submission failed. Check console.");
    isLocked = false;
  }
};

  /* =========================
     INIT
  ========================= */

  render();

});

