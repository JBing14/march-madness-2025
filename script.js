document.addEventListener("DOMContentLoaded", () => {
  const bracketEl = document.getElementById("bracket");
  bracketEl.innerHTML = "";

  // ----- DATA -----
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

  const rounds = [round1, [], [], [], []]; // R1 → Champion

  // ----- RENDER -----
  function render() {
    bracketEl.innerHTML = "";

    rounds.forEach((round, roundIndex) => {
      if (round.length === 0) return;

      const roundEl = document.createElement("div");
      roundEl.className = "round";

      round.forEach((matchup, matchupIndex) => {
        if (!matchup || matchup.length < 2) return;

        const matchupEl = document.createElement("div");
        matchupEl.className = "matchup";

        matchup.forEach(team => {
          const btn = document.createElement("button");
          btn.className = "team";
          btn.textContent = team;

          btn.onclick = () => {
            // Select winner in this matchup
            matchupEl.querySelectorAll(".team").forEach(b =>
              b.classList.remove("selected")
            );
            btn.classList.add("selected");

            // Advance winner
            const nextRoundIndex = roundIndex + 1;
            const nextMatchupIndex = Math.floor(matchupIndex / 2);
            const slotIndex = matchupIndex % 2;

            if (!rounds[nextRoundIndex][nextMatchupIndex]) {
              rounds[nextRoundIndex][nextMatchupIndex] = [];
            }

            rounds[nextRoundIndex][nextMatchupIndex][slotIndex] = team;

            // Clear deeper rounds
            for (let i = nextRoundIndex + 1; i < rounds.length; i++) {
              rounds[i] = [];
            }

            render();
          };

          matchupEl.appendChild(btn);
        });

        roundEl.appendChild(matchupEl);
      });

      bracketEl.appendChild(roundEl);
    });
  }

  render();
});
