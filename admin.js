import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
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
const bracketUpload = document.getElementById('bracketUpload');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');
const downloadTemplate = document.getElementById('downloadTemplate');

let currentEditId = null;
let allBrackets = [];
let officialResults = { winners: {}, bonusGames: {} };

// Master bracket structure
const masterBracket = {
  regions: [
    {
      name: 'South',
      round1: [
        ['1 Auburn', '16 Alabama St'],
        ['8 Louisville', '9 Creighton'],
        ['5 Michigan', '12 UC San Diego'],
        ['4 Texas A&M', '13 Yale'],
        ['6 Ole Miss', '11 North Carolina'],
        ['3 Iowa St', '14 Lipscomb'],
        ['7 Marquette', '10 New Mexico'],
        ['2 Michigan St', '15 Bryant']
      ]
    },
    {
      name: 'Midwest',
      round1: [
        ['1 Houston', '16 SIU Edwardsville'],
        ['8 Gonzaga', '9 Georgia'],
        ['5 Clemson', '12 McNeese'],
        ['4 Purdue', '13 High Point'],
        ['6 Illinois', '11 Xavier'],
        ['3 Kentucky', '14 Troy'],
        ['7 UCLA', '10 Utah St'],
        ['2 Tennessee', '15 Wofford']
      ]
    },
    {
      name: 'East',
      round1: [
        ['1 Duke', '16 Mount St Marys'],
        ['8 Mississippi St', '9 Baylor'],
        ['5 Oregon', '12 Liberty'],
        ['4 Arizona', '13 Akron'],
        ['6 BYU', '11 VCU'],
        ['3 Wisconsin', '14 Montana'],
        ['7 Saint Marys', '10 Vanderbilt'],
        ['2 Alabama', '15 Robert Morris']
      ]
    },
    {
      name: 'West',
      round1: [
        ['1 Florida', '16 Norfolk St'],
        ['8 UConn', '9 Oklahoma'],
        ['5 Memphis', '12 Colorado St'],
        ['4 Maryland', '13 Grand Canyon'],
        ['6 Missouri', '11 Drake'],
        ['3 Texas Tech', '14 UNC Wilmington'],
        ['7 Kansas', '10 Arkansas'],
        ['2 St Johns', '15 Omaha']
      ]
    }
  ]
};

// Auth state listener
onAuthStateChanged(auth, user => {
  if (user) {
    loginDiv.style.display = 'none';
    dashboardDiv.style.display = 'block';
    adminEmailSpan.textContent = user.email;
    loadBracketSetup();
    loadBrackets();
    loadOfficialResults();
  } else {
    loginDiv.style.display = 'block';
    dashboardDiv.style.display = 'none';
  }
});

// Load bracket setup from Firebase
async function loadBracketSetup() {
  try {
    const setupDoc = await getDoc(doc(db, 'bracketSetup', 'current'));
    if (setupDoc.exists()) {
      const setup = setupDoc.data();
      masterBracket.regions = setup.regions;
      console.log('Loaded bracket setup from Firebase');
    }
  } catch (err) {
    console.log('No custom bracket setup found, using default');
  }
}

loginBtn.onclick = async () => {
  console.log('Login button clicked');
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    loginError.textContent = '';
  } catch (err) {
    console.error('Login error:', err);
    loginError.textContent = 'Login failed: ' + err.message;
  }
};

logoutBtn.onclick = () => signOut(auth);

