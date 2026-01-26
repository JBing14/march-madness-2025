import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB27qEP0k2PR8Zz_z_A8KjGcXvxX9OROQA",
  authDomain: "marchmadness2025-24f04.firebaseapp.com",
  projectId: "marchmadness2025-24f04",
  storageBucket: "marchmadness2025-24f04.firebasestorage.app",
  messagingSenderId: "916205408985",
  appId: "1:916205408985:web:1dd57fc8704c6c0e8fe4c8",
  measurementId: "G-TKTZB2FFRB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const tableBody = document.getElementById("table-body");
const exportPdf = document.getElementById("exportPdf");
const bracketModal = document.getElementById("bracketModal");
const modalTitle = document.getElementById("modalTitle");
const modalBracket = document.getElementById("modalBracket");
const closeModal = document.querySelector(".close-modal");

let allBrackets = [];
let allScores = {};
let lastScoredTime = null;

// Load all brackets and scores
function loadLeaderboard() {
  // Listen to brackets collection
  onSnapshot(query(collection(db, "brackets"), orderBy("submittedAt", "desc")), bracketsSnap => {
    allBrackets = [];
    
    bracketsSnap.forEach(d => {
      allBrackets.push({ id: d.id, ...d.data() });
    });
    
    // Listen to scores collection
    onSnapshot(collection(db, "scores"), scoresSnap => {
      allScores = {};
      lastScoredTime = null;
      
      scoresSnap.forEach(d => {
        const data = d.data();
        allScores[d.id] = data;
        
        // Track the most recent scoring time
        if (data.lastScored) {
          const scoredTime = data.lastScored.toDate();
          if (!lastScoredTime || scoredTime > lastScoredTime) {
            lastScoredTime = scoredTime;
          }
        }
      });
      
      // Now render the leaderboard with combined data
      renderLeaderboard();
      updateLastUpdated();
    });
  });
}

function updateLastUpdated() {
  // Find or create the last updated element
  let lastUpdatedEl = document.getElementById('last-updated');
  
  if (!lastUpdatedEl) {
    lastUpdatedEl = document.createElement('div');
    lastUpdatedEl.id = 'last-updated';
    lastUpdatedEl.className = 'last-updated';
    
    // Insert it before the table
    const table = document.querySelector('.table');
    table.parentNode.insertBefore(lastUpdatedEl, table);
  }
  
  if (lastScoredTime) {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    };
    const formattedTime = lastScoredTime.toLocaleString('en-US', options);
    lastUpdatedEl.innerHTML = `<i class="fa fa-clock-o"></i> Last Updated: <strong>${formattedTime}</strong>`;
  } else {
    lastUpdatedEl.innerHTML = `<i class="fa fa-info-circle"></i> Scores have not been calculated yet.`;
  }
}

function renderLeaderboard() {
  tableBody.innerHTML = "";
  
  if (allBrackets.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4" style="text-align: center; padding: 20px;">No brackets submitted yet.</td>`;
    tableBody.appendChild(tr);
    return;
  }
  
  // Combine brackets with their scores
  const leaderboardData = allBrackets.map(bracket => {
    const score = allScores[bracket.id];
    return {
      id: bracket.id,
      entryName: bracket.entryName,
      email: bracket.email,
      tiebreaker: bracket.tiebreaker,
      total: score ? score.total : 0,
      isScored: !!score,
      picks: bracket.picks
    };
  });
  
  // Sort by score (desc), then by tiebreaker (asc)
  leaderboardData.sort((a, b) => {
    if (b.total !== a.total) {
      return b.total - a.total;
    }
    return a.tiebreaker - b.tiebreaker;
  });
  
  // Render rows
  leaderboardData.forEach((entry, idx) => {
    const tr = document.createElement("tr");
    tr.dataset.id = entry.id;
    
    if (!entry.isScored) {
      tr.style.opacity = '0.7';
    }
    
    const rank = entry.isScored ? idx + 1 : '-';
    const score = entry.isScored ? entry.total : 'Not Scored';
    
    tr.innerHTML = `
      <td><strong>${rank}</strong></td>
      <td>${entry.entryName || 'Unknown'}</td>
      <td><strong>${score}</strong></td>
      <td>${entry.tiebreaker || 0}</td>
    `;
    
    tr.onclick = () => showBracket(entry.id, entry.entryName, entry.picks);
    
    tableBody.appendChild(tr);
  });
}

