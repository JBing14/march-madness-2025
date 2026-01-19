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

/* ===== FIREBASE INIT ===== */

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

/* ===== DOM READY ===== */

document.addEventListener("DOMContentLoaded", () => {

  const round1El = document.getElementById("round-1-left");
  const round2El = document.getElementById("round-2-left");
  const round3El = document.getElementById("round-3-left");
  const round4El = document.getElementById("round-4-left");
  const champEl  = document.getElementById("round-5-left");

  let isLocked = false;

  /* ===== STATE ===== */

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

  // 🔑 ACTUAL USER PICKS
  const userPicks = {
    round1: {},
    round2: {},
    round3: {},
    round4: {}
  };

  /* ===== RENDER ===== */

  function renderRound(container, matchups, handler) {
    const header = container.querySelector("strong");
    container.innerHTML = "";
    if (header) container.appendChild(header);

    matchups.forEach((matchup, mi) => {
      const div = document.createElement("div");
      div.className = "matchup";

      matchup.forEach(team => {
        const btn = document.createElement("button");
        btn.className = "team";
        btn.textContent = team || "";
        btn.disabled = !team || isLocked;

        if (team && handler && !isLocked) {
          btn.onclick = () => handler(mi, team);
        }

        div.appendChild(btn);
      });

      container.appendChild(div);
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

  /* ===== LOGIC ===== */

  function clearRound(round) {
    round.forEach(m => { m[0] = null; m[1] = null; });
  }

  function handleRound1Pick(i, team) {
    if (isLocked) return;
    userPicks.round1[`game${i + 1}`] = team;
    round2[Math.floor(i / 2)][i % 2] = team;
    clearRound(round3); clearRound(round4); champion = null;
    render();
  }

  function handleRound2Pick(i, team) {
    if (isLocked) return;
    userPicks.round2[`game${i + 1}`] = team;
    round3[Math.floor(i / 2)][i % 2] = team;
    clearRound(round4); champion = null;
    render();
  }

  function handleRound3Pick(i, team) {
    if (isLocked) return;
    userPicks.round3[`game${i + 1}`] = team;
    round4[0][i] = team;
    champion = null;
    render();
  }

  function handleRound4Pick(_, team) {
    if (isLocked) return;
    userPicks.round4.game1 = team;
    champion = team;
    render();
  }

  /* ===== SERIALIZE ===== */

  function serializeRound(round, picks) {
    const out = {};
    round.forEach((m, i) => {
      const key = `game${i + 1}`;
      out[key] = {
        slot1: m[0],
        slot2: m[1],
        pick: picks[key] || null
      };
    });
    return out;
  }

  /* ===== SUBMIT ===== */

  window.submitBracket = async () => {
    if (isLocked) return;

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const tiebreaker = document.getElementById("tiebreaker").value.trim();

    if (!name || !email || !tiebreaker || !champion) {
      alert("Complete bracket and fill out all fields.");
      return;
    }

    isLocked = true;

    const q = query(collection(db, "brackets"), where("email", "==", email));
    const snap = await getDocs(q);
    const entryNumber = snap.size + 1;

    await addDoc(collection(db, "brackets"), {
      name,
      email,
      entryName: `${name} ${entryNumber}`,
      tiebreaker: Number(tiebreaker),
      submittedAt: serverTimestamp(),
      picks: {
        round1: serializeRound(round1, userPicks.round1),
        round2: serializeRound(round2, userPicks.round2),
        round3: serializeRound(round3, userPicks.round3),
        round4: serializeRound(round4, userPicks.round4),
        champion
      }
    });

    alert("Bracket submitted!");
    render();
  };

  render();
});
