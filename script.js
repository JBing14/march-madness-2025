const db = firebase.firestore();

let locked = false;
let outlinedBoxes = [];

const regions = [
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
    ],
    round2: Array(4).fill(null).map(() => ['', '']),
    round3: Array(2).fill(null).map(() => ['', '']),
    round4: Array(1).fill(null).map(() => ['', '']),
    elite8: ''
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
    ],
    round2: Array(4).fill(null).map(() => ['', '']),
    round3: Array(2).fill(null).map(() => ['', '']),
    round4: Array(1).fill(null).map(() => ['', '']),
    elite8: ''
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
    ],
    round2: Array(4).fill(null).map(() => ['', '']),
    round3: Array(2).fill(null).map(() => ['', '']),
    round4: Array(1).fill(null).map(() => ['', '']),
    elite8: ''
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
    ],
    round2: Array(4).fill(null).map(() => ['', '']),
    round3: Array(2).fill(null).map(() => ['', '']),
    round4: Array(1).fill(null).map(() => ['', '']),
    elite8: ''
  }
];

const finalFour = {
  semis1: ['', ''],
  semis2: ['', ''],
  championship: ['', ''],
  champion: ''
};

const picks = {
  regions: regions.map(() => ({
    round1: {}, round2: {}, round3: {}, round4: {}
  })),
  finalFour: { semis1: {}, semis2: {}, championship: {} }
};

function renderBracket() {
  document.querySelectorAll('.round').forEach(round => {
    const h3 = round.querySelector('h3');
    const h3Text = h3 ? h3.textContent : '';
    round.innerHTML = h3Text ? '<h3>' + h3Text + '</h3>' : '';
  });

  // Left side: South (0) and Midwest (1)
  renderRegion('round-1-left', 0, 'round1');
  renderRegion('round-1-left', 1, 'round1');
  renderRegion('round-2-left', 0, 'round2');
  renderRegion('round-2-left', 1, 'round2');
  renderRegion('round-3-left', 0, 'round3');
  renderRegion('round-3-left', 1, 'round3');
  renderRegion('round-4-left', 0, 'round4');
  renderRegion('round-4-left', 1, 'round4');

  // Right side: East (2) and West (3)
  renderRegion('round-1-right', 2, 'round1');
  renderRegion('round-1-right', 3, 'round1');
  renderRegion('round-2-right', 2, 'round2');
  renderRegion('round-2-right', 3, 'round2');
  renderRegion('round-3-right', 2, 'round3');
  renderRegion('round-3-right', 3, 'round3');
  renderRegion('round-4-right', 2, 'round4');
  renderRegion('round-4-right', 3, 'round4');

  // Final Four
  renderFinalFour();

  // Champion
  const champRound = document.getElementById('champion');
  const champSlot = document.createElement('div');
  champSlot.className = 'slot champion-slot';
  champSlot.textContent = finalFour.champion || 'Winner';
  champRound.appendChild(champSlot);

  if (locked) {
    document.querySelectorAll('.slot').forEach(slot => slot.onclick = null);
    document.getElementById('user-form').querySelector('button').disabled = true;
    document.getElementById('confirmation').style.display = 'block';
  }
}

function renderRegion(roundId, rIdx, roundName) {
  const roundEl = document.getElementById(roundId);
  const regionEl = document.createElement('div');
  regionEl.className = 'region';
  regionEl.innerHTML = `<h4>${regions[rIdx].name}</h4>`;
  
  const numMatches = roundName === 'round1' ? 8 : roundName === 'round2' ? 4 : roundName === 'round3' ? 2 : 1;
  
  for (let m = 0; m < numMatches; m++) {
    const matchEl = document.createElement('div');
    matchEl.className = 'match';
    matchEl.dataset.matchIndex = m;
    
    const teams = regions[rIdx][roundName][m];
    
    for (let s = 0; s < 2; s++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.textContent = teams[s] || '';
      
      // Check if THIS specific slot should be outlined FIRST
      const shouldBeOutlined = isSlotOutlined(rIdx, roundName, m, s);
      
      if (teams[s] && !locked) {
        slot.onclick = () => pickRegionRound(rIdx, roundName, m, teams[s]);
        slot.classList.add('clickable');
      } else if (!teams[s]) {
        slot.classList.add('empty');
      }
      
      // Apply outlined class - do this AFTER other classes
      if (shouldBeOutlined) {
        slot.classList.add('outlined');
        console.log('Applied outlined class to slot:', slot.textContent);
      }
      
      matchEl.appendChild(slot);
    }
    
    regionEl.appendChild(matchEl);
  }
  
  roundEl.appendChild(regionEl);
}

