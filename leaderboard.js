import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB27qEP0k2PR8Zz_z_A8KjGcXvxX9OROQA",
  authDomain: "marchmadness2025-24f04.firebaseapp.com",
  projectId: "marchmadness2025-24f04",import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
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

// Listen to scores collection and display leaderboard
onSnapshot(query(collection(db, "scores"), orderBy("total", "desc"), orderBy("tiebreaker", "asc")), snap => {
  tableBody.innerHTML = "";
  
  if (snap.empty) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4" style="text-align: center; padding: 20px;">No scores yet. Brackets will appear here after admin scores them.</td>`;
    tableBody.appendChild(tr);
    return;
  }
  
  snap.forEach((d, idx) => {
    const data = d.data();
    const tr = document.createElement("tr");
    tr.dataset.id = d.id;
    tr.innerHTML = `
      <td><strong>${idx + 1}</strong></td>
      <td>${data.entryName || 'Unknown'}</td>
      <td><strong>${data.total || 0}</strong></td>
      <td>${data.tiebreaker || 0}</td>
    `;
    
    tr.onclick = async () => {
      try {
        const bracket = await getDoc(doc(db, "brackets", d.id));
        if (bracket.exists()) {
          detailsEl.textContent = JSON.stringify(bracket.data().picks, null, 2);
        } else {
          detailsEl.textContent = "Bracket details not found.";
        }
      } catch (err) {
        detailsEl.textContent = "Error loading bracket: " + err.message;
      }
    };
    
    tableBody.appendChild(tr);
  });
});

// Export to PDF
exportPdf.onclick = () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  
  pdf.setFontSize(18);
  pdf.setFont(undefined, 'bold');
  pdf.text('March Madness 2025 Leaderboard', 10, 15);
  
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  
  let y = 30;
  
  tableBody.querySelectorAll('tr').forEach(tr => {
    const cells = tr.querySelectorAll('td');
    if (cells.length >= 4) {
      const rank = cells[0].textContent;
      const name = cells[1].textContent;
      const score = cells[2].textContent;
      const tiebreaker = cells[3].textContent;
      
      pdf.text(`${rank}. ${name} - ${score} pts (Tiebreaker: ${tiebreaker})`, 10, y);
      y += 8;
      
      if (y > 280) {
        pdf.addPage();
        y = 20;
      }
    }
  });
  
  pdf.save('march-madness-leaderboard.pdf');
};
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