async function showBracket(bracketId, entryName, picks) {
  if (!picks) {
    try {
      const bracketDoc = await getDoc(doc(db, "brackets", bracketId));
      if (!bracketDoc.exists()) {
        alert("Bracket not found");
        return;
      }
      picks = bracketDoc.data().picks;
    } catch (err) {
      alert("Error loading bracket: " + err.message);
      return;
    }
  }
  
  modalTitle.textContent = `${entryName}'s Bracket`;
  renderBracketView(picks);
  bracketModal.style.display = "block";
}

function renderBracketView(picks) {
  modalBracket.innerHTML = `
    <div class="bracket-wrapper">
      <div class="round round-1 left" id="modal-round-1-left"><h3>1st ROUND</h3></div>
      <div class="round round-2 left" id="modal-round-2-left"><h3>2nd ROUND</h3></div>
      <div class="round round-3 left" id="modal-round-3-left"><h3>SWEET 16</h3></div>
      <div class="round round-4 left" id="modal-round-4-left"><h3>ELITE EIGHT</h3></div>
      <div class="round round-5 left" id="modal-round-5-left"><h3>FINAL FOUR</h3></div>
      <div class="round round-6 left" id="modal-round-6-left"><h3>CHAMPIONSHIP</h3></div>
      <div class="round round-7 center" id="modal-champion"><h3>CHAMPION</h3></div>
      <div class="round round-6 right" id="modal-round-6-right"><h3>CHAMPIONSHIP</h3></div>
      <div class="round round-5 right" id="modal-round-5-right"><h3>FINAL FOUR</h3></div>
      <div class="round round-4 right" id="modal-round-4-right"><h3>ELITE EIGHT</h3></div>
      <div class="round round-3 right" id="modal-round-3-right"><h3>SWEET 16</h3></div>
      <div class="round round-2 right" id="modal-round-2-right"><h3>2nd ROUND</h3></div>
      <div class="round round-1 right" id="modal-round-1-right"><h3>1st ROUND</h3></div>
    </div>
  `;
  
  // Render regions
  renderModalRegion('modal-round-1-left', picks.regions[0], 'round1', 0);
  renderModalRegion('modal-round-1-left', picks.regions[1], 'round1', 1);
  renderModalRegion('modal-round-2-left', picks.regions[0], 'round2', 0);
  renderModalRegion('modal-round-2-left', picks.regions[1], 'round2', 1);
  renderModalRegion('modal-round-3-left', picks.regions[0], 'round3', 0);
  renderModalRegion('modal-round-3-left', picks.regions[1], 'round3', 1);
  renderModalRegion('modal-round-4-left', picks.regions[0], 'round4', 0);
  renderModalRegion('modal-round-4-left', picks.regions[1], 'round4', 1);
  
  renderModalRegion('modal-round-1-right', picks.regions[2], 'round1', 2);
  renderModalRegion('modal-round-1-right', picks.regions[3], 'round1', 3);
  renderModalRegion('modal-round-2-right', picks.regions[2], 'round2', 2);
  renderModalRegion('modal-round-2-right', picks.regions[3], 'round2', 3);
  renderModalRegion('modal-round-3-right', picks.regions[2], 'round3', 2);
  renderModalRegion('modal-round-3-right', picks.regions[3], 'round3', 3);
  renderModalRegion('modal-round-4-right', picks.regions[2], 'round4', 2);
  renderModalRegion('modal-round-4-right', picks.regions[3], 'round4', 3);
  
  // Render Final Four
  renderModalFinalFour(picks.finalFour);
}

function renderModalRegion(roundId, regionData, roundName, regionIdx) {
  const roundEl = document.getElementById(roundId);
  const regionEl = document.createElement('div');
  regionEl.className = 'region';
  regionEl.innerHTML = `<h4>${regionData.name}</h4>`;
  
  const roundDataObj = regionData[roundName];
  if (!roundDataObj) return;
  
  Object.keys(roundDataObj).forEach(gameKey => {
    const game = roundDataObj[gameKey];
    const matchEl = document.createElement('div');
    matchEl.className = 'match';
    
    [game.slot1, game.slot2].forEach(team => {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.textContent = team || '';
      
      if (team === game.pick) {
        slot.classList.add('picked');
      } else if (!team) {
        slot.classList.add('empty');
      }
      
      matchEl.appendChild(slot);
    });
    
    regionEl.appendChild(matchEl);
  });
  
  roundEl.appendChild(regionEl);
}

