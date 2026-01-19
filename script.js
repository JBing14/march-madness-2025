import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {

  var round1El = document.getElementById("round-1-left");
  var round2El = document.getElementById("round-2-left");
  var round3El = document.getElementById("round-3-left");
  var round4El = document.getElementById("round-4-left");
  var champEl  = document.getElementById("round-5-left");

  if (!round1El || !round2El || !round3El || !round4El || !champEl) {
    console.error("One or more round containers are missing");
    return;
  }

  var isLocked = false;

  // ---------------- STATE ----------------

  var round1 = [
    ["Auburn", "Alabama St"],
    ["Louisville", "Creighton"],
    ["Michigan", "UC San Diego"],
    ["Texas A&M", "Yale"],
    ["Ole Miss", "San Diego St"],
    ["Iowa St", "Lipscomb"],
    ["Marquette", "New Mexico"],
    ["Michigan St", "Bryant"]
  ];

  var round2 = [
    [null, null],
    [null, null],
    [null, null],
    [null, null]
  ];

  var round3 = [
    [null, null],
    [null, null]
  ];

  var round4 = [
    [null, null]
  ];

  var champion = null;

  // ---------------- RENDER ----------------

  function renderRound(container, matchups, handler) {
    container.innerHTML = "<strong>" + container.querySelector("strong").innerText + "</strong>";

    for (var i = 0; i < matchups.length; i++) {
      var matchup = matchups[i];
      var matchEl = document.createElement("div");
      matchEl.className = "matchup";

      for (var j = 0; j < matchup.length; j++) {
        var team = matchup[j];
        var btn = document.createElement("button");
        btn.className = "team";
        btn.textContent = team ? team : "";

        if (team && handler && !isLocked) {
          btn.onclick = (function (mi, si, t) {
            return function () {
              handler(mi, si, t);
            };
          })(i, j, team);
        } else {
          btn.disabled = true;
        }

        matchEl.appendChild(btn);
      }

      container.appendChild(matchEl);
    }
  }

  function renderChampion() {
    champEl.innerHTML = "<strong>Champion</strong>";

    if (!champion) return;

    var matchEl = document.createElement("div");
    matchEl.className = "matchup";

    var btn = document.createElement("button");
    btn.className = "team";
    btn.textContent = champion;
    btn.disabled = true;

    matchEl.appendChild(btn);
    champEl.appendChild(matchEl);
  }

  function render() {
    renderRound(round1El, round1, handleRound1Pick);
    renderRound(round2El, round2, handleRound2Pick);
    renderRound(round3El, round3, handleRound3Pick);
    renderRound(round4El, round4, handleRound4Pick);
    renderChampion();
  }

  // ---------------- LOGIC ----------------

  function clearRound(r) {
    for (var i = 0; i < r.length; i++) {
      r[i][0] = null;
      r[i][1] = null;
    }
  }

  function handleRound1Pick(matchupIndex, slotIndex, team) {
    if (isLocked) return;

    var r2Matchup = Math.floor(matchupIndex / 2);
    var r2Slot = matchupIndex % 2;

    round2[r2Matchup][r2Slot] = team;
    clearRound(round3);
    clearRound(round4);
    champion = null;

    render();
  }

  function handleRound2Pick(matchupIndex, slotIndex, team) {
    if (isLocked) return;

    var r3Matchup = Math.floor(matchupIndex / 2);
    var r3Slot = matchupIndex % 2;

    round3[r3Matchup][r3Slot] = team;
    clearRound(round4);
    champion = null;

    render();
  }

  function handleRound3Pick(matchupIndex, slotIndex, team) {
    if (isLocked) return;

    round4[0][matchupIndex] = team;
    champion = null;

    render();
  }

  function handleRound4Pick(matchupIndex, slotIndex, team) {
    if (isLocked) return;

    champion = team;
    render();
  }

  // ---------------- SUBMISSION ----------------

 window.submitBracket = async function () {
  if (isLocked) return;

  var name = document.getElementById("name").value.trim();
  var email = document.getElementById("email").value.trim();
  var tiebreaker = document.getElementById("tiebreaker").value.trim();

  if (!name || !email || !tiebreaker) {
    alert("Please enter name, email, and tiebreaker.");
    return;
  }

  if (!champion) {
    alert("Please complete the bracket before submitting.");
    return;
  }

  isLocked = true;

  // ---- Determine entry number (John Doe 1, 2, etc.) ----
  const q = query(
    collection(db, "brackets"),
    where("email", "==", email)
  );

  const snapshot = await getDocs(q);
  const entryNumber = snapshot.size + 1;

  const submission = {
    name: name,
    email: email,
    entryName: `${name} ${entryNumber}`,
    tiebreaker: Number(tiebreaker),
    submittedAt: serverTimestamp(),
    picks: {
      round1: round1,
      round2: round2,
      round3: round3,
      round4: round4,
      champion: champion
    }
  };

  await addDoc(collection(db, "brackets"), submission);

  alert("Bracket submitted and saved!");
  render();
};



