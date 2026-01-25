import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

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
const auth = getAuth(app);

const loginDiv = document.getElementById('login');
const dashboardDiv = document.getElementById('dashboard');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('loginError');
const adminEmailSpan = document.getElementById('adminEmail');
const tableBody = document.getElementById('table-body');
const countSpan = document.getElementById('count');
const detailsEl = document.getElementById('details');
const resultsControls = document.getElementById('resultsControls');
const saveResultsBtn = document.getElementById('saveResultsBtn');
const scoreBtn = document.getElementById('scoreBtn');
const scoreStatus = document.getElementById('scoreStatus');
const exportPdf = document.getElementById('exportPdf');
const editForm = document.getElementById('editForm');
const editName = document.getElementById('editName');
const saveEdit = document.getElementById('saveEdit');
const cancelEdit = document.getElementById('cancelEdit');

let currentEditId = null;
let allBrackets = [];
let officialResults = null;

// Auth state listener
onAuthStateChanged(auth, user => {
  if (user) {
    loginDiv.style.display = 'none';
    dashboardDiv.style.display = 'block';
    adminEmailSpan.textContent = user.email;
    loadBrackets();
    loadOfficialResults();
    buildControls();
  } else {
    loginDiv.style.display = 'block';
    dashboardDiv.style.display = 'none';
  }
});

// Login
loginBtn.onclick = async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    loginError.textContent = '';
  } catch (err) {
    loginError.textContent = 'Login failed: ' + err.message;
  }
};

// Logout
logoutBtn.onclick = () => signOut(auth);

// Build controls for official results
function buildControls() {
  resultsControls.innerHTML = '';
  const regionNames = ['south', 'midwest', 'east', 'west'];
  
  regionNames.forEach((region, rIdx) => {
    const regionDiv = document.createElement('div');
    regionDiv.className = 'col-md-3';
    regionDiv.innerHTML = `<h4>${region.toUpperCase()}</h4>`;
    
    ['round1', 'round2', 'round3', 'round4'].forEach(round => {
      const num = round === 'round1' ? 8 : round === 'round2' ? 4 : round === 'round3' ? 2 : 1;
      
      for (let g = 1; g <= num; g++) {
        const sel = document.createElement('select');
        sel.className = 'form-select mb-2';
        sel.dataset.game = `${region}-${round}-game${g}`;
        sel.innerHTML = `<option value="">${round.toUpperCase()} Game ${g} Winner</option>`;
        regionDiv.appendChild(sel);
      }
    });
    
    resultsControls.appendChild(regionDiv);
  });

  // Final Four
  const ffDiv = document.createElement('div');
  ffDiv.className = 'col-md-12 mt-3';
  ffDiv.innerHTML = `<h4>Final Four & Champion</h4>`;
  
  const semis1Sel = document.createElement('select');
  semis1Sel.className = 'form-select mb-2';
  semis1Sel.dataset.game = 'semis1-game1';
  semis1Sel.innerHTML = `<option value="">Semi 1 (South vs Midwest) Winner</option>`;
  ffDiv.appendChild(semis1Sel);
  
  const semis2Sel = document.createElement('select');
  semis2Sel.className = 'form-select mb-2';
  semis2Sel.dataset.game = 'semis2-game1';
  semis2Sel.innerHTML = `<option value="">Semi 2 (East vs West) Winner</option>`;
  ffDiv.appendChild(semis2Sel);
  
  const champSel = document.createElement('select');
  champSel.className = 'form-select mb-2';
  champSel.dataset.game = 'championship-game1';
  champSel.innerHTML = `<option value="">Champion</option>`;
  ffDiv.appendChild(champSel);
  
  resultsControls.appendChild(ffDiv);

  // Bonus games
  ['bonus1', 'bonus2', 'bonus3', 'bonus4'].forEach(b => {
    const sel = document.getElementById(b);
    sel.innerHTML = '<option value="">Select Bonus Game</option>';
    
    regionNames.forEach(r => {
      ['round1', 'round2', 'round3', 'round4'].forEach(round => {
        const num = round === 'round1' ? 8 : round === 'round2' ? 4 : round === 'round3' ? 2 : 1;
        
        for (let g = 1; g <= num; g++) {
          sel.innerHTML += `<option value="${r}-${round}-game${g}">${r.toUpperCase()} ${round.toUpperCase()} Game ${g}</option>`;
        }
      });
    });
    
    // Add Final Four games
    sel.innerHTML += `<option value="semis1-game1">SEMI 1 (South vs Midwest)</option>`;
    sel.innerHTML += `<option value="semis2-game1">SEMI 2 (East vs West)</option>`;
    sel.innerHTML += `<option value="championship-game1">CHAMPIONSHIP</option>`;
  });
}

