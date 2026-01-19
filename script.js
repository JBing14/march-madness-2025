import { db } from "./firebase.js";

/* ==============================
   TOURNAMENT DATA
================================ */

const tournament = {
  regions: {
    east: [
      ["Auburn", "Alabama St"],
      ["Louisville", "Creighton"],
      ["Michigan", "UC San Diego"],
      ["Texas A&M", "Yale"],
      ["Ole Miss", "San Diego St"],
      ["Iowa St", "Lipscomb"],
      ["Marquette", "New Mexico"],
      ["Michigan St", "Bryant"]
    ]
  }
};

/* ==============================
   RENDER BRACKET
================================ */

function renderBracket() {
  const bracketEl = document.getElementById("bracket");
  bracketEl.innerHTML = "";

  Object.entries(tournament.regions).forEach(([region, games]) => {
    const regionEl = document.createElement("div");
    regionEl.className = "region";
    regionEl.innerHTML = `<h2>${region.toUpperCase()}</h2>`;

    let currentRound = games;

    let roundNumber = 1;

    while (currentRound.length > 1) {
      const roundEl = document.createElement("div");
      roundEl.className = `round round-${roundNumber}`;

      const nextRound = [];

      currentRound.forEach((matchup, index) => {
        const matchupEl = document.createElement("div");
        matchupEl.className = "matchup";

        matchup.forEach(team => {
          const btn = document.createElement("button");
          btn.className = "team";
          btn.textContent = team;

          btn.addEventListener("click", () => {
            // clear selection in this matchup
            matchupEl.querySelectorAll(".team").forEach(b =>
              b.classList.remove("selected")
            );
            btn.classList.add("selected");

            // advance winner
            const targetIndex = Math.floor(index / 2);

            if (!nextRound[targetIndex]) {
              nextRound[targetIndex] = [];
            }

            nextRound[targetIndex][index % 2] = team;

            renderNextRounds(regionEl, roundNumber + 1, nextRound);
          });

          matchupEl.appendChild(btn);
        });

        roundEl.appendChild(matchupEl);
      });

      regionEl.appendChild(roundEl);

      currentRound = nextRound;
      roundNumber++;
    }

    bracketEl.appendChild(regionEl);
  });
}

/* ==============================
   RENDER FUTURE ROUNDS
================================ */

function renderNextRounds(regionEl, startRound, rounds) {
  // remove existing future rounds
  Array.from(regionEl.querySelectorAll(".round")).forEach(round => {
    if (Number(round.className.match(/round-(\d+)/)[1]) >= startRound) {
      round.remove();
    }
  });

  let roundNumber = startRound;
  let current = rounds;

  while (current.length && current.length >= 1) {
    const roundEl = document.createElement("div");
    roundEl.className = `round round-${roundNumber}`;

    const next = [];

    current.forEach((matchup, index) => {
      if (!matchup || matchup.length < 2) return;

      const matchupEl = document.createElement("div");
      matchupEl.className = "matchup";

      matchup.forEach(team => {
        const btn = document.createElement("button");
        btn.className = "team";
        btn.textContent = team;

        btn.addEventListener("click", () => {
          matchupEl.querySelectorAll(".team").forEach(b =>
            b.classList.remove("selected")
          );
          btn.classList.add("selected");

          const targetIndex = Math.floor(index / 2);
          if (!next[targetIndex]) next[targetIndex] = [];
          next[targetIndex][index % 2] = team;

          renderNextRounds(regionEl, roundNumber + 1, next);
        });

        matchupEl.appendChild(btn);
      });

      roundEl.appendChild(matchupEl);
    });

    regionEl.appendChild(roundEl);

    current = next;
    roundNumber++;
  }
}

/* ==============================
   INIT
================================ */

document.addEventListener("DOMContentLoaded", renderBracket);
