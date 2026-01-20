// =====================================================
// FIREBASE
// =====================================================
const db = firebase.firestore();

let locked = false;

// =====================================================
// REGION DATA (SOURCE OF TRUTH)
// =====================================================
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
    round2: Array.from({ length: 4 }, () => ['', '']),
    round3: Array.from({ length: 2 }, () => ['', '']),
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
    round2: Array.from({ length: 4 }, () => ['', '']),
    round3: Array.from({ length: 2 }, () => ['', '']),
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
    round2: Array.from({ length: 4 }, () => ['', '']),
    round3: Array.from({ length: 2 }, () => ['', '']),
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
    round2: Array.from({ length: 4 }, () => ['', '']),
    round3: Array.from({ length: 2 }, () => ['', '']),
    round4: ['', ''],
    elite8: ''
  }
];

// =====================================================
// FINAL FOUR DATA
// =====================================================
const finalFour = {
  semis1: ['', ''],
  semis2: ['', ''],
  championship: ['', ''],
  champion: ''
};

// =====================================================
// USER PICKS (FOR SUBMISSION)
// =====================================================
const picks = {
  regions: regions.map(() => ({
    round1: {},
    round2: {},
    round3: {},
    round4: {}
  })),
  finalFour: {
    semis1: {},
    semis2: {},
    championship: {}
  }
};

// =====================================================
// CORE PICK HANDLER
// =====================================================
function pickRegionRound(regionIndex, roundName, matchupIndex, team) {
  if (locked) return;

  // save user pick
  picks.regions[regionIndex][roundName][`game${matchupIndex + 1}`] = team;

  let nextRound = null;
  if (roundName === 'round1') nextRound = 'round2';
  if (roundName === 'round2') nextRound = 'round3';
  if (roundName === 'round3') nextRound = 'round4';

  if (nextRound) {
    const nextMatchup = Math.floor(matchupIndex / 2);
    const slot = matchupIndex % 2;

    regions[regionIndex][nextRound][nextMatchup][slot] = team;

    // 🔴 CRITICAL FIX:
    // clear ONLY rounds AFTER the one just written
    clearRegionDownstream(regionIndex, nextRound);
  } else {
    regions[regionIndex].elite8 = team;
    updateFinalFour();
  }

  renderBracket();
}

// =====================================================
// CLEAR DOWNSTREAM (SAFE)
// =====================================================
function clearRegionDownstream(regionIndex, fromRound) {
  const roundOrder = ['round2', 'round3', 'round4'];
  const startIdx = roundOrder.indexOf(fromRound) + 1;

  for (let i = startIdx; i < roundOrder.length; i++) {
    const round = roundOrder[i];
    const size = Math.pow(2, roundOrder.length - i);
    regions[regionIndex][round] = Array.from({ length: size }, () => ['', '']);
  }

  regions[regionIndex].elite8 = '';
  updateFinalFour();
}

// =====================================================
// FINAL FOUR UPDATE
// =====================================================
function updateFinalFour() {
  finalFour.semies1 = ['', ''];
  finalFour.semies2 = ['', ''];
  finalFour.championship = ['', ''];
  finalFour.champion = '';
}

// =====================================================
// RENDER (AUTHORITATIVE)
// =====================================================
function renderBracket() {
  document.querySelectorAll('.match').forEach(match => {
    const regionIndex = Number(match.dataset.regionIndex);
    const round = match.dataset.round;
    const matchupIndex = Number(match.dataset.matchup);

    let teams = [];

    if (round === 'round1') teams = regions[regionIndex].round1[matchupIndex];
    if (round === 'round2') teams = regions[regionIndex].round2[matchupIndex];
    if (round === 'round3') teams = regions[regionIndex].round3[matchupIndex];
    if (round === 'round4') teams = regions[regionIndex].round4;

    match.innerHTML = '';

    teams.forEach(team => {
      const div = document.createElement('div');
      div.textContent = team;
      div.className = 'team';

      if (team) {
        div.addEventListener('click', () =>
          pickRegionRound(regionIndex, round, matchupIndex, team)
        );
      }

      match.appendChild(div);
    });
  });
}

// =====================================================
// INIT
// =====================================================
renderBracket();
