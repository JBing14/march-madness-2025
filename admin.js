 // ... rest same

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

  // Bonuses same
  ['bonus1', 'bonus2', 'bonus3', 'bonus4'].forEach(b => {
    const sel = document.getElementById(b);
    sel.innerHTML = '<option value="">Select Bonus Game</option>';
    regionNames.forEach(r => {
      ['round1', 'round2', 'round3', 'round4'].forEach(round => {
        const num = round === 'round1' ? 8 : round === 'round2' ? 4 : 2 : 1;
        for (let g = 1; g <= num; g++) {
          sel.innerHTML += `<option value="${r}-${round}-game${g}">${r.toUpperCase()} ${round.toUpperCase()} Game ${g}</option>`;
        }
      });
    });
  });
}

// In scoreBrackets, adjust for semis1/semis2
// ... rest same, but adjust key for semis to 'semis1-game1' etc.
