document.addEventListener("DOMContentLoaded", () => {
  const round1El = document.getElementById("round-1-left");
  const round2El = document.getElementById("round-2-left");

  // ---- DATA ----
  const round1Matchups = [
    ["Auburn", "Alabama St"],
    ["Louisville", "Creighton"],
    ["Michigan", "UC San Diego"],
    ["Texas A&M", "Yale"]
  ];

  // Each round 2 matchup starts empty
  const round2Matchups = [
    [null, null],
    [null, null]
  ];

  // ---- RENDER ----
  function render() {
    round1El.innerHTML = "";
    round2El.innerHTML = "";

    // Render Round 1
    round1Matchups.forEach((matchup, matchupIndex) => {
      const matchEl = document.createElement("div");
      matchEl.className = "matchup";

      matchup.forEach(team => {
        const btn = document.createElement("button");
        btn.className = "team";
        btn.textContent = team;

        btn.onclick = () => {
          selectWinner(matchupIndex, team);
        };

        matchEl.appendChild(btn);
      });

      round1El.appendChild(matchEl);
    });

    // Render Round 2
    round2Matchups.forEach(matchup => {
      const matchEl = document.createElement("div");
      matchEl.className = "matchup";

      matchup.forEach(team => {
        const slot = document.createElement("div");
        slot.className = "team";
        slot.textContent = team ?? "";
        matchEl.appendChild(slot);
      });

      round2El.appendChild(matchEl);
    });
  }

  // ---- LOGIC ----
  function selectWinner(round1Index, team) {
    const round2Index = Math.floor(round1Index / 2);
    const slotIndex = round1Index % 2;

    // Place team in correct slot
    round2Matchups[round2Index][slotIndex] = team;

    // Re-render immediately
    render();
  }

  render();
});
