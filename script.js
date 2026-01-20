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
    round2: Array(4).fill(['', '']),
    round3: Array(2).fill(['', '']),
    round4: ['', ''],
    elite8: ''
  },
  {
    name: 'Midwest', // Stacked below South on left
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

const finalFour = {
  semis1: ['', ''] , // South vs Midwest winner
  semis2: ['', ''] , // East vs West winner
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
    document.querySelectorAll('.slot').forEach(slot => slot.onclick = null);
    document.getElementById('user-form').querySelector('button').disabled = true;
    document.getElementById('confirmation').style.display = 'block';
  }
}

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
  const nextRoundName = roundName === 'round1' ? 'round2' : roundName === 'round2' ? 'round3' : roundName === 'round3' ? 'round4' : null;
  if (nextRoundName) {
    const nextMIdx = Math.floor(mIdx / 2);
    const slot = mIdx % 2;
    regions[rIdx][nextRoundName][nextMIdx][slot] = team;
    clearRegionDownstream(rIdx, nextRoundName);
  } else {
    regions[rIdx].elite8 = team;
    updateFinalFour();
  }
  renderBracket();
}

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
  renderBracket();
}

function clearRegionDownstream(rIdx, roundName) {
  const rounds = ['round2', 'round3', 'round4'];
  const start = rounds.indexOf(roundName);
  for (let i = start; i < rounds.length; i++) {
    regions[rIdx][rounds[i]] = Array(Math.pow(2, 3 - i)).fill(['', '']);
  }
  regions[rIdx].elite8 = '';
  updateFinalFour();
}

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
  const serializedRegions = regions.map(r => ({
    round1: serializeRound(r.round1, picks.regions[regions.indexOf(r)].round1),
    round2: serializeRound(r.round2, picks.regions[regions.indexOf(r)].round2),
    round3: serializeRound(r.round3, picks.regions[regions.indexOf(r)].round3),
    round4: { game1: { slot1: r.round4[0], slot2: r.round4[1], pick: picks.regions[regions.indexOf(r)].round4.game1 || null } },
    elite8: r.elite8
  }));
  const serializedFinalFour = {
    semis1: { game1: { slot1: finalFour.semis1[0], slot2: finalFour.semis1[1], pick: picks.finalFour.semis1.game1 || null } },
    semis2: { game1: { slot1: finalFour.semis2[0], slot2: finalFour.semis2[1], pick: picks.finalFour.semis2.game1 || null } },
    championship: { game1: { slot1: finalFour.championship[0], slot2: finalFour.championship[1], pick: picks.finalFour.championship.game1 || null } },
    champion: finalFour.champion
  };
  return { regions: serializedRegions, finalFour: serializedFinalFour };
}

document.getElementById('submitBtn').onclick = async () => {
  if (locked) return;
  if (!isComplete()) return document.getElementById('error').textContent = 'Complete the bracket!';
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const tiebreaker = parseInt(document.getElementById('tiebreaker').value.trim());
  if (!name || !email.match(/^\S+@\S+\.\S+$/) || isNaN(tiebreaker)) return document.getElementById('error').textContent = 'Invalid fields!';

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

