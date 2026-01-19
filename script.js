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
      ['8 Louisville', '9 Creighton'],
      ['4 Texas A&M', '13 Yale'],
      ['5 Michigan', '12 UC San Diego'],
      ['2 Michigan State', '15 Bryant'],
      ['7 Marquette', '10 New Mexico'],
      ['3 Iowa State', '14 Lipscomb'],
      ['6 Ole Miss', '11 San Diego State/North Carolina']
    ]
  },
  {
    name: 'Midwest',
    round1: [
      ['1 Houston', '16 SIU Edwardsville'],
      ['8 Gonzaga', '9 Georgia'],
      ['4 Purdue', '13 High Point'],
      ['5 Clemson', '12 McNeese'],
      ['2 Tennessee', '15 Wofford'],
      ['7 UCLA', '10 Utah State'],
      ['3 Kentucky', '14 Troy'],
      ['6 Illinois', '11 Texas/Xavier']
    ]
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
};

const picks = {
  regions: regions.map(() => ({
    round1: {}, round2: {}, round3: {}, round4: {}
  })),
  finalFour: { semis: {}, championship: {} }
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

  if (locked) {
    document.querySelectorAll('button.team').forEach(btn => btn.disabled = true);
    document.getElementById('form').style.display = 'none';
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
}

function pickRegionRound(rIdx, roundName, mIdx, team) {
  picks.regions[rIdx][roundName][`game${mIdx + 1}`] = team;
  const nextRoundIdx = ['round1', 'round2', 'round3', 'round4'].indexOf(roundName) + 1;
  if (nextRoundIdx < 4) {
    const nextRoundName = ['round1', 'round2', 'round3', 'round4'][nextRoundIdx];
    const nextMIdx = Math.floor(mIdx / 2);
    const slot = mIdx % 2;
    regions[rIdx][nextRoundName][nextMIdx][slot] = team;
    clearRegionDownstream(rIdx, nextRoundName);
  } else {
    regions[rIdx].elite8 = team;
    updateFinalFourSemis();
  }
  renderBracket();
}

function pickFinalFour(stage, mIdx, team) {
  picks.finalFour[stage][`game${mIdx + 1}`] = team;
  if (stage === 'semis') {
    finalFour.championship[mIdx] = team;
  } else {
    finalFour.champion = team;
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
  }
  finalFour.champion = null;
}

function updateFinalFourSemis() {
  finalFour.semis[0][0] = regions[0].elite8;
  finalFour.semis[0][1] = regions[1].elite8;
  finalFour.semis[1][0] = regions[2].elite8;
  finalFour.semis[1][1] = regions[3].elite8;
  if (!finalFour.semis.every(s => s.every(t => t))) {
    finalFour.championship = [null, null];
    finalFour.champion = null;
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
    semis: serializeRound(finalFour.semis, picks.finalFour.semis),
    championship: serializeRound([finalFour.championship], picks.finalFour.championship),
    champion: finalFour.champion
  };
  return { regions: serializedRegions, finalFour: serializedFinalFour };
}

document.getElementById('submitBtn').onclick = async () => {
  if (locked) return;
  if (!isComplete()) return alert('Complete the entire bracket, including champion!');
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const tiebreaker = parseInt(document.getElementById('tiebreaker').value.trim());
  if (!name || !email.match(/^\S+@\S+\.\S+$/) || isNaN(tiebreaker)) return alert('Please fill in all fields with valid data!');

  const q = query(collection(db, "brackets"), where("email", "==", email));
  const snap = await getDocs(q);
  const entryNumber = snap.size + 1;

  locked = true;
  await addDoc(collection(db, "brackets"), {
    name,
    email,
    entryName: `${name} ${entryNumber}`,
    tiebreaker: Number(tiebreaker),
    submittedAt: serverTimestamp(),
    picks: serializeBracket()
  });

  alert("Bracket submitted and locked.");
  renderBracket();
};

renderBracket();