// Load official results
async function loadOfficialResults() {
  const resultsDoc = await getDoc(doc(db, 'officialResults', 'current'));
  
  if (resultsDoc.exists()) {
    officialResults = resultsDoc.data();
    populateResultsControls(officialResults);
  }
}

// Populate results controls with existing data
function populateResultsControls(results) {
  if (!results) return;
  
  // Populate all select dropdowns
  document.querySelectorAll('#resultsControls select, #bonus1, #bonus2, #bonus3, #bonus4').forEach(sel => {
    const gameKey = sel.dataset.game || sel.id;
    
    if (gameKey.startsWith('bonus')) {
      if (results.bonusGames && results.bonusGames[gameKey]) {
        sel.value = results.bonusGames[gameKey];
      }
    } else if (results.winners && results.winners[gameKey]) {
      sel.value = results.winners[gameKey];
    }
  });
}

// Save official results
saveResultsBtn.onclick = async () => {
  const winners = {};
  const bonusGames = {};
  
  // Collect all winner selections
  document.querySelectorAll('#resultsControls select').forEach(sel => {
    const gameKey = sel.dataset.game;
    if (sel.value) {
      winners[gameKey] = sel.value;
    }
  });
  
  // Collect bonus game selections
  ['bonus1', 'bonus2', 'bonus3', 'bonus4'].forEach(b => {
    const sel = document.getElementById(b);
    if (sel.value) {
      bonusGames[b] = sel.value;
    }
  });
  
  try {
    await setDoc(doc(db, 'officialResults', 'current'), {
      winners,
      bonusGames,
      updatedAt: new Date()
    });
    
    officialResults = { winners, bonusGames };
    scoreStatus.textContent = 'Official results saved successfully!';
    populateTeamOptions();
  } catch (err) {
    scoreStatus.textContent = 'Error saving results: ' + err.message;
  }
};

// Populate team options in result selects based on bracket structure
function populateTeamOptions() {
  if (!allBrackets.length) return;
  
  // Get a sample bracket to extract team names
  const sampleBracket = allBrackets[0].picks;
  
  document.querySelectorAll('#resultsControls select').forEach(sel => {
    const gameKey = sel.dataset.game;
    const [region, round, game] = gameKey.split('-');
    
    // Find the teams for this game
    let teams = [];
    
    if (region === 'semis1' || region === 'semis2' || region === 'championship') {
      // Final Four games - get from all brackets
      const uniqueTeams = new Set();
      allBrackets.forEach(b => {
        if (region === 'semis1' && b.picks.finalFour?.semis1?.game1) {
          uniqueTeams.add(b.picks.finalFour.semis1.game1.slot1);
          uniqueTeams.add(b.picks.finalFour.semis1.game1.slot2);
        } else if (region === 'semis2' && b.picks.finalFour?.semis2?.game1) {
          uniqueTeams.add(b.picks.finalFour.semis2.game1.slot1);
          uniqueTeams.add(b.picks.finalFour.semis2.game1.slot2);
        } else if (region === 'championship' && b.picks.finalFour?.championship?.game1) {
          uniqueTeams.add(b.picks.finalFour.championship.game1.slot1);
          uniqueTeams.add(b.picks.finalFour.championship.game1.slot2);
        }
      });
      teams = Array.from(uniqueTeams).filter(t => t);
    } else {
      // Regional games
      const regionIdx = ['south', 'midwest', 'east', 'west'].indexOf(region);
      
      if (regionIdx !== -1 && sampleBracket.regions[regionIdx]) {
        const roundData = sampleBracket.regions[regionIdx][round];
        
        if (roundData && roundData[game]) {
          teams = [roundData[game].slot1, roundData[game].slot2].filter(t => t);
        }
      }
    }
    
    // Populate select with teams
    const currentValue = sel.value;
    const label = sel.querySelector('option').textContent;
    sel.innerHTML = `<option value="">${label}</option>`;
    
    teams.forEach(team => {
      sel.innerHTML += `<option value="${team}">${team}</option>`;
    });
    
    if (currentValue) sel.value = currentValue;
  });
}