// Download CSV Template
downloadTemplate.onclick = (e) => {
  e.preventDefault();
  
  const csvContent = `Region,Game,Seed1,Team1,Seed2,Team2
South,1,1,Auburn,16,Alabama St
South,2,8,Louisville,9,Creighton
South,3,5,Michigan,12,UC San Diego
South,4,4,Texas A&M,13,Yale
South,5,6,Ole Miss,11,North Carolina
South,6,3,Iowa St,14,Lipscomb
South,7,7,Marquette,10,New Mexico
South,8,2,Michigan St,15,Bryant
Midwest,1,1,Houston,16,SIU Edwardsville
Midwest,2,8,Gonzaga,9,Georgia
Midwest,3,5,Clemson,12,McNeese
Midwest,4,4,Purdue,13,High Point
Midwest,5,6,Illinois,11,Xavier
Midwest,6,3,Kentucky,14,Troy
Midwest,7,7,UCLA,10,Utah St
Midwest,8,2,Tennessee,15,Wofford
East,1,1,Duke,16,Mount St Marys
East,2,8,Mississippi St,9,Baylor
East,3,5,Oregon,12,Liberty
East,4,4,Arizona,13,Akron
East,5,6,BYU,11,VCU
East,6,3,Wisconsin,14,Montana
East,7,7,Saint Marys,10,Vanderbilt
East,8,2,Alabama,15,Robert Morris
West,1,1,Florida,16,Norfolk St
West,2,8,UConn,9,Oklahoma
West,3,5,Memphis,12,Colorado St
West,4,4,Maryland,13,Grand Canyon
West,5,6,Missouri,11,Drake
West,6,3,Texas Tech,14,UNC Wilmington
West,7,7,Kansas,10,Arkansas
West,8,2,St Johns,15,Omaha`;

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'march_madness_bracket_template.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};

// Upload and Parse CSV/Excel
uploadBtn.onclick = async () => {
  const file = bracketUpload.files[0];
  if (!file) {
    uploadStatus.textContent = 'Please select a file first.';
    uploadStatus.style.color = 'red';
    return;
  }
  
  uploadStatus.textContent = 'Processing file...';
  uploadStatus.style.color = 'blue';
  
  try {
    let csvText;
    
    // Check if Excel file
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Use SheetJS to parse Excel
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      csvText = XLSX.utils.sheet_to_csv(firstSheet);
    } else {
      // Read as CSV
      csvText = await file.text();
    }
    
    // Parse CSV
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });
    
    if (parsed.errors.length > 0) {
      uploadStatus.textContent = 'Error parsing file: ' + parsed.errors[0].message;
      uploadStatus.style.color = 'red';
      return;
    }
    
    // Build bracket structure from CSV
    const newBracket = buildBracketFromCSV(parsed.data);
    
    if (!newBracket) {
      uploadStatus.textContent = 'Invalid file format. Please use the template.';
      uploadStatus.style.color = 'red';
      return;
    }
    
    // Save to Firebase
    await setDoc(doc(db, 'bracketSetup', 'current'), {
      regions: newBracket.regions,
      updatedAt: new Date(),
      updatedBy: auth.currentUser.email
    });
    
    // Update masterBracket
    masterBracket.regions = newBracket.regions;
    
    uploadStatus.textContent = `Success! Bracket updated with ${newBracket.regions.length} regions. Refresh the page to see changes.`;
    uploadStatus.style.color = 'green';
    
    // Rebuild controls with new teams
    setTimeout(() => {
      buildControls();
    }, 1000);
    
  } catch (err) {
    console.error('Upload error:', err);
    uploadStatus.textContent = 'Error: ' + err.message;
    uploadStatus.style.color = 'red';
  }
};

function buildBracketFromCSV(data) {
  try {
    const regions = {};
    
    data.forEach(row => {
      const regionName = row.Region?.trim();
      const game = parseInt(row.Game);
      const seed1 = row.Seed1?.trim();
      const team1 = row.Team1?.trim();
      const seed2 = row.Seed2?.trim();
      const team2 = row.Team2?.trim();
      
      if (!regionName || !game || !team1 || !team2) {
        throw new Error('Missing required fields in CSV');
      }
      
      if (!regions[regionName]) {
        regions[regionName] = {
          name: regionName,
          round1: []
        };
      }
      
      // Build team string with seed
      const teamStr1 = seed1 ? `${seed1} ${team1}` : team1;
      const teamStr2 = seed2 ? `${seed2} ${team2}` : team2;
      
      regions[regionName].round1.push([teamStr1, teamStr2]);
    });
    
    // Convert to array and validate
    const regionArray = Object.values(regions);
    
    if (regionArray.length !== 4) {
      throw new Error('Must have exactly 4 regions');
    }
    
    regionArray.forEach(region => {
      if (region.round1.length !== 8) {
        throw new Error(`Region ${region.name} must have exactly 8 games (16 teams)`);
      }
    });
    
    return { regions: regionArray };
    
  } catch (err) {
    console.error('CSV parsing error:', err);
    return null;
  }
}

