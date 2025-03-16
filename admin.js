const firebaseConfig = { /* Paste your config here */ };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const teams = [/* Same 64 teams as in script.js */]; // Copy from script.js

const scoring = [1, 3, 5, 7, 10, 20]; // Round scores
const bonusGames = [3, 7, 24, 28]; // Indices for 4 vs 5 (upper left, right), 3 vs 6 (lower left, right)

let winners = {};
let html = "<h2>Enter Game Winners</h2>";
for (let i = 0; i < 32; i++) {
  html += `
    <div>
      <label>Game ${i + 1} (${teams[i * 2]} vs ${teams[i * 2 + 1]}):</label>
      <select onchange="updateWinner(${i}, this.value)">
        <option value="">Select Winner</option>
        <option value="${teams[i * 2]}">${teams[i * 2]}</option>
        <option value="${teams[i * 2 + 1]}">${teams[i * 2 + 1]}</option>
      </select>
    </div>
  `;
}
document.getElementById("gameResults").innerHTML = html;

function updateWinner(gameIndex, winner) {
  winners[gameIndex] = winner;
  updateScores();
}

async function updateScores() {
  const brackets = await db.collection("brackets").get();
  brackets.forEach(async (doc) => {
    const data = doc.data();
    let score = 0;
    const picks = data.bracket.rounds;

    picks.forEach((round, roundIndex) => {
      round.forEach((game, gameIndex) => {
        const actualWinner = winners[gameIndex];
        if (actualWinner && game.winner === actualWinner) {
          score += scoring[roundIndex];
          if (roundIndex === 0 && bonusGames.includes(gameIndex)) {
            score += 5; // Bonus points
          }
        }
      });
    });

    await db.collection("brackets").doc(doc.id).update({ score });
  });
}