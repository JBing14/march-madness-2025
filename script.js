const teams = [
  ["Team 1", "Team 2"], ["Team 3", "Team 4"], ["Team 5", "Team 6"], ["Team 7", "Team 8"],
  ["Team 9", "Team 10"], ["Team 11", "Team 12"], ["Team 13", "Team 14"], ["Team 15", "Team 16"],
  ["Team 17", "Team 18"], ["Team 19", "Team 20"], ["Team 21", "Team 22"], ["Team 23", "Team 24"],
  ["Team 25", "Team 26"], ["Team 27", "Team 28"], ["Team 29", "Team 30"], ["Team 31", "Team 32"],
  ["Team 33", "Team 34"], ["Team 35", "Team 36"], ["Team 37", "Team 38"], ["Team 39", "Team 40"],
  ["Team 41", "Team 42"], ["Team 43", "Team 44"], ["Team 45", "Team 46"], ["Team 47", "Team 48"],
  ["Team 49", "Team 50"], ["Team 51", "Team 52"], ["Team 53", "Team 54"], ["Team 55", "Team 56"],
  ["Team 57", "Team 58"], ["Team 59", "Team 60"], ["Team 61", "Team 62"], ["Team 63", "Team 64"]
];

const leftTeams = teams.slice(0, 16);  // Left side: 32 teams
const rightTeams = teams.slice(16, 32); // Right side: 32 teams

let leftWinner = null;
let rightWinner = null;
let champion = null;

$(document).ready(function() {
  console.log("jQuery ready");

  $("#left-bracket").bracket({
    init: {
      teams: leftTeams,
      results: null
    },
    dir: 'lr',
    onMatchClick: function(match) {
      const teams = match.source().map(p => p ? p.name : null);
      const winner = prompt("Who wins?", teams[0] || teams[1]);
      if (winner) {
        match.setWinner({ name: winner });
        checkWinners();
      }
    }
  });

  $("#right-bracket").bracket({
    init: {
      teams: rightTeams,
      results: null
    },
    dir: 'rl',
    onMatchClick: function(match) {
      const teams = match.source().map(p => p ? p.name : null);
      const winner = prompt("Who wins?", teams[0] || teams[1]);
      if (winner) {
        match.setWinner({ name: winner });
        checkWinners();
      }
    }
  });

  console.log("Brackets initialized");
});

function checkWinners() {
  const leftData = $("#left-bracket").data("bracket").getData();
  const rightData = $("#right-bracket").data("bracket").getData();

  // Get final winners (round 5 for 16 matchups)
  leftWinner = leftData.results && leftData.results[0] && leftData.results[0][4] && leftData.results[0][4][0] ? leftData.results[0][4][0].player.name : null;
  rightWinner = rightData.results && rightData.results[0] && rightData.results[0][4] && rightData.results[0][4][0] ? rightData.results[0][4][0].player.name : null;

  if (leftWinner && rightWinner) {
    $("#final-matchup").html(`
      <span class="final-team" onclick="selectChampion('${leftWinner}')">${leftWinner}</span>
      <span class="vs">vs</span>
      <span class="final-team" onclick="selectChampion('${rightWinner}')">${rightWinner}</span>
    `);
  }
}

function selectChampion(team) {
  champion = team;
  $("#final-matchup .final-team").removeClass("winner");
  $("#final-matchup .final-team").each(function() {
    if ($(this).text() === team) $(this).addClass("winner");
  });
  console.log("Champion selected:", champion);
}

document.getElementById("userForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const tiebreaker = document.getElementById("tiebreaker").value;
  const leftBracketData = $("#left-bracket").data("bracket").getData();
  const rightBracketData = $("#right-bracket").data("bracket").getData();
  console.log("Bracket submitted:", {
    name,
    email,
    tiebreaker,
    leftBracket: leftBracketData,
    rightBracket: rightBracketData,
    champion: champion
  });
  alert("Bracket submitted (check console for data)!");
});
