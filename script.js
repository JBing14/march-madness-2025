import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ==============================
   TOURNAMENT DATA
================================ */

const tournament = {
  regions: {
    east: [
      ["1 Auburn", "16 Alabama St"],
      ["8 Louisville", "9 Creighton"],
      ["5 Michigan", "12 UC San Diego"],
      ["4 Texas A&M", "13 Yale"],
      ["6 Ole Miss", "11 San Diego St"],
      ["3 Iowa St", "14 Lipscomb"],
      ["7 Marquette", "10 New Mexico"],
      ["2 Michigan St", "15 Bryant"]
    ]
  },
  rounds: 4
};

/* ==============================
   DOM REFERENCES
================================ */

let bracketEl;

/* ==============================
   HELPER FUNCTIONS
================================ */

function clearDownstream(region, round, game) {
  const maxRound = tournament.rounds;

  for (let r = round + 1; r <= maxRound; r++) {
    const g = Math.ceil(game / Math.pow(2, r - round));

    const slots = document.querySelectorAll(
      `.team[data-region="${region}"][data-round="${r}"][data-game="${g}"]`
    );

    slots.forEach(slot => {
      slot.textContent = "";
      slot.classList.add("empty");
    });
  }
}

function handlePick(teamBtn) {
  if (teamBtn.classList.contains("empty") && teamBtn.textContent === "") return;

  const region = teamBtn.dataset.region;
  const round = Number(teamBtn.dataset.round);
  const game = Number(teamBtn.dataset.game);
  const teamName = teamBtn.textContent;

  // Clear everything downstream first
  clearDownstream(region, round, game);

  const nextRound = round + 1;
  const nextGame = Math.ceil(game / 2);

  const targets = document.querySelectorAll(
    `.team[data-region="${region}"][data-round="${nextRound}"][data-game="${nextGame}"]`
  );

  if (!targets.length) return;

  // Determine which slot to fill (0 or 1)
  const slotIndex = (game % 2 === 1) ? 0 : 1;

  targets[slotIndex].textContent = teamName;
  targets[slotIndex].classList.remove("empty");
}

function collectPicks() {
  const picks = {};

  document.querySelectorAll(".team").forEach(btn => {
    if (!btn.classList.contains("empty")) {
      const key = `${btn.dataset.region}_R${btn.dataset.round}_G${btn.dataset.game}`;
      picks[key] = btn.textContent;
    }
  });

  return picks;
}

async function getEntryNumber(name, email) {
  const q = query(
    collection(db, "brackets"),
    where("nameBase", "==", name),
    where("email", "==", email)
  );

  const snapshot = await getDocs(q);
  return snapshot.size + 1;
}

/* ==============================
   RENDER BRACKET
================================ */

function renderBracket() {
  bracketEl.innerHTML = "";

  Object.entries(tournament.regions).forEach(([regionName, games]) => {
    const regionEl = document.createElement("div");
    regionEl.className = "region";
    regionEl.dataset.region = regionName;

    regionEl.innerHTML = `<h2>${regionName.toUpperCase()}</h2>`;

    for (let round = 1; round <= tournament.rounds; round++) {
      const roundEl = document.createElement("div");
      roundEl.className = `round round-${round}`;

      // CORRECT matchup count (halves every round)
      const matchupCount = games.length / Math.pow(2, round - 1);

      for (let game = 1; game <= matchupCount; game++) {
        const matchupEl = document.createElement("div");
        matchupEl.className = "matchup";

        // EVERY matchup always has 2 slots
        for (let slot = 0; slot < 2; slot++) {
          const btn = document.createElement("button");
          btn.className = "team empty";
          btn.dataset.region = regionName;
          btn.dataset.round = round;
          btn.dataset.game = game;

          // Only Round 1 gets preset teams
          if (round === 1) {
            btn.textContent = games[(game - 1)][slot];
            btn.classList.remove("empty");
          }

          btn.addEventListener("click", () => handlePick(btn));
          matchupEl.appendChild(btn);
        }

        roundEl.appendChild(matchupEl);
      }

      regionEl.appendChild(roundEl);
    }

    bracketEl.appendChild(regionEl);
  });
}
/* ==============================
   SUBMISSION HANDLER
================================ */

async function submitBracket() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const tiebreaker = document.getElementById("tiebreaker").value;

  if (!name || !email || !tiebreaker) {
    alert("Please fill out all fields.");
    return;
  }

  const picks = collectPicks();

  if (Object.keys(picks).length === 0) {
    alert("You must make at least one pick.");
    return;
  }

  const entryNumber = await getEntryNumber(name, email);
  const entryName = `${name} ${entryNumber}`;

  await addDoc(collection(db, "brackets"), {
    name: entryName,
    nameBase: name,
    email,
    tiebreaker: Number(tiebreaker),
    picks,
    timestamp: serverTimestamp(),
    points: {}
  });

  document.querySelectorAll(".team").forEach(btn => {
    btn.disabled = true;
  });

  document.getElementById("submitBracket").disabled = true;
  alert("Bracket submitted successfully!");
}

/* ==============================
   INIT
================================ */

document.addEventListener("DOMContentLoaded", () => {
  bracketEl = document.getElementById("bracket");
  renderBracket();

  document
    .getElementById("submitBracket")
    .addEventListener("click", submitBracket);
});