function buildControls() {
  resultsControls.innerHTML = '';
  const regionNames = ['south', 'midwest', 'east', 'west'];
  
  regionNames.forEach((region, rIdx) => {
    const regionDiv = document.createElement('div');
    regionDiv.className = 'col-md-3';
    regionDiv.innerHTML = `<h4 style="color: #003087;">${region.toUpperCase()}</h4>`;
    
    ['round1', 'round2', 'round3', 'round4'].forEach(round => {
      const num = round === 'round1' ? 8 : round === 'round2' ? 4 : round === 'round3' ? 2 : 1;
      
      for (let g = 1; g <= num; g++) {
        const sel = document.createElement('select');
        sel.className = 'form-select mb-2';
        sel.dataset.game = `${region}-${round}-game${g}`;
        sel.dataset.region = rIdx;
        sel.dataset.round = round;
        sel.dataset.gamenum = g;
        sel.innerHTML = `<option value="">${round.toUpperCase()} Game ${g}</option>`;
        
        sel.onchange = () => {
          handleWinnerSelection(region, round, g, sel.value);
          updateDownstreamDropdowns();
        };
        
        regionDiv.appendChild(sel);
      }
    });
    
    resultsControls.appendChild(regionDiv);
  });

  const ffDiv = document.createElement('div');
  ffDiv.className = 'col-md-12 mt-3';
  ffDiv.innerHTML = `<h4 style="color: #003087;">Final Four & Championship</h4>`;
  
  const semis1Sel = document.createElement('select');
  semis1Sel.className = 'form-select mb-2';
  semis1Sel.dataset.game = 'semis1-game1';
  semis1Sel.innerHTML = `<option value="">Semi 1 (South vs Midwest)</option>`;
  semis1Sel.onchange = () => {
    if (semis1Sel.value) {
      officialResults.winners['semis1-game1'] = semis1Sel.value;
    }
    updateDownstreamDropdowns();
  };
  ffDiv.appendChild(semis1Sel);
  
  const semis2Sel = document.createElement('select');
  semis2Sel.className = 'form-select mb-2';
  semis2Sel.dataset.game = 'semis2-game1';
  semis2Sel.innerHTML = `<option value="">Semi 2 (East vs West)</option>`;
  semis2Sel.onchange = () => {
    if (semis2Sel.value) {
      officialResults.winners['semis2-game1'] = semis2Sel.value;
    }
    updateDownstreamDropdowns();
  };
  ffDiv.appendChild(semis2Sel);
  
  const champSel = document.createElement('select');
  champSel.className = 'form-select mb-2';
  champSel.dataset.game = 'championship-game1';
  champSel.innerHTML = `<option value="">Championship</option>`;
  champSel.onchange = () => {
    if (champSel.value) {
      officialResults.winners['championship-game1'] = champSel.value;
    }
  };
  ffDiv.appendChild(champSel);
  
  resultsControls.appendChild(ffDiv);

  buildBonusSelects();
  populateRound1();
  updateDownstreamDropdowns();
}

