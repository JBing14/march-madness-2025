document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("round-1-left");

  if (!container) {
    console.error("round-1-left not found");
    return;
  }

  const teams = [
    ["Auburn", "Alabama St"],
    ["Louisville", "Creighton"],
    ["Michigan", "UC San Diego"],
    ["Texas A&M", "Yale"]
  ];

  teams.forEach(matchup => {
    const match = document.createElement("div");
    match.className = "matchup";

    matchup.forEach(team => {
      const btn = document.createElement("button");
      btn.className = "team";
      btn.textContent = team;

      btn.onclick = () => {
        alert(`Clicked ${team}`);
      };

      match.appendChild(btn);
    });

    container.appendChild(match);
  });
});
