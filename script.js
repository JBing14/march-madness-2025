import { db } from "./firebase.js";

const teams = document.querySelectorAll(".team");

teams.forEach(team => {
  team.addEventListener("click", () => handlePick(team));
});
function clearDownstream(region, round, game) {
  const maxRound = 4; // per region

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

  const targetSlots = document.querySelectorAll(
    `.team[data-region="${region}"][data-round="${nextRound}"][data-game="${nextGame}"]`
  );

  if (!targetSlots.length) return;

  // Clear current next-round matchup
  targetSlots.forEach(slot => {
    slot.textContent = "";
    slot.classList.add("empty");
  });

  // Fill first slot
  targetSlots[0].textContent = teamName;
  targetSlots[0].classList.remove("empty");
}