function populateRound1() {
  const regionNames = ['south', 'midwest', 'east', 'west'];
  
  regionNames.forEach((region, rIdx) => {
    for (let g = 1; g <= 8; g++) {
      const sel = document.querySelector(`[data-game="${region}-round1-game${g}"]`);
      if (!sel) {
        return;
      }
      
      const teams = masterBracket.regions[rIdx].round1[g - 1];
      const currentValue = sel.value;
      const label = sel.querySelector('option').textContent;
      
      sel.innerHTML = `<option value="">${label}</option>`;
      sel.innerHTML += `<option value="${teams[0]}">${teams[0]}</option>`;
      sel.innerHTML += `<option value="${teams[1]}">${teams[1]}</option>`;
      
      if (currentValue) sel.value = currentValue;
    }
  });
}

function handleWinnerSelection(region, round, gameNum, winner) {
  const gameKey = `${region}-${round}-game${gameNum}`;
  if (winner) {
    officialResults.winners[gameKey] = winner;
  }
}

function updateDownstreamDropdowns() {
  const regionNames = ['south', 'midwest', 'east', 'west'];
  
  // Update Round 2
  for (let rIdx = 0; rIdx < regionNames.length; rIdx++) {
    const region = regionNames[rIdx];
    for (let g = 1; g <= 4; g++) {
      const sel = document.querySelector(`[data-game="${region}-round2-game${g}"]`);
      if (!sel) {
        break;
      }
      
      const r1Game1 = (g - 1) * 2 + 1;
      const r1Game2 = (g - 1) * 2 + 2;
      
      const winner1 = officialResults.winners[`${region}-round1-game${r1Game1}`];
      const winner2 = officialResults.winners[`${region}-round1-game${r1Game2}`];
      
      const currentValue = sel.value;
      const label = sel.querySelector('option').textContent;
      sel.innerHTML = `<option value="">${label}</option>`;
      
      if (winner1) sel.innerHTML += `<option value="${winner1}">${winner1}</option>`;
      if (winner2) sel.innerHTML += `<option value="${winner2}">${winner2}</option>`;
      
      if (currentValue && (currentValue === winner1 || currentValue === winner2)) {
        sel.value = currentValue;
      }
    }
  }
  
  // Update Round 3
  for (let rIdx = 0; rIdx < regionNames.length; rIdx++) {
    const region = regionNames[rIdx];
    for (let g = 1; g <= 2; g++) {
      const sel = document.querySelector(`[data-game="${region}-round3-game${g}"]`);
      if (!sel) {
        break;
      }
      
      const r2Game1 = (g - 1) * 2 + 1;
      const r2Game2 = (g - 1) * 2 + 2;
      
      const winner1 = officialResults.winners[`${region}-round2-game${r2Game1}`];
      const winner2 = officialResults.winners[`${region}-round2-game${r2Game2}`];
      
      const currentValue = sel.value;
      const label = sel.querySelector('option').textContent;
      sel.innerHTML = `<option value="">${label}</option>`;
      
      if (winner1) sel.innerHTML += `<option value="${winner1}">${winner1}</option>`;
      if (winner2) sel.innerHTML += `<option value="${winner2}">${winner2}</option>`;
      
      if (currentValue && (currentValue === winner1 || currentValue === winner2)) {
        sel.value = currentValue;
      }
    }
  }
  
  // Update Round 4
  for (let rIdx = 0; rIdx < regionNames.length; rIdx++) {
    const region = regionNames[rIdx];
    const sel = document.querySelector(`[data-game="${region}-round4-game1"]`);
    if (!sel) {
      break;
    }
    
    const winner1 = officialResults.winners[`${region}-round3-game1`];
    const winner2 = officialResults.winners[`${region}-round3-game2`];
    
    const currentValue = sel.value;
    const label = sel.querySelector('option').textContent;
    sel.innerHTML = `<option value="">${label}</option>`;
    
    if (winner1) sel.innerHTML += `<option value="${winner1}">${winner1}</option>`;
    if (winner2) sel.innerHTML += `<option value="${winner2}">${winner2}</option>`;
    
    if (currentValue && (currentValue === winner1 || currentValue === winner2)) {
      sel.value = currentValue;
    }
  }
  
  // Update Semis 1
  const semis1Sel = document.querySelector('[data-game="semis1-game1"]');
  if (semis1Sel) {
    const southWinner = officialResults.winners['south-round4-game1'];
    const midwestWinner = officialResults.winners['midwest-round4-game1'];
    
    const currentValue = semis1Sel.value;
    semis1Sel.innerHTML = `<option value="">Semi 1 (South vs Midwest)</option>`;
    
    if (southWinner) semis1Sel.innerHTML += `<option value="${southWinner}">${southWinner}</option>`;
    if (midwestWinner) semis1Sel.innerHTML += `<option value="${midwestWinner}">${midwestWinner}</option>`;
    
    if (currentValue && (currentValue === southWinner || currentValue === midwestWinner)) {
      semis1Sel.value = currentValue;
    }
  }
  
  // Update Semis 2
  const semis2Sel = document.querySelector('[data-game="semis2-game1"]');
  if (semis2Sel) {
    const eastWinner = officialResults.winners['east-round4-game1'];
    const westWinner = officialResults.winners['west-round4-game1'];
    
    const currentValue = semis2Sel.value;
    semis2Sel.innerHTML = `<option value="">Semi 2 (East vs West)</option>`;
    
    if (eastWinner) semis2Sel.innerHTML += `<option value="${eastWinner}">${eastWinner}</option>`;
    if (westWinner) semis2Sel.innerHTML += `<option value="${westWinner}">${westWinner}</option>`;
    
    if (currentValue && (currentValue === eastWinner || currentValue === westWinner)) {
      semis2Sel.value = currentValue;
    }
  }
  
  // Update Championship
  const champSel = document.querySelector('[data-game="championship-game1"]');
  if (champSel) {
    const semis1Winner = officialResults.winners['semis1-game1'];
    const semis2Winner = officialResults.winners['semis2-game1'];
    
    const currentValue = champSel.value;
    champSel.innerHTML = `<option value="">Championship</option>`;
    
    if (semis1Winner) champSel.innerHTML += `<option value="${semis1Winner}">${semis1Winner}</option>`;
    if (semis2Winner) champSel.innerHTML += `<option value="${semis2Winner}">${semis2Winner}</option>`;
    
    if (currentValue && (currentValue === semis1Winner || currentValue === semis2Winner)) {
      champSel.value = currentValue;
    }
  }
}

