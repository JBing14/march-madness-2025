import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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
const db = firebase.firestore();

let locked = false;

const regions = [
  {
    name: 'East',
    round1: [
      ['1 Duke', '16 American/Mount St. Mary\'s'],
      ['8 Mississippi State', '9 Baylor'],
      ['4 Arizona', '13 Akron'],
      ['5 Oregon', '12 Liberty'],
      ['2 Alabama', '15 Robert Morris'],
      ['7 Saint Mary\'s', '10 Vanderbilt'],
      ['3 Wisconsin', '14 Montana'],
      ['6 BYU', '11 VCU']
    ]
  },
  {
    name: 'West',
    round1: [
      ['1 Florida', '16 Norfolk State'],
      ['8 UConn', '9 Oklahoma'],
      ['4 Maryland', '13 Grand Canyon'],
      ['5 Memphis', '12 Colorado State'],
      ['2 St. John\'s', '15 Omaha'],
      ['7 Kansas', '10 Arkansas'],
      ['3 Texas Tech', '14 UNC Wilmington'],
      ['6 Missouri', '11 Drake']
    ]
  },
  {
    name: 'South',
    round1: [
      ['1 Auburn', '16 Alabama State/Saint Francis'],
      ['1 Auburn', '16 Alabama St'],
      ['8 Louisville', '9 Creighton'],
      ['4 Texas A&M', '13 Yale'],
      ['5 Michigan', '12 UC San Diego'],
      ['2 Michigan State', '15 Bryant'],
      ['4 Texas A&M', '13 Yale'],
      ['6 Ole Miss', '11 North Carolina'],
      ['3 Iowa St', '14 Lipscomb'],
      ['7 Marquette', '10 New Mexico'],
      ['3 Iowa State', '14 Lipscomb'],
      ['6 Ole Miss', '11 San Diego State/North Carolina']
    ]
      ['2 Michigan St', '15 Bryant']
    ],
    round2: Array(4).fill(['', '']),
    round3: Array(2).fill(['', '']),
    round4: ['', ''],
    elite8: ''
  },
  {
    name: 'Midwest',
    name: 'Midwest', // Stacked below South on left
    round1: [
      ['1 Houston', '16 SIU Edwardsville'],
      ['8 Gonzaga', '9 Georgia'],
      ['4 Purdue', '13 High Point'],
      ['5 Clemson', '12 McNeese'],
      ['2 Tennessee', '15 Wofford'],
      ['7 UCLA', '10 Utah State'],
      ['4 Purdue', '13 High Point'],
      ['6 Illinois', '11 Xavier'],
      ['3 Kentucky', '14 Troy'],
      ['6 Illinois', '11 Texas/Xavier']
    ]
      ['7 UCLA', '10 Utah St'],
      ['2 Tennessee', '15 Wofford']
    ],
    round2: Array(4).fill(['', '']),
    round3: Array(2).fill(['', '']),
    round4: ['', ''],
    elite8: ''
  },
  {
    name: 'East', // Top on right
    round1: [
      ['1 Duke', '16 Mount St Marys'],
      ['8 Mississippi St', '9 Baylor'],
      ['5 Oregon', '12 Liberty'],
      ['4 Arizona', '13 Akron'],
      ['6 BYU', '11 VCU'],
      ['3 Wisconsin', '14 Montana'],
      ['7 Saint Marys', '10 Vanderbilt'],
      ['2 Alabama', '15 Robert Morris']
    ],
    round2: Array(4).fill(['', '']),
    round3: Array(2).fill(['', '']),
    round4: ['', ''],
    elite8: ''
  },
  {
    name: 'West', // Bottom on right
    round1: [
      ['1 Florida', '16 Norfolk St'],
      ['8 UConn', '9 Oklahoma'],
      ['5 Memphis', '12 Colorado St'],
      ['4 Maryland', '13 Grand Canyon'],
      ['6 Missouri', '11 Drake'],
      ['3 Texas Tech', '14 UNC Wilmington'],
      ['7 Kansas', '10 Arkansas'],
      ['2 St Johns', '15 Omaha']
    ],
    round2: Array(4).fill(['', '']),
    round3: Array(2).fill(['', '']),
    round4: ['', ''],
    elite8: ''
  }
];

regions.forEach(region => {
  region.round2 = Array.from({ length: 8 }, () => [null, null]);
  region.round3 = Array.from({ length: 4 }, () => [null, null]);
  region.round4 = Array.from({ length: 2 }, () => [null, null]);
  region.elite8 = null; // Winner of region
});

