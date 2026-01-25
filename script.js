const db = firebase.firestore();

let locked = false;

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
    const h3Text = round.querySelector('h3').textContent;
    round.innerHTML = '<h3>' + h3Text + '</h3>';
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

  // Final Four left: semis1 (South vs Midwest)
  renderFinalFourMatch('round-5-left', finalFour.semis1, 'semis1', 0);

  // Final Four right: semis2 (East vs West)
  renderFinalFourMatch('round-5-right', finalFour.semis2, 'semis2', 0);

  // Championship
  renderFinalFourMatch('round-6-left', finalFour.championship, 'championship', 0);

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
      
      if (teams[s] && !locked) {
        slot.onclick = () => pickRegionRound(rIdx, roundName, m, s, teams[s]);
        slot.classList.add('clickable');
      } else if (!teams[s]) {
        slot.classList.add('empty');
      }
      
      matchEl.appendChild(slot);
    }
    
    regionEl.appendChild(matchEl);
  }
  
  roundEl.appendChild(regionEl);
}

function renderFinalFourMatch(roundId, teams, stage, gameIdx) {
  const roundEl = document.getElementById(roundId);
  const matchEl = document.createElement('div');
  matchEl.className = 'match';
  
  for (let s = 0; s < 2; s++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.textContent = teams[s] || '';
    
    if (teams[s] && !locked) {
      slot.onclick = () => pickFinalFour(stage, s, teams[s]);
      slot.classList.add('clickable');
    } else if (!teams[s]) {
      slot.classList.add('empty');
    }
    
    matchEl.appendChild(slot);
  }
  
  roundEl.appendChild(matchEl);
}

function pickRegionRound(rIdx, roundName, mIdx, slotIdx, team) {
  if (locked) return;
  
  // Record the pick
  picks.regions[rIdx][roundName][`game${mIdx + 1}`] = team;
  
  // Determine next round
  const roundMap = { 'round1': 'round2', 'round2': 'round3', 'round3': 'round4', 'round4': 'elite8' };
  const nextRound = roundMap[roundName];
  
  if (nextRound === 'elite8') {
    // This was Elite Eight, set the winner
    regions[rIdx].elite8 = team;
    clearRegionDownstream(rIdx, null);
    updateFinalFour();
  } else {
    // Advance to next round
    const nextMIdx = Math.floor(mIdx / 2);
    const nextSlotIdx = mIdx % 2;
    regions[rIdx][nextRound][nextMIdx][nextSlotIdx] = team;
    
    // Clear downstream rounds
    clearRegionDownstream(rIdx, nextRound);
  }
  
  renderBracket();
}

function pickFinalFour(stage, slotIdx, team) {
  if (locked) return;
  
  picks.finalFour[stage].game1 = team;
  
  if (stage === 'semis1' || stage === 'semis2') {
    // Advance to championship
    const champSlot = stage === 'semis1' ? 0 : 1;
    finalFour.championship[champSlot] = team;
    
    // Clear championship winner if needed
    if (!finalFour.championship[0] || !finalFour.championship[1]) {
      finalFour.champion = '';
    }
  } else if (stage === 'championship') {
    // Set champion
    finalFour.champion = team;
  }
  
  renderBracket();
}

function clearRegionDownstream(rIdx, fromRound) {
  const rounds = ['round2', 'round3', 'round4'];
  
  if (fromRound === null) {
    // Clear everything from Elite Eight
    regions[rIdx].elite8 = '';
    updateFinalFour();
    return;
  }
  
  const startIdx = rounds.indexOf(fromRound);
  
  for (let i = startIdx + 1; i < rounds.length; i++) {
    const numMatches = i === 0 ? 4 : i === 1 ? 2 : 1;
    regions[rIdx][rounds[i]] = Array(numMatches).fill(null).map(() => ['', '']);
  }
  
  regions[rIdx].elite8 = '';
  updateFinalFour();
}

function updateFinalFour() {
  // Update Final Four matchups
  finalFour.semis1[0] = regions[0].elite8;
  finalFour.semis1[1] = regions[1].elite8;
  finalFour.semis2[0] = regions[2].elite8;
  finalFour.semis2[1] = regions[3].elite8;
  
  // Clear championship if semis aren't complete
  if (!finalFour.semis1[0] || !finalFour.semis1[1]) {
    if (finalFour.championship[0] === regions[0].elite8 || finalFour.championship[0] === regions[1].elite8) {
      finalFour.championship[0] = '';
    }
  }
  
  if (!finalFour.semis2[0] || !finalFour.semis2[1]) {
    if (finalFour.championship[1] === regions[2].elite8 || finalFour.championship[1] === regions[3].elite8) {
      finalFour.championship[1] = '';
    }
  }
  
  // Clear champion if championship isn't complete
  if (!finalFour.championship[0] || !finalFour.championship[1]) {
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

renderBracket();