// Score all brackets
scoreBtn.onclick = async () => {
  if (!officialResults || !officialResults.winners) {
    scoreStatus.textContent = 'Please save official results first!';
    return;
  }
  
  scoreStatus.textContent = 'Scoring brackets...';
  
  try {
    for (const bracket of allBrackets) {
      const score = scoreBracket(bracket.picks, officialResults);
      
      await setDoc(doc(db, 'scores', bracket.id), {
        entryName: bracket.entryName,
        total: score.total,
        breakdown: score.breakdown,
        tiebreaker: bracket.tiebreaker,
        lastScored: new Date()
      });
    }
    
    scoreStatus.textContent = `Successfully scored ${allBrackets.length} brackets!`;
  } catch (err) {
    scoreStatus.textContent = 'Error scoring brackets: ' + err.message;
  }
};

// Scoring function
function scoreBracket(picks, results) {
  let total = 0;
  const breakdown = { round1: 0, round2: 0, round3: 0, round4: 0, semis: 0, championship: 0, bonus: 0 };
  
  const roundPoints = { round1: 1, round2: 2, round3: 4, round4: 8 };
  
  // Score regional rounds
  picks.regions.forEach((region, rIdx) => {
    const regionName = ['south', 'midwest', 'east', 'west'][rIdx];
    
    ['round1', 'round2', 'round3', 'round4'].forEach(round => {
      const roundData = region[round];
      
      Object.keys(roundData).forEach(gameKey => {
        const pick = roundData[gameKey].pick;
        const resultKey = `${regionName}-${round}-${gameKey}`;
        const officialWinner = results.winners[resultKey];
        
        if (pick && pick === officialWinner) {
          const points = roundPoints[round];
          total += points;
          breakdown[round] += points;
        }
      });
    });
  });
  
  // Score Final Four
  if (picks.finalFour.semis1?.game1?.pick) {
    const pick = picks.finalFour.semis1.game1.pick;
    if (pick === results.winners['semis1-game1']) {
      total += 16;
      breakdown.semis += 16;
    }
  }
  
  if (picks.finalFour.semis2?.game1?.pick) {
    const pick = picks.finalFour.semis2.game1.pick;
    if (pick === results.winners['semis2-game1']) {
      total += 16;
      breakdown.semis += 16;
    }
  }
  
  // Score Championship
  if (picks.finalFour.championship?.game1?.pick) {
    const pick = picks.finalFour.championship.game1.pick;
    if (pick === results.winners['championship-game1']) {
      total += 32;
      breakdown.championship += 32;
    }
  }
  
  // Score bonus games
  if (results.bonusGames) {
    ['bonus1', 'bonus2', 'bonus3', 'bonus4'].forEach(bonusKey => {
      const bonusGame = results.bonusGames[bonusKey];
      if (!bonusGame) return;
      
      const [region, round, game] = bonusGame.split('-');
      
      if (region === 'semis1' || region === 'semis2' || region === 'championship') {
        const pick = picks.finalFour[region]?.game1?.pick;
        if (pick === results.winners[bonusGame]) {
          total += 5;
          breakdown.bonus += 5;
        }
      } else {
        const regionIdx = ['south', 'midwest', 'east', 'west'].indexOf(region);
        const pick = picks.regions[regionIdx]?.[round]?.[game]?.pick;
        if (pick === results.winners[bonusGame]) {
          total += 5;
          breakdown.bonus += 5;
        }
      }
    });
  }
  
  return { total, breakdown };
}

