import { db, auth } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const ADMIN_EMAIL = "jbgerloff@gmail.com";

const loginDiv = document.getElementById("login");
const dashboardDiv = document.getElementById("dashboard");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");
const adminEmailEl = document.getElementById("adminEmail");

const resultsControls = document.getElementById("resultsControls");
const saveResultsBtn = document.getElementById("saveResultsBtn");
const scoreBtn = document.getElementById("scoreBtn");
const scoreStatus = document.getElementById("scoreStatus");
const exportPdf = document.getElementById("exportPdf");

const tableBody = document.getElementById("table-body");
const detailsEl = document.getElementById("details");
const countEl = document.getElementById("count");
const editForm = document.getElementById("editForm");
const editName = document.getElementById("editName");
const saveEdit = document.getElementById("saveEdit");
const cancelEdit = document.getElementById("cancelEdit");

const POINTS = {
  round1: 1,
  round2: 3,
  round3: 5,
  round4: 7,
  semis: 10,
  championship: 20,
  bonus: 5
};

let officialResults = { regions: [], finalFour: {}, bonuses: [] };
let selectedBracketId = null;

loginBtn.onclick = async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (e) {
    loginError.textContent = e.message;
  }
};

logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, async user => {
  if (!user || user.email !== ADMIN_EMAIL) {
    loginDiv.style.display = "block";
    dashboardDiv.style.display = "none";
    return;
  }
  loginDiv.style.display = "none";
  dashboardDiv.style.display = "block";
  adminEmailEl.textContent = user.email;
  await initAdmin();
});

async function initAdmin() {
  buildControls();
  await loadResults();
  const q = query(collection(db, "brackets"), orderBy("submittedAt", "desc"));
  onSnapshot(q, snap => loadSubmissions(snap));
}

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
  semis1Sel.dataset.game = 'semis1-game1';
  semis1Sel.innerHTML = `<option value="">Semi 1 (South vs Midwest) Winner</option>`;
  ffDiv.appendChild(semis1Sel);
  const semis2Sel = document.createElement('select');
  semis2Sel.dataset.game = 'semis2-game1';
  semis2Sel.innerHTML = `<option value="">Semi 2 (East vs West) Winner</option>`;
  ffDiv.appendChild(semis2Sel);
  const champSel = document.createElement('select');
  champSel.dataset.game = 'championship-game1';
  champSel.innerHTML = `<option value="">Champion</option>`;
  ffDiv.appendChild(champSel);
  resultsControls.appendChild(ffDiv);

  // Bonuses
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
    sel.innerHTML += `<option value="semis1-game1">Semi 1</option><option value="semis2-game1">Semi 2</option>`;
  });
}

async function loadResults() {
  const snap = await getDoc(doc(db, "results", "current"));
  if (snap.exists()) {
    officialResults = snap.data();
    document.querySelectorAll('#resultsControls select').forEach(sel => {
      if (officialResults[sel.dataset.game]) sel.value = officialResults[sel.dataset.game];
    });
    ['bonus1', 'bonus2', 'bonus3', 'bonus4'].forEach((b, i) => {
      document.getElementById(b).value = officialResults.bonuses[i] || '';
    });
  }
}

saveResultsBtn.onclick = async () => {
  officialResults = { bonuses: [] };
  document.querySelectorAll('#resultsControls select').forEach(sel => {
    if (sel.value) officialResults[sel.dataset.game] = sel.value;
  });
  ['bonus1', 'bonus2', 'bonus3', 'bonus4'].forEach(b => {
    officialResults.bonuses.push(document.getElementById(b).value);
  });
  await setDoc(doc(db, "results", "current"), officialResults);
  scoreStatus.textContent = "Results saved.";
};

