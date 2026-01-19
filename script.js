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
  apiKey: "AIzaSyB27qEP0k2PR8Zz_z_A8KjGcXvxX9OROQA",
  authDomain: "marchmadness2025-24f04.firebaseapp.com",
  projectId: "marchmadness2025-24f04",
  storageBucket: "marchmadness2025-24f04.firebasestorage.app",
  messagingSenderId: "916205408985",
  appId: "1:916205408985:web:1dd57fc8704c6c0e8fe4c8",
  measurementId: "G-TKTZB2FFRB"
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

  const round2 = Array.from({ length: 4 }, () => [null, null]);
  const round3 = Array.from({ length: 2 }, () => [null, null]);
  const round4 = [[null, null]];

  let champion = null;

  /* =========================
     RENDERING
  ========================= */

  function renderRound(container, matchups, handler) {
    const header = container.querySelector("strong");
    container.innerHTML = "";
    if (header) container.appendChild(header);

    matchups.forEach((matchup, matchupIndex) => {
      const matchEl = document.createElement("div");
      matchEl.className = "matchup";

      matchup.forEach((team, slotIndex) => {
        const btn = document.createElement("button");
        btn.className = "team";
        btn.textContent = team || "";

        if (team && handler && !isLocked) {
          btn.onclick = () => handler(matchupIndex, slotIndex, team);
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
    round.forEach(matchup => {
      matchup[0] = null;
      matchup[1] = null;
    });
  }

  function handleRound1Pick(matchupIndex, slotIndex, team) {
    if (isLocked) return;

    round2[Math.floor(matchupIndex / 2)][matchupIndex % 2] = team;
    clearRound(round3);
    clearRound(round4);
    champion = null;

    render();
  }

  function handleRound2Pick(matchupIndex, slotIndex, team) {
    if (isLocked) return;

    round3[Math.floor(matchupIndex / 2)][matchupIndex % 2] = team;
    clearRound(round4);
    champion = null;

    render();
  }

  function handleRound3Pick(matchupIndex, slotIndex, team) {
    if (isLocked) return;

    round4[0][matchupIndex] = team;
    champion = null;

    render();
  }

  function handleRound4Pick(matchupIndex, slotIndex, team) {
    if (isLocked) return;

    champion = team;
    render();
  }

  /* =========================
     FIRESTORE SAFE SERIALIZE
  ========================= */

  function serializeRound(round) {
    const obj = {};
    for (let i = 0; i < round.length; i++) {
      obj[`game${i + 1}`] = {
        slot1: round[i][0] || null,
        slot2: round[i][1] || null
      };
    }
    return obj;
  }

  /* =========================
     SUBMIT (GLOBAL)
  ========================= */

  window.submitBracket = async function () {
    if (isLocked) return;

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const tiebreaker = document.getElementById("tiebreaker").value.trim();

    if (!name || !email || !tiebreaker) {
      alert("Please enter name, email, and tiebreaker.");
      return;
    }

    if (!champion) {
      alert("Please complete the entire bracket.");
      return;
    }

    isLocked = true;

    try {
      const q = query(
        collection(db, "brackets"),
        where("email", "==", email)
      );

      const snapshot = await getDocs(q);
      const entryNumber = snapshot.size + 1;

      const submission = {
        name,
        email,
        entryName: `${name} ${entryNumber}`,
        tiebreaker: Number(tiebreaker),
        submittedAt: serverTimestamp(),
        picks: {
          round1: serializeRound(round1),
          round2: serializeRound(round2),
          round3: serializeRound(round3),
          round4: serializeRound(round4),
          champion
        }
      };

      await addDoc(collection(db, "brackets"), submission);

      alert("Bracket submitted successfully!");
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