function renderModalFinalFour(finalFour) {
  // Semis 1 (left)
  const leftSemis = document.getElementById('modal-round-5-left');
  const semis1Match = document.createElement('div');
  semis1Match.className = 'match final-four-match';
  
  [finalFour.semis1.game1.slot1, finalFour.semis1.game1.slot2].forEach(team => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.textContent = team || '';
    if (team === finalFour.semis1.game1.pick) slot.classList.add('picked');
    else if (!team) slot.classList.add('empty');
    semis1Match.appendChild(slot);
  });
  leftSemis.appendChild(semis1Match);
  
  // Semis 2 (right)
  const rightSemis = document.getElementById('modal-round-5-right');
  const semis2Match = document.createElement('div');
  semis2Match.className = 'match final-four-match';
  
  [finalFour.semis2.game1.slot1, finalFour.semis2.game1.slot2].forEach(team => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.textContent = team || '';
    if (team === finalFour.semis2.game1.pick) slot.classList.add('picked');
    else if (!team) slot.classList.add('empty');
    semis2Match.appendChild(slot);
  });
  rightSemis.appendChild(semis2Match);
  
  // Championship left
  const leftChamp = document.getElementById('modal-round-6-left');
  const leftChampMatch = document.createElement('div');
  leftChampMatch.className = 'match championship-match';
  const leftSlot = document.createElement('div');
  leftSlot.className = 'slot';
  leftSlot.textContent = finalFour.championship.game1.slot1 || '';
  if (finalFour.championship.game1.slot1 === finalFour.championship.game1.pick) leftSlot.classList.add('picked');
  else if (!finalFour.championship.game1.slot1) leftSlot.classList.add('empty');
  leftChampMatch.appendChild(leftSlot);
  leftChamp.appendChild(leftChampMatch);
  
  // Championship right
  const rightChamp = document.getElementById('modal-round-6-right');
  const rightChampMatch = document.createElement('div');
  rightChampMatch.className = 'match championship-match';
  const rightSlot = document.createElement('div');
  rightSlot.className = 'slot';
  rightSlot.textContent = finalFour.championship.game1.slot2 || '';
  if (finalFour.championship.game1.slot2 === finalFour.championship.game1.pick) rightSlot.classList.add('picked');
  else if (!finalFour.championship.game1.slot2) rightSlot.classList.add('empty');
  rightChampMatch.appendChild(rightSlot);
  rightChamp.appendChild(rightChampMatch);
  
  // Champion
  const champRound = document.getElementById('modal-champion');
  const champSlot = document.createElement('div');
  champSlot.className = 'slot champion-slot picked';
  champSlot.textContent = finalFour.champion || 'Winner';
  champRound.appendChild(champSlot);
}

closeModal.onclick = () => {
  bracketModal.style.display = "none";
};

window.onclick = (e) => {
  if (e.target === bracketModal) {
    bracketModal.style.display = "none";
  }
};

exportPdf.onclick = () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  
  pdf.setFontSize(18);
  pdf.setFont(undefined, 'bold');
  pdf.text('March Madness 2025 Leaderboard', 10, 15);
  
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  
  let y = 30;
  
  tableBody.querySelectorAll('tr').forEach(tr => {
    const cells = tr.querySelectorAll('td');
    if (cells.length >= 4) {
      const rank = cells[0].textContent;
      const name = cells[1].textContent;
      const score = cells[2].textContent;
      const tiebreaker = cells[3].textContent;
      
      pdf.text(`${rank}. ${name} - ${score} pts (Tiebreaker: ${tiebreaker})`, 10, y);
      y += 8;
      
      if (y > 280) {
        pdf.addPage();
        y = 20;
      }
    }
  });
  
  pdf.save('march-madness-leaderboard.pdf');
};

// Initialize
loadLeaderboard();