function renderFinalFour() {
  // Render semis1 on left (South vs Midwest)
  const leftSemis = document.getElementById('round-5-left');
  const semis1Match = document.createElement('div');
  semis1Match.className = 'match final-four-match';
  
  for (let s = 0; s < 2; s++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.textContent = finalFour.semis1[s] || '';
    
    if (finalFour.semis1[s] && !locked) {
      slot.onclick = () => pickFinalFour('semis1', finalFour.semis1[s]);
      slot.classList.add('clickable');
    } else if (!finalFour.semis1[s]) {
      slot.classList.add('empty');
    }
    
    semis1Match.appendChild(slot);
  }
  leftSemis.appendChild(semis1Match);

  // Render semis2 on right (East vs West)
  const rightSemis = document.getElementById('round-5-right');
  const semis2Match = document.createElement('div');
  semis2Match.className = 'match final-four-match';
  
  for (let s = 0; s < 2; s++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.textContent = finalFour.semis2[s] || '';
    
    if (finalFour.semis2[s] && !locked) {
      slot.onclick = () => pickFinalFour('semis2', finalFour.semis2[s]);
      slot.classList.add('clickable');
    } else if (!finalFour.semis2[s]) {
      slot.classList.add('empty');
    }
    
    semis2Match.appendChild(slot);
  }
  rightSemis.appendChild(semis2Match);

  // Render LEFT championship (winner of semis1 - South/Midwest side)
  const leftChampRound = document.getElementById('round-6-left');
  const leftChampMatch = document.createElement('div');
  leftChampMatch.className = 'match championship-match';
  
  const leftChampSlot = document.createElement('div');
  leftChampSlot.className = 'slot';
  leftChampSlot.textContent = finalFour.championship[0] || '';
  
  if (finalFour.championship[0] && !locked) {
    leftChampSlot.onclick = () => pickFinalFour('championship', finalFour.championship[0]);
    leftChampSlot.classList.add('clickable');
  } else if (!finalFour.championship[0]) {
    leftChampSlot.classList.add('empty');
  }
  
  leftChampMatch.appendChild(leftChampSlot);
  leftChampRound.appendChild(leftChampMatch);

  // Render RIGHT championship (winner of semis2 - East/West side)
  const rightChampRound = document.getElementById('round-6-right');
  const rightChampMatch = document.createElement('div');
  rightChampMatch.className = 'match championship-match';
  
  const rightChampSlot = document.createElement('div');
  rightChampSlot.className = 'slot';
  rightChampSlot.textContent = finalFour.championship[1] || '';
  
  if (finalFour.championship[1] && !locked) {
    rightChampSlot.onclick = () => pickFinalFour('championship', finalFour.championship[1]);
    rightChampSlot.classList.add('clickable');
  } else if (!finalFour.championship[1]) {
    rightChampSlot.classList.add('empty');
  }
  
  rightChampMatch.appendChild(rightChampSlot);
  rightChampRound.appendChild(rightChampMatch);
}