function buildBonusSelects() {
  const regionNames = ['south', 'midwest', 'east', 'west'];
  
  // Build bonus game selects
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
    
    sel.innerHTML += `<option value="semis1-game1">SEMI 1 (South vs Midwest)</option>`;
    sel.innerHTML += `<option value="semis2-game1">SEMI 2 (East vs West)</option>`;
    sel.innerHTML += `<option value="championship-game1">CHAMPIONSHIP</option>`;
  });
  
  // Build outlined game selects (same options)
  ['outlined1', 'outlined2', 'outlined3', 'outlined4'].forEach(o => {
    const sel = document.getElementById(o);
    sel.innerHTML = '<option value="">Select Game to Outline</option>';
    
    regionNames.forEach(r => {
      ['round1', 'round2', 'round3', 'round4'].forEach(round => {
        const num = round === 'round1' ? 8 : round === 'round2' ? 4 : round === 'round3' ? 2 : 1;
        
        for (let g = 1; g <= num; g++) {
          sel.innerHTML += `<option value="${r}-${round}-game${g}">${r.toUpperCase()} ${round.toUpperCase()} Game ${g}</option>`;
        }
      });
    });
    
    sel.innerHTML += `<option value="semis1-game1">SEMI 1 (South vs Midwest)</option>`;
    sel.innerHTML += `<option value="semis2-game1">SEMI 2 (East vs West)</option>`;
    sel.innerHTML += `<option value="championship-game1">CHAMPIONSHIP</option>`;
  });
}

