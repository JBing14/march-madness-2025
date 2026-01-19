import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* ================= CONFIG ================= */

const REGIONS = ["east", "west", "south", "midwest"];

/* ================= STATE ================= */

const picks = {};
let locked = false;

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
  REGIONS.forEach(region => {
    picks[region] = {
      round1: {},
      round2: {},
      round3: {},
      round4: {},
      finalFour: ""
    };

    wireRegion(region);
  });

  document
    .getElementById("submitBracket")
    .addEventListener("click", submitBracket);
});

/* ================= REGION LOGIC ================= */

function wireRegion(region) {
  document
    .querySelectorAll(`.team[data-region="${region}"]`)
    .forEach(btn => {
      btn.addEventListener("click", () => {
        if (locked) return;
        advance(region, btn);
      });
    });
}

function advance(region, btn) {
  const round = btn.dataset.round;
  const game = btn.dataset.game;
  const team = btn.textContent;

  picks[region][`round${round}`][`game${game}`] = { pick: team };

  const nextRound = parseInt(round) + 1;
  const nextGame = Math.ceil(game / 2);

  const targets = document.querySelectorAll(
    `.team[data-region="${region}"][data-round="${nextRound}"][data-game="${nextGame}"]`
  );

  if (targets.length) {
    targets.forEach(t => {
      if (t.classList.contains("empty")) {
        t.textContent = team;
        t.classList.remove("empty");
      }
    });

    clearDownstream(region, nextRound, nextGame);
  }

  // Final Four (Round 4 winner)
  if (round === "4") {
    picks[region].finalFour = team;
  }
}

function clearDownstream(region, round, game) {
  for (let r = round + 1; r <= 4; r++) {
    const gStart = Math.ceil(game / Math.pow(2, r - round));
    document
      .querySelectorAll(
        `.team[data-region="${region}"][data-round="${r}"][data-game="${gStart}"]`
      )
      .forEach(t => {
        t.textContent = "";
        t.classList.add("empty");
      });

    delete picks[region][`round${r}`][`game${gStart}`];
  }

  picks[region].finalFour = "";
}

/* ================= SUBMIT ================= */

async function submitBracket() {
  if (locked) return;

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const tiebreaker = document.getElementById("tiebreaker").value.trim();

  if (!name || !email || !tiebreaker) {
    alert("Please fill out name, email, and tiebreaker.");
    return;
  }

  // Validate all regions have Final Four pick
  for (const r of REGIONS) {
    if (!picks[r].finalFour) {
      alert(`Please complete the ${r.toUpperCase()} region.`);
      return;
    }
  }

  locked = true;
  document.body.classList.add("locked");

  await addDoc(collection(db, "brackets"), {
    name,
    email,
    tiebreaker: Number(tiebreaker),
    picks,
    submittedAt: serverTimestamp()
  });

  alert("Bracket submitted!");
}