function pickRegionRound(rIdx, roundName, mIdx, team) {
  if (locked) return;
  
  // Record the pick
  picks.regions[rIdx][roundName][`game${mIdx + 1}`] = team;
  
  // Determine next round
  if (roundName === 'round1') {
    const nextMIdx = Math.floor(mIdx / 2);
    const nextSlotIdx = mIdx % 2;
    regions[rIdx].round2[nextMIdx][nextSlotIdx] = team;
    clearRegionDownstream(rIdx, 'round2', nextMIdx);
  } else if (roundName === 'round2') {
    const nextMIdx = Math.floor(mIdx / 2);
    const nextSlotIdx = mIdx % 2;
    regions[rIdx].round3[nextMIdx][nextSlotIdx] = team;
    clearRegionDownstream(rIdx, 'round3', nextMIdx);
  } else if (roundName === 'round3') {
    const nextMIdx = Math.floor(mIdx / 2);
    const nextSlotIdx = mIdx % 2;
    regions[rIdx].round4[nextMIdx][nextSlotIdx] = team;
    clearRegionDownstream(rIdx, 'round4', nextMIdx);
  } else if (roundName === 'round4') {
    // Elite Eight winner
    regions[rIdx].elite8 = team;
    updateFinalFour();
  }
  
  renderBracket();
}

function pickFinalFour(stage, team) {
  if (locked) return;
  
  picks.finalFour[stage].game1 = team;
  
  if (stage === 'semis1') {
    // Advance to championship slot 0 (left side)
    finalFour.championship[0] = team;
    // Clear champion if needed
    if (finalFour.champion && 
        finalFour.champion !== finalFour.championship[0] && 
        finalFour.champion !== finalFour.championship[1]) {
      finalFour.champion = '';
    }
  } else if (stage === 'semis2') {
    // Advance to championship slot 1 (right side)
    finalFour.championship[1] = team;
    // Clear champion if needed
    if (finalFour.champion && 
        finalFour.champion !== finalFour.championship[0] && 
        finalFour.champion !== finalFour.championship[1]) {
      finalFour.champion = '';
    }
  } else if (stage === 'championship') {
    // Set champion
    finalFour.champion = team;
  }
  
  renderBracket();
}

function clearRegionDownstream(rIdx, fromRound, fromMatchIdx) {
  // Clear only the affected downstream matches
  if (fromRound === 'round2') {
    // Clear downstream round3 and round4
    const r3Idx = Math.floor(fromMatchIdx / 2);
    regions[rIdx].round3[r3Idx] = ['', ''];
    regions[rIdx].round4[0] = ['', ''];
    regions[rIdx].elite8 = '';
    updateFinalFour();
  } else if (fromRound === 'round3') {
    // Clear downstream round4
    regions[rIdx].round4[0] = ['', ''];
    regions[rIdx].elite8 = '';
    updateFinalFour();
  } else if (fromRound === 'round4') {
    // Clear elite8
    regions[rIdx].elite8 = '';
    updateFinalFour();
  }
}

function updateFinalFour() {
  // Update Final Four matchups based on Elite Eight winners
  const oldSemis1_0 = finalFour.semis1[0];
  const oldSemis1_1 = finalFour.semis1[1];
  const oldSemis2_0 = finalFour.semis2[0];
  const oldSemis2_1 = finalFour.semis2[1];
  
  finalFour.semis1[0] = regions[0].elite8;
  finalFour.semis1[1] = regions[1].elite8;
  finalFour.semis2[0] = regions[2].elite8;
  finalFour.semis2[1] = regions[3].elite8;
  
  // Clear championship if semis changed
  if (oldSemis1_0 !== finalFour.semis1[0] || oldSemis1_1 !== finalFour.semis1[1]) {
    if (finalFour.championship[0] === oldSemis1_0 || finalFour.championship[0] === oldSemis1_1) {
      finalFour.championship[0] = '';
    }
  }
  
  if (oldSemis2_0 !== finalFour.semis2[0] || oldSemis2_1 !== finalFour.semis2[1]) {
    if (finalFour.championship[1] === oldSemis2_0 || finalFour.championship[1] === oldSemis2_1) {
      finalFour.championship[1] = '';
    }
  }
  
  // Clear champion if championship changed
  if (!finalFour.championship[0] || !finalFour.championship[1]) {
    finalFour.champion = '';
  } else if (finalFour.champion !== finalFour.championship[0] && 
             finalFour.champion !== finalFour.championship[1]) {
    finalFour.champion = '';
  }
}