async function loadOfficialResults() {
  const resultsDoc = await getDoc(doc(db, 'officialResults', 'current'));
  
  if (resultsDoc.exists()) {
    officialResults = resultsDoc.data();
    populateResultsControls(officialResults);
  } else {
    officialResults = { winners: {}, bonusGames: {} };
  }
}

function populateResultsControls(results) {
  if (!results) return;
  
  if (results.winners) {
    Object.keys(results.winners).forEach(gameKey => {
      const sel = document.querySelector(`[data-game="${gameKey}"]`);
      if (sel) {
        sel.value = results.winners[gameKey];
        
        const [region, round, game] = gameKey.split('-');
        if (round && game) {
          const gameNum = parseInt(game.replace('game', ''));
          handleWinnerSelection(region, round, gameNum, results.winners[gameKey]);
        }
      }
    });
  }
  
  if (results.bonusGames) {
    Object.keys(results.bonusGames).forEach(bonusKey => {
      const sel = document.getElementById(bonusKey);
      if (sel) {
        sel.value = results.bonusGames[bonusKey];
      }
    });
  }
  
  if (results.outlinedGames) {
    Object.keys(results.outlinedGames).forEach(outlinedKey => {
      const sel = document.getElementById(outlinedKey);
      if (sel) {
        sel.value = results.outlinedGames[outlinedKey];
      }
    });
  }
  
  updateDownstreamDropdowns();
}

saveResultsBtn.onclick = async () => {
  const winners = {};
  const bonusGames = {};
  const outlinedGames = {};
  
  document.querySelectorAll('#resultsControls select').forEach(sel => {
    const gameKey = sel.dataset.game;
    if (sel.value) {
      winners[gameKey] = sel.value;
    }
  });
  
  ['bonus1', 'bonus2', 'bonus3', 'bonus4'].forEach(b => {
    const sel = document.getElementById(b);
    if (sel.value) {
      bonusGames[b] = sel.value;
    }
  });
  
  ['outlined1', 'outlined2', 'outlined3', 'outlined4'].forEach(o => {
    const sel = document.getElementById(o);
    if (sel.value) {
      outlinedGames[o] = sel.value;
    }
  });
  
  try {
    await setDoc(doc(db, 'officialResults', 'current'), {
      winners,
      bonusGames,
      outlinedGames,
      updatedAt: new Date()
    });
    
    officialResults = { winners, bonusGames, outlinedGames };
    scoreStatus.textContent = 'Results saved! Click "Score All Brackets" to update scores.';
    scoreStatus.style.color = 'green';
  } catch (err) {
    scoreStatus.textContent = 'Error: ' + err.message;
    scoreStatus.style.color = 'red';
  }
};

scoreBtn.onclick = async () => {
  if (!officialResults || !officialResults.winners || Object.keys(officialResults.winners).length === 0) {
    scoreStatus.textContent = 'Please save official results first!';
    scoreStatus.style.color = 'red';
    return;
  }
  
  scoreStatus.textContent = 'Scoring brackets...';
  scoreStatus.style.color = 'blue';
  
  try {
    let scoredCount = 0;
    
    for (const bracket of allBrackets) {
      const score = scoreBracket(bracket.picks, officialResults);
      
      await setDoc(doc(db, 'scores', bracket.id), {
        entryName: bracket.entryName,
        total: score.total,
        breakdown: score.breakdown,
        tiebreaker: bracket.tiebreaker,
        lastScored: new Date()
      });
      
      scoredCount++;
    }
    
    scoreStatus.textContent = `Scored ${scoredCount} brackets! Check leaderboard.`;
    scoreStatus.style.color = 'green';
  } catch (err) {
    scoreStatus.textContent = 'Error: ' + err.message;
    scoreStatus.style.color = 'red';
  }
};

