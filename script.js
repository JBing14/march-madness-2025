const db = firebase.firestore();

let locked = false;

const regions = [
  {
    name: 'South',
    round1: [
      ['1 Auburn', '16 Alabama State'],
      ['8 Louisville', '9 Creighton'],
      ['5 Michigan', '12 UC San Diego'],
      ['4 Texas A&M', '13 Yale'],
      ['6 Ole Miss', '11 North Carolina'],
      ['3 Iowa State', '14 Lipscomb'],
      ['7 Marquette', '10 New Mexico'],
      ['2 Michigan State', '15 Bryant']
    ],
    round2: Array(4).fill(['', '']),
    round3: Array(2).fill(['', '']),
    round4: [['', '']],
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
      ['7 UCLA', '10 Utah State'],
      ['2 Tennessee', '15 Wofford']
    ],
    round2: Array(4).fill(['', '']),
    round3: Array(2).fill(['', '']),
    round4: [['', '']],
    elite8: ''
  },
  {
    name: 'East',
    round1: [
      ['1 Duke', '16 Mount St. Mary\'s'],
      ['8 Mississippi State', '9 Baylor'],
      ['5 Oregon', '12 Liberty'],
      ['4 Arizona', '13 Akron'],
      ['6 BYU', '11 VCU'],
      ['3 Wisconsin', '14 Montana'],
      ['7 Saint Mary\'s', '10 Vanderbilt'],
      ['2 Alabama', '15 Robert Morris']
    ],
    round2: Array(4).fill(['', '']),
    round3: Array(2).fill(['', '']),
    round4: [['', '']],
    elite8: ''
  },
  {
    name: 'West',
    round1: [
      ['1 Florida', '16 Norfolk State'],
      ['8 UConn', '9 Oklahoma'],
      ['5 Memphis', '12 Colorado State'],
      ['4 Maryland', '13 Grand Canyon'],
      ['6 Missouri', '11 Drake'],
      ['3 Texas Tech', '14 UNC Wilmington'],
      ['7 Kansas', '10 Arkansas'],
      ['2 St. John\'s', '15 Omaha']
    ],
    round2: Array(4).fill(['', '']),
    round3: Array(2).fill(['', '']),
    round4: [['', '']],
    elite8: ''
  }
];

const finalFour = {
  semis1: ['', ''], // South vs Midwest
  semis2: ['', ''], // East vs West
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
  // Clear content but preserve h3
  document.querySelectorAll('.round').forEach(round => {
    const h3 = round.querySelector('h3');
    while (round.firstChild) round.removeChild(round.firstChild);
    round.appendChild(h3);
  });

  // Left side: Regions 0 (South - top) and 1 (Midwest - bottom)
  renderRegion(document.getElementById('round-1-left'), 0, 'round1');
  renderRegion(document.getElementById('round-1-left'), 1, 'round1');
  renderRegion(document.getElementById('round-2-left'), 0, 'round2');
  renderRegion(document.getElementById('round-2-left'), 1, 'round2');
  renderRegion(document.getElementById('round-3-left'), 0, 'round3');
  renderRegion(document.getElementById('round-3-left'), 1, 'round3');
  renderRegion(document.getElementById('round-4-left'), 0, 'round4');
  renderRegion(document.getElementById('round-4-left'), 1, 'round4');

  // Right side: Regions 2 (East - top) and 3 (West - bottom)
  renderRegion(document.getElementById('round-1-right'), 2, 'round1');
  renderRegion(document.getElementById('round-1-right'), 3, 'round1');
  renderRegion(document.getElementById('round-2-right'), 2, 'round2');
  renderRegion(document.getElementById('round-2-right'), 3, 'round2');
  renderRegion(document.getElementById('round-3-right'), 2, 'round3');
  renderRegion(document.getElementById('round-3-right'), 3, 'round3');
  renderRegion(document.getElementById('round-4-right'), 2, 'round4');
  renderRegion(document.getElementById('round-4-right'), 3, 'round4');

  // Final Four left: semis1 (South/Midwest winners)
  renderFinalMatch(document.getElementById('round-5-left'), finalFour.semis1, 'semis1');

  // Final Four right: semis2 (East/West winners)
  renderFinalMatch(document.getElementById('round-5-right'), finalFour.semis2, 'semis2');

  // Championship (left side only, right is duplicate in HTML but unused)
  renderFinalMatch(document.getElementById('round-6-left'), finalFour.championship, 'championship');

  // Champion
  const champRound = document.getElementById('champion');
  const champMatch = document.createElement('div');
  champMatch.className = 'match m1';
  const champSlot = document.createElement('div');
  champSlot.className = 'slot champion';
  champSlot.textContent = finalFour.champion || '';
  champMatch.appendChild(champSlot);
  champRound.appendChild(champMatch);

  if (locked) {
    document.querySelectorAll('.slot').forEach(slot => slot.onclick = null);
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('confirmation').style.display = 'block';
  }
}

function renderRegion(roundEl, rIdx, roundName) {
  const regionEl = document.createElement('div');
  regionEl.className = 'region';
  regionEl.innerHTML = `<h4>${regions[rIdx].name}</h4>`;
  const matchups = regions[rIdx][roundName];
  matchups.forEach((teams, m) => {
    const matchEl = document.createElement('div');
    matchEl.className = 'match m' + (m + 1);
    teams.forEach((team, s) => {
      const slot = document.createElement('div');
      slot.className = 'slot' + (team ? '' : ' empty');
      slot.textContent = team;
      if (team && !locked) {
        slot.onclick = () => pickRegionRound(rIdx, roundName, m, team);
      }
      matchEl.appendChild(slot);
    });
    regionEl.appendChild(matchEl);
  });
  roundEl.appendChild(regionEl);
}

function renderFinalMatch(roundEl, teams, stage) {
  const matchEl = document.createElement('div');
  matchEl.className = 'match m1';
  teams.forEach((team, s) => {
    const slot = document.createElement('div');
    slot.className = 'slot' + (team ? '' : ' empty');
    slot.textContent = team;
    if (team && !locked) {
      slot.onclick = () => pickFinalFour(stage, team);
    }
    matchEl.appendChild(slot);
  });
  roundEl.appendChild(matchEl);
}

function pickRegionRound(rIdx, roundName, mIdx, team) {
  picks.regions[rIdx][roundName][`game${mIdx + 1}`] = team;
  const nextRoundNames = { 'round1': 'round2', 'round2': 'round3', 'round3': 'round4' };
  const nextRoundName = nextRoundNames[roundName];
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
  picks.finalFour[stage].game1 = team;
  if (stage === 'semis1' || stage === 'semis2') {
    const championshipSlot = stage === 'semis1' ? 0 : 1;
    finalFour.championship[championshipSlot] = team;
    finalFour.champion = '';
  } else if (stage === 'championship') {
    finalFour.champion = team;
  }
  renderBracket();
}

function clearRegionDownstream(rIdx, roundName) {
  const rounds = ['round2', 'round3', 'round4'];
  const startIdx = rounds.indexOf(roundName);
  for (let i = startIdx; i < rounds.length; i++) {
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
    round4: serializeRound(r.round4, picks.regions[regions.indexOf(r)].round4),
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