const finalFour = {
  semis: [[null, null], [null, null]], // East vs West, South vs Midwest
  championship: [null, null],
  champion: null
  semis1: ['', ''] , // South vs Midwest winner
  semis2: ['', ''] , // East vs West winner
  championship: ['', ''],
  champion: ''
};

const picks = {
  regions: regions.map(() => ({
    round1: {}, round2: {}, round3: {}, round4: {}
  })),
  finalFour: { semis: {}, championship: {} }
  finalFour: { semis1: {}, semis2: {}, championship: {} }
};

function renderBracket() {
  const bracketEl = document.getElementById('bracket');
  bracketEl.innerHTML = '';
  regions.forEach((region, rIdx) => {
    const regionEl = document.createElement('div');
    regionEl.className = 'region col-lg-2 col-md-3 col-sm-6';
    regionEl.innerHTML = `<h2>${region.name}</h2>`;
    ['round1', 'round2', 'round3', 'round4'].forEach((roundName, roundIdx) => {
      const roundEl = document.createElement('div');
      roundEl.className = `round round-${roundIdx + 1}`;
      roundEl.dataset.title = roundName === 'round1' ? 'Round of 64' : roundName === 'round2' ? 'Round of 32' : roundName === 'round3' ? 'Sweet 16' : 'Elite 8';
      renderRound(roundEl, region[roundName], (mIdx, team) => pickRegionRound(rIdx, roundName, mIdx, team));
      regionEl.appendChild(roundEl);
    });
    bracketEl.appendChild(regionEl);
  });
  // Clear all rounds
  document.querySelectorAll('.round').forEach(round => round.innerHTML = '<h3>' + round.querySelector('h3').textContent + '</h3>');

  // Left side: Regions 0 (South) and 1 (Midwest)
  renderRegion('round-1-left', 0, 'round1', true);
  renderRegion('round-1-left', 1, 'round1', false);
  renderRegion('round-2-left', 0, 'round2', true);
  renderRegion('round-2-left', 1, 'round2', false);
  renderRegion('round-3-left', 0, 'round3', true);
  renderRegion('round-3-left', 1, 'round3', false);
  renderRegion('round-4-left', 0, 'round4', true);
  renderRegion('round-4-left', 1, 'round4', false);

  // Right side: Regions 2 (East) and 3 (West)
  renderRegion('round-1-right', 2, 'round1', true);
  renderRegion('round-1-right', 3, 'round1', false);
  renderRegion('round-2-right', 2, 'round2', true);
  renderRegion('round-2-right', 3, 'round2', false);
  renderRegion('round-3-right', 2, 'round3', true);
  renderRegion('round-3-right', 3, 'round3', false);
  renderRegion('round-4-right', 2, 'round4', true);
  renderRegion('round-4-right', 3, 'round4', false);

  // Final Four
  const ffEl = document.createElement('div');
  ffEl.className = 'region col-lg-2 col-md-3 col-sm-6';
  ffEl.innerHTML = `<h2>Final Four</h2>`;
  renderRound(ffEl, finalFour.semis, (mIdx, team) => pickFinalFour('semis', mIdx, team));
  ffEl.appendChild(document.createElement('hr'));
  const champRound = document.createElement('div');
  champRound.className = 'round';
  champRound.dataset.title = 'Championship';
  renderRound(champRound, [finalFour.championship], (mIdx, team) => pickFinalFour('championship', mIdx, team));
  ffEl.appendChild(champRound);
  ffEl.appendChild(document.createElement('hr'));
  const champEl = document.createElement('div');
  champEl.className = 'matchup';
  const champBtn = document.createElement('button');
  champBtn.className = 'team btn btn-outline-primary champion';
  champBtn.textContent = finalFour.champion || 'Champion';
  champBtn.disabled = true;
  champEl.appendChild(champBtn);
  ffEl.appendChild(champEl);
  bracketEl.appendChild(ffEl);
  // Final Four left: semis1 (South vs Midwest)
  renderMatch('round-5-left', 'm1', finalFour.semis1, 'finalFour.semis1.game1', pickFinalFour.bind(null, 'semis1', 0));

  // Final Four right: semis2 (East vs West)
  renderMatch('round-5-right', 'm1', finalFour.semis2, 'finalFour.semis2.game1', pickFinalFour.bind(null, 'semis2', 0));

  // Championship left: winner semis1 vs winner semis2 (but since one game, use left for the game)
  renderMatch('round-6-left', 'm1', finalFour.championship, 'finalFour.championship.game1', pickFinalFour.bind(null, 'championship', 0));

  // Champion
  const champRound = document.getElementById('champion');
  const champSlot = document.createElement('div');
  champSlot.className = 'slot champion';
  champSlot.textContent = finalFour.champion || '';
  champRound.appendChild(champSlot);

  if (locked) {
    document.querySelectorAll('button.team').forEach(btn => btn.disabled = true);
    document.getElementById('form').style.display = 'none';
    document.querySelectorAll('.slot').forEach(slot => slot.onclick = null);
    document.getElementById('user-form').querySelector('button').disabled = true;
    document.getElementById('confirmation').style.display = 'block';
  }
}

