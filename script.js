import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* ================= FIREBASE ================= */

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



/* ================= STATE ================= */

let locked = false;
let champion = null;

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

const picks = { round1: {}, round2: {}, round3: {}, round4: {} };

/* ================= DOM READY ================= */

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("submitBtn").addEventListener("click", submitBracket);
  render();
});

/* ================= RENDER ================= */

function renderRound(container, data, onPick) {
  const title = container.querySelector("strong")?.textContent || "";
  container.innerHTML = `<strong>${title}</strong>`;

  data.forEach((m, i) => {
    const div = document.createElement("div");
    div.className = "matchup";

    m.forEach(team => {
      const btn = document.createElement("button");
      btn.className = "team";
      btn.textContent = team || "";
      btn.disabled = !team || locked;
      if (team && onPick) btn.onclick = () => onPick(i, team);
      div.appendChild(btn);
    });

    container.appendChild(div);
  });
}

function renderChampion() {
  const c = document.getElementById("champion");
  c.innerHTML = "<strong>Champion</strong>";
  if (!champion) return;

  const btn = document.createElement("button");
  btn.className = "team champion";
  btn.textContent = champion;
  btn.disabled = true;
  c.appendChild(btn);
}

function render() {
  renderRound(document.getElementById("round1"), round1, pickRound1);
  renderRound(document.getElementById("round2"), round2, pickRound2);
  renderRound(document.getElementById("round3"), round3, pickRound3);
  renderRound(document.getElementById("round4"), round4, pickRound4);
  renderChampion();
}

/* ================= LOGIC ================= */

function clearRound(r) {
  r.forEach(m => { m[0] = null; m[1] = null; });
}

function pickRound1(i, team) {
  if (locked) return;
  picks.round1[`game${i + 1}`] = team;
  round2[Math.floor(i / 2)][i % 2] = team;
  clearRound(round3); clearRound(round4); champion = null;
  render();
}

function pickRound2(i, team) {
  if (locked) return;
  picks.round2[`game${i + 1}`] = team;
  round3[Math.floor(i / 2)][i % 2] = team;
  clearRound(round4); champion = null;
  render();
}

function pickRound3(i, team) {
  if (locked) return;
  picks.round3[`game${i + 1}`] = team;
  round4[0][i] = team;
  champion = null;
  render();
}

function pickRound4(_, team) {
  if (locked) return;
  picks.round4.game1 = team;
  champion = team;
  render();
}

/* ================= SUBMIT ================= */

async function submitBracket() {
  console.log("SUBMIT CLICKED");

  if (locked) return;

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const tiebreaker = document.getElementById("tiebreaker").value.trim();

  if (!name || !email || !tiebreaker || !champion) {
    alert("Complete the bracket and all fields.");
    return;
  }

  const q = query(collection(db, "brackets"), where("email", "==", email));
  const snap = await getDocs(q);
  const entryNumber = snap.size + 1;

  const serialize = (round, roundPicks) => {
    const out = {};
    round.forEach((m, i) => {
      out[`game${i + 1}`] = {
        slot1: m[0],
        slot2: m[1],
        pick: roundPicks[`game${i + 1}`] || null
      };
    });
    return out;
  };

  locked = true;

  await addDoc(collection(db, "brackets"), {
    name,
    email,
    entryName: `${name} ${entryNumber}`,
    tiebreaker: Number(tiebreaker),
    submittedAt: serverTimestamp(),
    picks: {
      round1: serialize(round1, picks.round1),
      round2: serialize(round2, picks.round2),
      round3: serialize(round3, picks.round3),
      round4: serialize(round4, picks.round4),
      champion
    }
  });

  alert("Bracket submitted and locked.");
  render();
}


