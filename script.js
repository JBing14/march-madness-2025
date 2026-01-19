document.addEventListener("DOMContentLoaded", () => {
  const bracketEl = document.getElementById("bracket");
  bracketEl.innerHTML = "";

  const rounds = [
    [
      ["Auburn", "Alabama St"],
      ["Louisville", "Creighton"],
      ["Michigan", "UC San Diego"],
      ["Texas A&M", "Yale"],
      ["Ole Miss", "San Diego St"],
      ["Iowa St", "Lipscomb"],
      ["Marquette", "New Mexico"],
      ["Michigan St", "Bryant"]
    ],
    Array(4).fill([null, null]),
    Array(2).fill([null, null]),
    Array(1).fill([null, null]),
    Array(1).fill([null])
  ];

  function render() {
    bracketEl.innerHTML = "";

    rounds.forEach((round, roundIndex) => {
      const roundEl = document.createElement("div");
      roundEl.className = `round round-${roundIndex + 1}`;

      round.forEach((matchup, matchupIndex) => {
        const matchupEl = document.createElement("div");
        matchupEl.className = "matchup";

        matchup.forEach((team, slotIndex) => {
          const btn = document.createElement("button");
          btn.className = "team";
          btn.textContent = team ?? "";

          if (team) {
            btn.onclick = () => {
              const nextRound = rounds[roundIndex + 1];
              if (!nextRound) return;

              const nextMatchupIndex = Math.floor(matchupIndex / 2);
              const nextSlotIndex = matchupIndex % 2;

              nextRound[nextMatchupIndex][nextSlotIndex] = team;

              // clear everything beyond
              for (let i = roundIndex + 2; i < rounds.length; i++) {
                rounds[i] = rounds[i].map(m =>
                  m.map(() => null)
                );
              }

              render();
            };
          } else {
            btn.disabled = true;
          }

          matchupEl.appendChild(btn);
        });

        roundEl.appendChild(matchupEl);
      });

      bracketEl.appendChild(roundEl);
    });
  }

  render();
});