function renderRound(container, data, onPick) {
  container.innerHTML = `<strong>${container.dataset.title}</strong>`;
  data.forEach((m, i) => {
    const div = document.createElement('div');
    div.className = 'matchup';
    m.forEach((team, slot) => {
      const btn = document.createElement('button');
      btn.className = 'team btn btn-outline-primary';
      btn.textContent = team || '';
      btn.disabled = !team || locked;
      if (team && onPick && !locked) btn.onclick = () => onPick(i, team);
      div.appendChild(btn);
    });
    container.appendChild(div);
  });
function renderRegion(roundId, rIdx, roundName, isTop) {
  const roundEl = document.getElementById(roundId);
  const regionEl = document.createElement('div');
  regionEl.className = 'region';
  regionEl.innerHTML = `<h4>${regions[rIdx].name}</h4>`;
  const numMatches = roundName === 'round1' ? 8 : roundName === 'round2' ? 4 : roundName === 'round3' ? 2 : 1;
  for (let m = 0; m < numMatches; m++) {
    const matchEl = document.createElement('div');
    matchEl.className = 'match m' + (m + 1);
    const teams = regions[rIdx][roundName][m];
    for (let s = 0; s < (roundName === 'round4' ? 2 : 2); s++) { // round4 is matchup
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.textContent = teams[s] || '';
      if (teams[s] && !locked) {
        slot.onclick = () => pickRegionRound(rIdx, roundName, m, teams[s]);
      } else if (!teams[s]) {
        slot.classList.add('empty');
      }
      matchEl.appendChild(slot);
    }
    regionEl.appendChild(matchEl);
  }
  roundEl.appendChild(regionEl);
}

function renderMatch(roundId, matchClass, teams, pickKey, onPick) {
  const roundEl = document.getElementById(roundId);
  const matchEl = document.createElement('div');
  matchEl.className = 'match ' + matchClass;
  for (let s = 0; s < 2; s++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.textContent = teams[s] || '';
    if (teams[s] && !locked) {
      slot.onclick = () => onPick(teams[s]);
    } else if (!teams[s]) {
      slot.classList.add('empty');
    }
    matchEl.appendChild(slot);
  }
  roundEl.appendChild(matchEl);
}

function pickRegionRound(rIdx, roundName, mIdx, team) {
  picks.regions[rIdx][roundName][`game${mIdx + 1}`] = team;
  const nextRoundIdx = ['round1', 'round2', 'round3', 'round4'].indexOf(roundName) + 1;
  if (nextRoundIdx < 4) {
    const nextRoundName = ['round1', 'round2', 'round3', 'round4'][nextRoundIdx];
  const nextRoundName = roundName === 'round1' ? 'round2' : roundName === 'round2' ? 'round3' : roundName === 'round3' ? 'round4' : null;
  if (nextRoundName) {
    const nextMIdx = Math.floor(mIdx / 2);
    const slot = mIdx % 2;
    regions[rIdx][nextRoundName][nextMIdx][slot] = team;
    clearRegionDownstream(rIdx, nextRoundName);
  } else {
    regions[rIdx].elite8 = team;
    updateFinalFourSemis();
    updateFinalFour();
  }
  renderBracket();
}

function pickFinalFour(stage, mIdx, team) {
  picks.finalFour[stage][`game${mIdx + 1}`] = team;
  if (stage === 'semis') {
    finalFour.championship[mIdx] = team;
  } else {
function pickFinalFour(stage, team) {
  const semisIdx = stage === 'semis1' ? 0 : stage === 'semis2' ? 1 : null;
  if (semisIdx !== null) {
    const slot = finalFour[`semis${semisIdx + 1}`].indexOf(''); // Find empty slot? But since click on one, determine which
    // To fix, need to pass slot idx
    // Wait, rewrite to pass slot
    // For simplicity, assume click advances to championship slot corresponding
    const championshipSlot = semisIdx;
    finalFour.championship[championshipSlot] = team;
    picks.finalFour[stage].game1 = team; // Adjust
  } else if (stage === 'championship') {
    finalFour.champion = team;
    picks.finalFour.championship.game1 = team;
  }
  clearFinalDownstream(stage);
  renderBracket();
}

function clearRegionDownstream(rIdx, roundName) {
  const rounds = ['round2', 'round3', 'round4'];
  const startIdx = rounds.indexOf(roundName);
  for (let i = startIdx; i < rounds.length; i++) {
    regions[rIdx][rounds[i]] = Array.from({ length: Math.pow(2, 4 - i - 1) }, () => [null, null]);
  }
  regions[rIdx].elite8 = null;
  updateFinalFourSemis();
}

function clearFinalDownstream(stage) {
  if (stage === 'semis') {
    finalFour.championship = [null, null];
  const start = rounds.indexOf(roundName);
  for (let i = start; i < rounds.length; i++) {
    regions[rIdx][rounds[i]] = Array(Math.pow(2, 3 - i)).fill(['', '']);
  }
  finalFour.champion = null;
  regions[rIdx].elite8 = '';
  updateFinalFour();
}

function updateFinalFourSemis() {
  finalFour.semis[0][0] = regions[0].elite8;
  finalFour.semis[0][1] = regions[1].elite8;
  finalFour.semis[1][0] = regions[2].elite8;
  finalFour.semis[1][1] = regions[3].elite8;
  if (!finalFour.semis.every(s => s.every(t => t))) {
    finalFour.championship = [null, null];
    finalFour.champion = null;
function updateFinalFour() {
  finalFour.semis1[0] = regions[0].elite8;
  finalFour.semis1[1] = regions[1].elite8;
  finalFour.semis2[0] = regions[2].elite8;
  finalFour.semis2[1] = regions[3].elite8;
  if (!finalFour.semis1.every(t => t) || !finalFour.semis2.every(t => t)) {
    finalFour.championship = ['', ''];
    finalFour.champion = '';
  }
}

@@ -230,40 +252,42 @@ function serializeBracket() {
    round1: serializeRound(r.round1, picks.regions[regions.indexOf(r)].round1),
    round2: serializeRound(r.round2, picks.regions[regions.indexOf(r)].round2),
    round3: serializeRound(r.round3, picks.regions[regions.indexOf(r)].round3),
    round4: serializeRound(r.round4, picks.regions[regions.indexOf(r)].round4),
    round4: { game1: { slot1: r.round4[0], slot2: r.round4[1], pick: picks.regions[regions.indexOf(r)].round4.game1 || null } },
    elite8: r.elite8
  }));
  const serializedFinalFour = {
    semis: serializeRound(finalFour.semis, picks.finalFour.semis),
    championship: serializeRound([finalFour.championship], picks.finalFour.championship),
    semis1: { game1: { slot1: finalFour.semis1[0], slot2: finalFour.semis1[1], pick: picks.finalFour.semis1.game1 || null } },
    semis2: { game1: { slot1: finalFour.semis2[0], slot2: finalFour.semis2[1], pick: picks.finalFour.semis2.game1 || null } },
    championship: { game1: { slot1: finalFour.championship[0], slot2: finalFour.championship[1], pick: picks.finalFour.championship.game1 || null } },
    champion: finalFour.champion
  };
  return { regions: serializedRegions, finalFour: serializedFinalFour };
}

document.getElementById('submitBtn').onclick = async () => {
  if (locked) return;
  if (!isComplete()) return alert('Complete the entire bracket, including champion!');
  if (!isComplete()) return document.getElementById('error').textContent = 'Complete the bracket!';
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const tiebreaker = parseInt(document.getElementById('tiebreaker').value.trim());
  if (!name || !email.match(/^\S+@\S+\.\S+$/) || isNaN(tiebreaker)) return alert('Please fill in all fields with valid data!');
  if (!name || !email.match(/^\S+@\S+\.\S+$/) || isNaN(tiebreaker)) return document.getElementById('error').textContent = 'Invalid fields!';

  const q = query(collection(db, "brackets"), where("email", "==", email));
  const snap = await getDocs(q);
  const q = db.collection("brackets").where("email", "==", email);
  const snap = await q.get();
  const entryNumber = snap.size + 1;

  locked = true;
  await addDoc(collection(db, "brackets"), {
  await db.collection("brackets").add({
    name,
    email,
    entryName: `${name} ${entryNumber}`,
    tiebreaker: Number(tiebreaker),
    submittedAt: serverTimestamp(),
    submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
    picks: serializeBracket()
  });

  alert("Bracket submitted and locked.");
  document.getElementById('error').textContent = '';
  document.getElementById('confirmation').style.display = 'block';
  renderBracket();
};

