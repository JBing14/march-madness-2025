import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* =====================================================
   GLOBAL STATE
===================================================== */

let locked = false;

const REGIONS = ["east", "south", "west", "midwest"];
const MAX_ROUND = 4;

// picks[region].round1.game1 = "Team Name"
const picks = {};
REGIONS.forEach(r => {
  picks[r] = {
    round1: {},
    round2: {},
    round3: {},
    round4: {},
    finalFour: ""
  };
});

/* =====================================================
   INIT
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".slot").forEach(slot => {
    slot.addEventListener("click", () => {
      if (locked) return;
      if (slot.classList.contains("empty")) return;

      const region = slot.dataset.region;
      const round = Number(slot.dataset.round);
      const game = Number(slot.dataset.game);
      const team = slot.textContent.trim();

      pickRegionRound(region, round, game, team, slot);
    });
  });

  const submitBtn = document.getElementById("submitBracket");
  if (submitBtn) {
    submitBtn.addEventListener("click", submitBracket);
  }
});

/* =====================================================
   CORE ENGINE (THIS IS THE IMPORTANT PART)
===================================================== */

function pickRegionRound(region, round, game, team, slotEl) {
  if (!region || !round || !game || !team) return;

  // 1. Enforce one pick per matchup (visual)
  const match = slotEl.closest(".match");
  if (match) {
    match.querySelectorAll(".slot").forEach(s => {
      s.classList.remove("selected");
    });
  }
  slotEl.classList.add("selected");

  // 2. Save pick
  picks[region][`round${round}`][`game${game}`] = team;

  // 3. Clear downstream picks BEFORE advancing
  clearDownstream(region, round);

  // 4. Advance to next round
  if (round < MAX_ROUND) {
    const nextGame = Math.ceil(game / 2);
    const target = document.querySelector(
      `.slot.empty[data-region="${region}"][data-round="${round + 1}"][data-game="${nextGame}"]`
    );

    if (target) {
      target.textContent = team;
      target.classList.remove("empty");
    }
  }

  // 5. Final Four
  if (round === MAX_ROUND) {
    picks[region].finalFour = team;
  }
}

/* =====================================================
   CLEAR DOWNSTREAM
===================================================== */

function clearDownstream(region, fromRound) {
  for (let r = fromRound + 1; r <= MAX_ROUND; r++) {
    picks[region][`round${r}`] = {};

    document
      .querySelectorAll(
        `.slot[data-region="${region}"][data-round="${r}"]`
      )
      .forEach(slot => {
        slot.textContent = "";
        slot.classList.add("empty");
        slot.classList.remove("selected");
      });
  }

  picks[region].finalFour = "";
}

/* =====================================================
   VALIDATION
===================================================== */

function bracketComplete() {
  return REGIONS.every(r => picks[r].finalFour);
}

/* =====================================================
   SUBMIT
===================================================== */

async function submitBracket() {
  if (locked) return;

  const name = document.getElementById("name")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const tiebreaker = document.getElementById("tiebreaker")?.value.trim();

  if (!name || !email || !tiebreaker) {
    alert("Please fill out name, email, and tiebreaker.");
    return;
  }

  if (!bracketComplete()) {
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

/* =====================================================
   CLICK BRIDGE — MATCH CHILD ELEMENTS
   This binds clicks to whatever elements live inside
   .match (divs, spans, etc.)
   Does NOT modify existing logic.
===================================================== */

(function () {
  if (window.__matchClickPatchApplied) return;
  window.__matchClickPatchApplied = true;

  document.addEventListener("click", function (e) {
    const teamEl = e.target.closest(".match > *");
    if (!teamEl) return;

    const match = teamEl.closest(".match");
    if (!match) return;

    // Ignore empty placeholders
    const teamName = teamEl.textContent.trim();
    if (!teamName) return;

    // Visual selection
    [...match.children].forEach(el =>
      el.classList.remove("selected")
    );
    teamEl.classList.add("selected");

    // Pull metadata from match container
    const region = match.dataset.region;
    const round = Number(match.dataset.round);
    const game = Number(match.dataset.game);

    if (
      typeof pickRegionRound !== "function" ||
      !region || !round || !game
    ) {
      console.warn("pickRegionRound unavailable or missing data", {
        region, round, game, teamName
      });
      return;
    }

    // 🔑 CALL YOUR EXISTING ENGINE
    pickRegionRound(region, round, game, teamName);
  });
})();
