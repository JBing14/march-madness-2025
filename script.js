const db = firebase.firestore();

const regions = ["midwest", "west", "east", "south"];

const sampleTeams = {
    midwest: ["1 Auburn", "16 ALST/SFU", "8 Mich St.", "9 Creighton", "5 Michigan", "12 UC San Diego", "4 Texas A&M", "13 Yale", "6 Ole Miss", "11 SOSU/UNC", "3 Iowa St.", "14 Lipscomb", "7 Marquette", "10 New Mexico", "2 St. John's", "15 Omaha"],
    west: ["1 Kansas", "16 Texas Southern", "8 San Diego St.", "9 Boise St.", "5 Iowa", "12 Richmond", "4 Providence", "13 South Dakota St.", "6 LSU", "11 Iowa St.", "3 Wisconsin", "14 Colgate", "7 USC", "10 Miami", "2 Kentucky", "15 Jacksonville St."],
    east: ["1 Florida", "16 Norfolk St.", "8 UConn", "9 Oklahoma", "5 Memphis", "12 Colo. St.", "4 Maryland", "13 Grand Canyon", "6 Missouri", "11 Drake", "3 Texas Tech", "14 UNCW", "7 Kansas", "10 Arkansas", "2 Villanova", "15 Bryant"],
    south: ["1 Arizona", "16 Wright St.", "8 Seton Hall", "9 TCU", "5 Houston", "12 UAB", "4 Illinois", "13 Chattanooga", "6 Colorado St.", "11 Michigan St.", "3 Tennessee", "14 Longwood", "7 Ohio St.", "10 Loyola Chicago", "2 Gonzaga", "15 Delaware"]
};

let userBracket = { midwest: {}, west: {}, east: {}, south: {}, finalFour: {}, champ: {} };

if (document.getElementById("bracket")) {
    initBracket();
}

/* ==============================
   INITIAL BRACKET BUILD
================================ */

function initBracket() {
    buildRound1("round-1-left", ["midwest", "west"]);
    buildRound1("round-1-right", ["east", "south"]);
}

function buildRound1(containerId, regionList) {
    const container = document.getElementById(containerId);

    regionList.forEach(region => {
        const regionDiv = document.createElement("div");
        regionDiv.className = "region";
        regionDiv.innerHTML = `<h4>${region.toUpperCase()}</h4>`;

        for (let i = 0; i < 16; i += 2) {
            const match = document.createElement("div");
            match.className = "match";

            match.appendChild(createSlot(region, "round-1", sampleTeams[region][i], i + 1));
            match.appendChild(createSlot(region, "round-1", sampleTeams[region][i + 1], i + 2));

            regionDiv.appendChild(match);
        }

        container.appendChild(regionDiv);
    });
}

/* ==============================
   SLOT CREATION
================================ */

function createSlot(region, round, name, index) {
    const slot = document.createElement("p");
    slot.className = `slot ${round !== "round-1" ? "empty" : ""}`;
    slot.id = `${region}-${round}-s${index}`;
    slot.dataset.region = region;
    slot.dataset.round = round;
    slot.dataset.index = index;
    slot.dataset.next = getNextSlotId(region, round, index);

    slot.innerHTML = name !== "TBD"
        ? `<span class="seed">${name.split(" ")[0]}</span> ${name.split(" ").slice(1).join(" ")}`
        : "TBD";

    slot.onclick = () => advanceTeam(region, round, name, index);
    return slot;
}

/* ==============================
   ADVANCEMENT LOGIC (FIXED)
================================ */
function clearPathFromSlot(slotId) {
    const slot = document.getElementById(slotId);
    if (!slot) return;

    const next = slot.dataset.next;

    slot.innerHTML = 'TBD';
    slot.classList.add('empty');
    slot.classList.remove('selected', 'path-highlight');

    if (next) {
        clearPathFromSlot(next);
    }
}

function advanceTeam(region, round, teamName, index) {
    const currentSlot = document.getElementById(`${region}-${round}-s${index}`);
    if (!currentSlot) return;

    // Find the other team in this matchup
    const siblingIndex = index % 2 === 0 ? index - 1 : index + 1;
    const siblingSlot = document.getElementById(`${region}-${round}-s${siblingIndex}`);

    // Clear sibling’s downstream path
    if (siblingSlot && siblingSlot.dataset.next) {
        clearPathFromSlot(siblingSlot.dataset.next);
    }

    // Advance selected team
    const nextSlotId = currentSlot.dataset.next;
    if (!nextSlotId) return;

    const nextSlot = document.getElementById(nextSlotId);
    if (!nextSlot) return;

    nextSlot.innerHTML = currentSlot.innerHTML;
    nextSlot.classList.remove('empty');
    nextSlot.classList.add('selected', 'path-highlight');
}


/* ==============================
   CLEAR DOWNSTREAM PATH
================================ */

function clearPathFromSlot(slotId) {
    const slot = document.getElementById(slotId);
    if (!slot) return;

    const next = slot.dataset.next;

    slot.innerHTML = "TBD";
    slot.classList.add("empty");
    slot.classList.remove("selected");

    if (next) {
        clearPathFromSlot(next);
    }
}

/* ==============================
   NEXT SLOT MAP (UNCHANGED)
================================ */

function getNextSlotId(region, round, index) {
    const roundNum = parseInt(round.split("-")[1]);
    const nextRound = `round-${roundNum + 1}`;

    if (round === "round-1") {
        return `${region}-round-2-s${Math.ceil(index / 2)}`;
    }
    if (round === "round-2") {
        return `${region}-round-3-s${Math.ceil(index / 2)}`;
    }
    if (round === "round-3") {
        return `${region}-round-4-s${Math.ceil(index / 2)}`;
    }
    if (round === "round-4") {
        return `finalFour-round-5-s${["midwest", "west", "east", "south"].indexOf(region) + 1}`;
    }
    if (round === "round-5") {
        return `champ-round-6-s${index <= 2 ? 1 : 2}`;
    }
    if (round === "round-6") {
        return "champ-round-7-s1";
    }
    return "";
}

/* ==============================
   SUBMISSION (STUB FOR NOW)
================================ */

function submitBracket() {
    alert("Bracket submission logic will be added after logic confirmation.");
}