scoreBtn.onclick = async () => {
  scoreStatus.textContent = "Scoring...";
  const official = (await getDoc(doc(db, "results", "current"))).data() || {};
  const brackets = await getDocs(collection(db, "brackets"));
  for (const b of brackets.docs) {
    const p = b.data().picks;
    let score = { total: 0, rounds: {}, bonuses: 0 };

    p.regions.forEach((r, rIdx) => {
      ['round1', 'round2', 'round3', 'round4'].forEach(round => {
        for (const game in r[round]) {
          const key = `${regions[rIdx].name.toLowerCase()}-${round}-${game}`;
          if (official[key] && r[round][game].pick === official[key]) {
            score.rounds[round] = (score.rounds[round] || 0) + POINTS[round];
            score.total += POINTS[round];
          }
        }
      });
    });

    ['semis1', 'semis2'].forEach((semis, idx) => {
      const key = `${semis}-game1`;
      if (official[key] && p.finalFour[semis].game1 === official[key]) {
        score.total += POINTS.semis;
      }
    });

    const champKey = 'championship-game1';
    if (official[champKey] && p.finalFour.championship.game1 === official[champKey]) {
      score.total += POINTS.championship;
    }

    official.bonuses.forEach(bonusGame => {
      if (!bonusGame) return;
      const [region, round, game] = bonusGame.split('-');
      let pick;
      if (round.startsWith('semis')) {
        pick = p.finalFour[round].game1;
      } else {
        const rIdx = regions.findIndex(rg => rg.name.toLowerCase() === region);
        pick = p.regions[rIdx][round][game]?.pick;
      }
      if (pick === official[bonusGame]) score.bonuses += POINTS.bonus;
    });
    score.total += score.bonuses;

    await setDoc(doc(db, "scores", b.id), {
      entryName: b.data().entryName,
      total: score.total,
      tiebreaker: b.data().tiebreaker,
      details: score
    });
  }
  scoreStatus.textContent = "Scoring complete.";
};

function loadSubmissions(snap) {
  countEl.textContent = snap.size;
  tableBody.innerHTML = "";
  snap.forEach(d => {
    const tr = document.createElement("tr");
    tr.dataset.id = d.id;
    tr.innerHTML = `
      <td>${d.data().entryName}</td>
      <td>${d.data().email}</td>
      <td>${d.data().tiebreaker}</td>
      <td>${d.data().submittedAt?.toDate().toLocaleString() || 'N/A'}</td>
      <td>
        <button class="btn btn-sm btn-warning edit">Edit</button>
        <button class="btn btn-sm btn-danger delete">Delete</button>
      </td>
    `;
    tr.querySelector('.edit').onclick = () => editBracket(d.id, d.data().entryName);
    tr.querySelector('.delete').onclick = () => deleteBracket(d.id);
    tr.onclick = (e) => {
      if (e.target.tagName !== 'BUTTON') detailsEl.textContent = JSON.stringify(d.data().picks, null, 2);
    };
    tableBody.appendChild(tr);
  });
}

function editBracket(id, currentName) {
  selectedBracketId = id;
  editName.value = currentName;
  editForm.style.display = 'block';
}

saveEdit.onclick = async () => {
  if (selectedBracketId) {
    await updateDoc(doc(db, "brackets", selectedBracketId), { entryName: editName.value });
    editForm.style.display = 'none';
  }
};

cancelEdit.onclick = () => {
  editForm.style.display = 'none';
};

async function deleteBracket(id) {
  if (confirm('Delete this bracket?')) {
    await deleteDoc(doc(db, "brackets", id));
    await deleteDoc(doc(db, "scores", id));
  }
}

exportPdf.onclick = async () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  pdf.text('Leaderboard', 10, 10);
  const scores = await getDocs(query(collection(db, "scores"), orderBy("total", "desc")));
  let y = 20;
  scores.forEach((d, idx) => {
    pdf.text(`${idx+1}. ${d.data().entryName} - ${d.data().total} pts (Tie: ${d.data().tiebreaker})`, 10, y);
    y += 10;
  });
  pdf.save('leaderboard.pdf');
};
