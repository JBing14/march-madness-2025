import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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

const tableBody = document.getElementById("table-body");
const detailsEl = document.getElementById("details");
const exportPdf = document.getElementById("exportPdf");

onSnapshot(query(collection(db, "scores"), orderBy("total", "desc")), snap => {
  tableBody.innerHTML = "";
  snap.forEach((d, idx) => {
    const tr = document.createElement("tr");
    tr.dataset.id = d.id;
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${d.data().entryName}</td>
      <td>${d.data().total}</td>
      <td>${d.data().tiebreaker}</td>
    `;
    tr.onclick = async () => {
      const bracket = await getDoc(doc(db, "brackets", d.id));
      detailsEl.textContent = JSON.stringify(bracket.data().picks, null, 2);
    };
    tableBody.appendChild(tr);
  });
});

exportPdf.onclick = () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  pdf.text('March Madness 2025 Leaderboard', 10, 10);
  let y = 20;
  tableBody.querySelectorAll('tr').forEach(tr => {
    const cells = tr.querySelectorAll('td');
    pdf.text(`${cells[0].textContent}. ${cells[1].textContent} - ${cells[2].textContent} pts (Tie: ${cells[3].textContent})`, 10, y);
    y += 10;
  });
  pdf.save('leaderboard.pdf');
};
