document.addEventListener("DOMContentLoaded", () => {
  const round1El = document.getElementById("round-1-left");
  const round2El = document.getElementById("round-2-left");
  const round3El = document.getElementById("round-3-left");
  const round4El = document.getElementById("round-4-left");
  const champEl = document.getElementById("round-5-left");

  if (!round1El || !round2El || !round3El || !round4El || !champEl) {
    console.error("One or more round containers are missing");
    return;
  }

  // ---------------- STATE ----------------

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

  const round2 = [
    [null, null],
    [null, null],
    [null, null],
    [null, null]
  ];

  const round3 = [
    [null, null],
    [null, null]
  ];

  const round4 = [
    [null, null]
  ];

  let champion = null;

  // ---------------- RENDER ----------------

  function render() {
    renderRound(round1El, round1, handleRound1Pick);
    renderRound(round2El, round2, handleRound2Pick);
    renderRound(round3El, round3, handleRound3Pick);
    renderRound(round4El, round4, handleRound4Pick);

    renderChampion();
  }

  function renderRound(container, matchups, clickHandler) {
    container.innerHTML = "";

    matchups.forEach((matchup, matchupIndex) => {
      const matchEl = document.createElement("div");
      matchEl.className = "matchup";

      matchup.forEach((team, slotIndex) => {
        const btn = document.createElement("button");
        btn.className = "team";
        btn.textContent = team ?? "";

        if (team && clickHandler) {
          btn.onclick = () => clickHandler(matchupIndex, slotIndex, team);
        } else {
          btn.disabled = true;
        }

        matchEl.appendChild(btn);
      });

      container.appendChild(matchEl);
    });
  }

  function renderChampion() {
    champEl.innerHTML = "";

    if (!champion) return;

    const matchEl = document.createElement("div");
    matchEl.className = "matchup";

    const btn = document.createElement("button");
    btn.className = "team champion";
    btn.textContent = champion;
    btn.disabled = true;

    matchEl.appendChild(btn);
    champEl.appendChild(matchEl);
  }

  // ---------------- LOGIC ----------------

  function handleRound1Pick(matchupIndex, slotIndex, team) {
    const r2Matchup = Math.floor(matchupIndex / 2);
    const r2Slot = matchupIndex % 2;

    round2[r2Matchup][r2Slot] = team;

    clearRound(round3);
    clearRound(round4);
    champion = null;

    render();
  }

  function handleRound2Pick(matchupIndex, slotIndex, team) {
    const r3Matchup = Math.floor(matchupIndex / 2);
    const r3Slot = matchupIndex % 2;

    round3[r3Matchup][r3Slot] = team;

    clearRound(round4);
    champion = null;

    render();
  }

  function handleRound3Pick(matchupIndex, slotIndex, team) {
    round4[0][matchupIndex] = team;
    champion = null;
    render();
  }

  function handleRound4Pick(matchupIndex, slotIndex, team) {
    champion = team;
    render();
  }

  function clearRound(round) {
    round.forEach(matchup => {
      matchup[0] = null;
      matchup[1] = null;
    });
  }

  // ---------------- INIT ----------------

  render();
});