// Load brackets
function loadBrackets() {
  onSnapshot(query(collection(db, 'brackets'), orderBy('submittedAt', 'desc')), snap => {
    allBrackets = [];
    tableBody.innerHTML = '';
    
    snap.forEach(d => {
      const data = d.data();
      allBrackets.push({ id: d.id, ...data });
      
      const tr = document.createElement('tr');
      tr.dataset.id = d.id;
      tr.innerHTML = `
        <td>${data.entryName}</td>
        <td>${data.email}</td>
        <td>${data.tiebreaker}</td>
        <td>${data.submittedAt?.toDate().toLocaleString() || 'N/A'}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteBracket('${d.id}')">Delete</button>
          <button class="btn btn-sm btn-primary" onclick="editBracket('${d.id}')">Edit</button>
        </td>
      `;
      
      tr.onclick = (e) => {
        if (e.target.tagName !== 'BUTTON') {
          detailsEl.textContent = JSON.stringify(data.picks, null, 2);
        }
      };
      
      tableBody.appendChild(tr);
    });
    
    countSpan.textContent = allBrackets.length;
    populateTeamOptions();
  });
}

// Delete bracket
window.deleteBracket = async (id) => {
  if (!confirm('Are you sure you want to delete this bracket?')) return;
  
  try {
    await deleteDoc(doc(db, 'brackets', id));
    await deleteDoc(doc(db, 'scores', id));
    scoreStatus.textContent = 'Bracket deleted successfully!';
  } catch (err) {
    scoreStatus.textContent = 'Error deleting bracket: ' + err.message;
  }
};

// Edit bracket
window.editBracket = (id) => {
  const bracket = allBrackets.find(b => b.id === id);
  if (!bracket) return;
  
  currentEditId = id;
  editName.value = bracket.entryName;
  editForm.style.display = 'block';
};

// Save edit
saveEdit.onclick = async () => {
  if (!currentEditId) return;
  
  try {
    await updateDoc(doc(db, 'brackets', currentEditId), {
      entryName: editName.value
    });
    
    await updateDoc(doc(db, 'scores', currentEditId), {
      entryName: editName.value
    });
    
    editForm.style.display = 'none';
    currentEditId = null;
    scoreStatus.textContent = 'Bracket updated successfully!';
  } catch (err) {
    scoreStatus.textContent = 'Error updating bracket: ' + err.message;
  }
};

// Cancel edit
cancelEdit.onclick = () => {
  editForm.style.display = 'none';
  currentEditId = null;
};

// Export PDF
exportPdf.onclick = async () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  
  // Get leaderboard data
  const scoresSnap = await getDocs(query(collection(db, 'scores'), orderBy('total', 'desc')));
  
  pdf.setFontSize(16);
  pdf.text('March Madness 2025 Leaderboard', 10, 10);
  
  pdf.setFontSize(10);
  let y = 25;
  
  scoresSnap.forEach((d, idx) => {
    const data = d.data();
    pdf.text(`${idx + 1}. ${data.entryName} - ${data.total} pts (Tie: ${data.tiebreaker})`, 10, y);
    y += 8;
    
    if (y > 280) {
      pdf.addPage();
      y = 20;
    }
  });
  
  pdf.save('leaderboard.pdf');
};