function scoreBracket(picks, results) {
  let total = 0;
  const breakdown = { round1: 0, round2: 0, round3: 0, round4: 0, semis: 0, championship: 0, bonus: 0 };
  
  const roundPoints = { round1: 1, round2: 2, round3: 4, round4: 8 };
  
  if (picks.regions) {
    picks.regions.forEach((region, rIdx) => {
      const regionName = ['south', 'midwest', 'east', 'west'][rIdx];
      
      ['round1', 'round2', 'round3', 'round4'].forEach(round => {
        const roundData = region[round];
        
        if (roundData) {
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
        }
      });
    });
  }
  
  if (picks.finalFour) {
    if (picks.finalFour.semis1?.game1?.pick === results.winners['semis1-game1']) {
      total += 16;
      breakdown.semis += 16;
    }
    
    if (picks.finalFour.semis2?.game1?.pick === results.winners['semis2-game1']) {
      total += 16;
      breakdown.semis += 16;
    }
    
    if (picks.finalFour.championship?.game1?.pick === results.winners['championship-game1']) {
      total += 32;
      breakdown.championship += 32;
    }
  }
  
  if (results.bonusGames) {
    ['bonus1', 'bonus2', 'bonus3', 'bonus4'].forEach(bonusKey => {
      const bonusGame = results.bonusGames[bonusKey];
      if (!bonusGame) return;
      
      const [region, round, game] = bonusGame.split('-');
      
      if (region === 'semis1' || region === 'semis2' || region === 'championship') {
        const pick = picks.finalFour?.[region]?.game1?.pick;
        if (pick === results.winners[bonusGame]) {
          total += 5;
          breakdown.bonus += 5;
        }
      } else {
        const regionIdx = ['south', 'midwest', 'east', 'west'].indexOf(region);
        const pick = picks.regions?.[regionIdx]?.[round]?.[game]?.pick;
        if (pick === results.winners[bonusGame]) {
          total += 5;
          breakdown.bonus += 5;
        }
      }
    });
  }
  
  return { total, breakdown };
}

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
    buildControls();
    
    if (officialResults && officialResults.winners) {
      populateResultsControls(officialResults);
    }
  });
}

window.deleteBracket = async (id) => {
  if (!confirm('Delete this bracket?')) return;
  
  try {
    await deleteDoc(doc(db, 'brackets', id));
    try { await deleteDoc(doc(db, 'scores', id)); } catch (e) {}
    scoreStatus.textContent = 'Bracket deleted!';
    scoreStatus.style.color = 'green';
  } catch (err) {
    scoreStatus.textContent = 'Error: ' + err.message;
    scoreStatus.style.color = 'red';
  }
};

window.editBracket = (id) => {
  const bracket = allBrackets.find(b => b.id === id);
  if (!bracket) return;
  
  currentEditId = id;
  editName.value = bracket.entryName;
  editForm.style.display = 'block';
};

saveEdit.onclick = async () => {
  if (!currentEditId) return;
  
  try {
    await updateDoc(doc(db, 'brackets', currentEditId), { entryName: editName.value });
    try { await updateDoc(doc(db, 'scores', currentEditId), { entryName: editName.value }); } catch (e) {}
    
    editForm.style.display = 'none';
    currentEditId = null;
    scoreStatus.textContent = 'Updated!';
    scoreStatus.style.color = 'green';
  } catch (err) {
    scoreStatus.textContent = 'Error: ' + err.message;
    scoreStatus.style.color = 'red';
  }
};

cancelEdit.onclick = () => {
  editForm.style.display = 'none';
  currentEditId = null;
};

exportPdf.onclick = async () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  const scoresSnap = await getDocs(query(collection(db, 'scores'), orderBy('total', 'desc')));
  
  pdf.setFontSize(16);
  pdf.text('March Madness 2025 Leaderboard', 10, 10);
  pdf.setFontSize(10);
  
  let y = 25;
  scoresSnap.forEach((d, idx) => {
    const data = d.data();
    pdf.text(`${idx + 1}. ${data.entryName} - ${data.total} pts (Tie: ${data.tiebreaker})`, 10, y);
    y += 8;
    if (y > 280) { pdf.addPage(); y = 20; }
  });
  
  pdf.save('leaderboard.pdf');
};
