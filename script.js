import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* =====================================================
   CONFIG
===================================================== */

const REGIONS = ["east", "south", "west", "midwest"];
const MAX_ROUND = 4;

/* =====================================================
   STATE
===================================================== */

let locked = false;

const picks = {
  east: initRegion(),
  south: initRegion(),
  west: initRegion(),
  midwest: initRegion()
};

/* =====================================================
   INIT
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".slot").forEach(slot => {
    slot.addEventListener("click", () => handlePick(slot));
  });

  document
    .getElementById("submitBracket")
    .addEventListener("click", submitBracket);
});

/* =====================================================
   HELPERS
===================================================== */

function initRegion() {
  return {
    round1: {},
    round2: {},
    round3: {},
    round4: {},
    finalFour: ""
  };
}

function getRegion(slot) {
  return slot.dataset.region;
}

function getRound(slot) {
  return Number(slot.dataset.round);
}

function getGame(slot) {
  return Number(slot.dataset.game);
}

function getMatchSlots(region, round, game) {
  return [
    ...document.querySelectorAll(
      `.slot[data-region="${region}"][data-round="${round}"][data-game="${game}"]`
    )
  ];
}

function getNextSlot(region, round, game) {
  return document.querySelector(
    `.slot.empty[data-region="${region}"][data-round="${round + 1}"][data-game="${Math.ceil(game / 2)}"]`
  );
}

/* =====================================================
   PICK HANDLING
===================================================== */

function handlePick(slot) {
  if (locked) return;
  if (slot.classList.contains("empty")) return;

  const region = getRegion(slot);
  const round = getRound(slot);
  const game = getGame(slot);
  const team = slot.textContent.trim();

  // Enforce one pick per matchup (visual + logical)
  getMatchSlots(region, round, game).forEach(s => {
    s.classList.remove("picked");
  });
  slot.classList.add("picked");

  // Save pick
  picks[region][`round${round}`][`game${game}`] = team;

  // Clear everything downstream BEFORE advancing
  clearDownstream(region, round, game);

  // Advance to next round
  if (round < MAX_ROUND) {
    const target = getNextSlot(region, round, game);
    if (target) {
      target.textContent = team;
      target.classList.remove("empty");
    }
  }

  // Final Four winner
  if (round === MAX_ROUND) {
    picks[region].finalFour = team;
  }
}

/* =====================================================
   CLEAR DOWNSTREAM
===================================================== */

function clearDownstream(region, round, game) {
  for (let r = round + 1; r <= MAX_ROUND; r++) {
    const affectedGames = Object.keys(picks[region][`round${r}`] || {});
    affectedGames.forEach(g => {
      delete picks[region][`round${r}`][g];
    });

    document
      .querySelectorAll(
        `.slot[data-region="${region}"][data-round="${r}"]`
      )
      .forEach(slot => {
        slot.textContent = "";
        slot.classList.add("empty");
        slot.classList.remove("picked");
      });
  }

  picks[region].finalFour = "";
}

/* =====================================================
   VALIDATION
===================================================== */

function isComplete() {
  return REGIONS.every(r => picks[r].finalFour);
}

/* =====================================================
   SUBMIT
===================================================== */

async function submitBracket() {
  if (locked) return;

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const tiebreaker = document.getElementById("tiebreaker").value.trim();

  if (!name || !email || !tiebreaker) {
    alert("Please fill out name, email, and tiebreaker.");
    return;
  }

  if (!isComplete()) {
    alert("Please complete all four regions.");
    return;
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

  alert("Bracket submitted successfully!");
}
