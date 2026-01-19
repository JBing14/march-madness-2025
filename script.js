import { db } from "./firebase.js";

const teams = document.querySelectorAll(".team");

teams.forEach(team => {
  team.addEventListener("click", () => handlePick(team));
});

function handlePick(teamBtn) {
  if (teamBtn.classList.contains("empty")) return;

  const region = teamBtn.dataset.region;
  const round = Number(teamBtn.dataset.round);
  const game = Number(teamBtn.dataset.game);
  const teamName = teamBtn.textContent;

  const nextRound = round + 1;
  const nextGame = Math.ceil(game / 2);

  const targetSlots = document.querySelectorAll(
    `.team[data-region="${region}"][data-round="${nextRound}"][data-game="${nextGame}"]`
  );

  if (!targetSlots.length) return;

  // Clear both slots in next round matchup
  targetSlots.forEach(slot => {
    slot.textContent = "";
    slot.classList.remove("empty");
  });

  // Fill first available slot
  targetSlots[0].textContent = teamName;
}
