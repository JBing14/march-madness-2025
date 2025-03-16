// Replace with your Firebase config
const firebaseConfig = {apiKey: "AIzaSyB27qEP0k2PR8Zz_z_A8KjGcXvxX9OROQA",
  authDomain: "marchmadness2025-24f04.firebaseapp.com",
  projectId: "marchmadness2025-24f04",
  storageBucket: "marchmadness2025-24f04.firebasestorage.app",
  messagingSenderId: "916205408985",
  appId: "1:916205408985:web:1dd57fc8704c6c0e8fe4c8",
  measurementId: "G-TKTZB2FFRB"};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Placeholder teams (replace with real 2025 teams after Selection Sunday)
const teams = [
  "Team 1", "Team 2", "Team 3", "Team 4", "Team 5", "Team 6", "Team 7", "Team 8",
  "Team 9", "Team 10", "Team 11", "Team 12", "Team 13", "Team 14", "Team 15", "Team 16",
  "Team 17", "Team 18", "Team 19", "Team 20", "Team 21", "Team 22", "Team 23", "Team 24",
  "Team 25", "Team 26", "Team 27", "Team 28", "Team 29", "Team 30", "Team 31", "Team 32",
  "Team 33", "Team 34", "Team 35", "Team 36", "Team 37", "Team 38", "Team 39", "Team 40",
  "Team 41", "Team 42", "Team 43", "Team 44", "Team 45", "Team 46", "Team 47", "Team 48",
  "Team 49", "Team 50", "Team 51", "Team 52", "Team 53", "Team 54", "Team 55", "Team 56",
  "Team 57", "Team 58", "Team 59", "Team 60", "Team 61", "Team 62", "Team 63", "Team 64"
];

$(document).ready(function() {
  $("#bracket").bracket({
    init: { teams: teams.map(t => [t, ""]), rounds: 6 },
    onMatchClick: function(data) {
      const winner = prompt("Who wins?", data.teams[0] || data.teams[1]);
      if (winner) data.setWinner(winner);
    }
  });
});

document.getElementById("userForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const bracketData = $("#bracket").data("bracket").getData();
  const timestamp = new Date().toISOString();
  const userEntries = await db.collection("brackets").where("email", "==", email).get();
  const entryNum = userEntries.docs.length + 1;
  const entryName = `${name} ${entryNum}`;

  await db.collection("brackets").add({
    name: entryName,
    email,
    bracket: bracketData,
    timestamp,
    score: 0
  });
  alert("Bracket submitted!");
});

function updateLeaderboard() {
  db.collection("brackets").orderBy("score", "desc").onSnapshot(snapshot => {
    let html = "<h2>Leaderboard</h2><table><tr><th>Name</th><th>Score</th></tr>";
    snapshot.forEach(doc => {
      const data = doc.data();
      html += `<tr><td><a href="#" onclick="showPicks('${doc.id}')">${data.name}</a></td><td>${data.score}</td></tr>`;
    });
    html += "</table>";
    document.getElementById("leaderboard").innerHTML = html;
  });
}

function showPicks(docId) {
  db.collection("brackets").doc(docId).get().then(doc => {
    const picks = JSON.stringify(doc.data().bracket, null, 2);
    alert("Bracket Picks:\n" + picks); // Simple display, can be enhanced later
  });
}

updateLeaderboard();