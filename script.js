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
    round2: Array(4).fill(['', '']),
    round3: Array(2).fill(['', '']),
    round4: ['', ''],
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
    round2: Array(4).fill(['', '']),
    round3: Array(2).fill(['', '']),
    round4: ['', ''],
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
    round2: Array(4).fill(['', '']),
    round3: Array(2).fill(['', '']),
    round4: ['', ''],
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

function pickRegionRound(rIdx, roundName, mIdx, team) {
  picks.regions[rIdx][roundName][`game${mIdx + 1}`] = team;

  const nextRoundName =
    roundName === 'round1' ? 'round2' :
    roundName === 'round2' ? 'round3' :
    roundName === 'round3' ? 'round4' :
    null;

  if (nextRoundName) {
    const nextMIdx = Math.floor(mIdx / 2);
    const slot = mIdx % 2;
    regions[rIdx][nextRoundName][nextMIdx][slot] = team;

    // ✅ FIX: clear AFTER current round, not next round
    clearRegionDownstream(rIdx, roundName);
  } else {
    regions[rIdx].elite8 = team;
    updateFinalFour();
  }

  renderBracket();
}

function clearRegionDownstream(rIdx, fromRound) {
  const rounds = ['round2', 'round3', 'round4'];
  const start = rounds.indexOf(fromRound) + 1;

  for (let i = start; i < rounds.length; i++) {
    regions[rIdx][rounds[i]] =
      Array(Math.pow(2, 3 - i)).fill(['', '']);
  }

  regions[rIdx].elite8 = '';
  updateFinalFour();
}

/* EVERYTHING ELSE IN YOUR FILE STAYS THE SAME */

renderBracket();