function isComplete() {
  return finalFour.champion && regions.every(r => r.elite8);
}

function serializeRound(roundData, roundPicks) {
  const out = {};
  roundData.forEach((m, i) => {
    out[`game${i + 1}`] = {
      slot1: m[0],
      slot2: m[1],
      pick: roundPicks[`game${i + 1}`] || null
    };
  });
  return out;
}

function serializeBracket() {
  const serializedRegions = regions.map((r, idx) => ({
    name: r.name,
    round1: serializeRound(r.round1, picks.regions[idx].round1),
    round2: serializeRound(r.round2, picks.regions[idx].round2),
    round3: serializeRound(r.round3, picks.regions[idx].round3),
    round4: serializeRound(r.round4, picks.regions[idx].round4),
    elite8: r.elite8
  }));
  
  const serializedFinalFour = {
    semis1: { 
      game1: { 
        slot1: finalFour.semis1[0], 
        slot2: finalFour.semis1[1], 
        pick: picks.finalFour.semis1.game1 || null 
      } 
    },
    semis2: { 
      game1: { 
        slot1: finalFour.semis2[0], 
        slot2: finalFour.semis2[1], 
        pick: picks.finalFour.semis2.game1 || null 
      } 
    },
    championship: { 
      game1: { 
        slot1: finalFour.championship[0], 
        slot2: finalFour.championship[1], 
        pick: picks.finalFour.championship.game1 || null 
      } 
    },
    champion: finalFour.champion
  };
  
  return { regions: serializedRegions, finalFour: serializedFinalFour };
}

document.getElementById('submitBtn').onclick = async () => {
  if (locked) return;
  if (!isComplete()) {
    document.getElementById('error').textContent = 'Complete the bracket first!';
    return;
  }
  
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const tiebreaker = parseInt(document.getElementById('tiebreaker').value.trim());
  
  if (!name || !email.match(/^\S+@\S+\.\S+$/) || isNaN(tiebreaker)) {
    document.getElementById('error').textContent = 'Invalid fields!';
    return;
  }

  const q = db.collection("brackets").where("email", "==", email);
  const snap = await q.get();
  const entryNumber = snap.size + 1;

  locked = true;
  
  await db.collection("brackets").add({
    name,
    email,
    entryName: `${name} ${entryNumber}`,
    tiebreaker: Number(tiebreaker),
    submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
    picks: serializeBracket()
  });

  document.getElementById('error').textContent = '';
  document.getElementById('confirmation').style.display = 'block';
  renderBracket();
};

// Load outlined boxes from Firebase
async function loadOutlinedBoxes() {
  try {
    const resultsDoc = await db.collection('officialResults').doc('current').get();
    if (resultsDoc.exists && resultsDoc.data().outlinedBoxes) {
      outlinedBoxes = resultsDoc.data().outlinedBoxes;
      console.log('Loaded outlined boxes:', outlinedBoxes);
    } else {
      console.log('No outlined boxes document found');
    }
  } catch (err) {
    console.error('Error loading outlined boxes:', err);
  }
}

// Check if a specific slot should be outlined
function isSlotOutlined(regionIdx, round, gameIdx, slotIdx) {
  const regionName = ['south', 'midwest', 'east', 'west'][regionIdx];
  const boxId = `${regionName}-${round}-game${gameIdx + 1}-slot${slotIdx + 1}`;
  const isOutlined = outlinedBoxes.includes(boxId);
  
  if (isOutlined) {
    console.log('Found outlined box:', boxId);
  }
  
  return isOutlined;
}

// Load outlined boxes on page load and render
loadOutlinedBoxes().then(() => {
  console.log('Starting render with outlined boxes:', outlinedBoxes);
  renderBracket();
});
