import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

onSnapshot(query(collection(db, 'scores'), orderBy('total', 'desc')), snap => {
  const tableBody = document.getElementById('table-body');
  tableBody.innerHTML = '';
  snap.forEach((d, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${idx+1}</td><td>${d.data().entryName}</td><td>${d.data().total}</td><td>${d.data().tiebreaker}</td>`;
    tr.onclick = async () => {
      const bracket = (await getDoc(doc(db, 'brackets', d.id))).data();
      document.getElementById('details').textContent = JSON.stringify(bracket.picks, null, 2);
    };
    tableBody.appendChild(tr);
  });
});

// PDF export similar to admin
