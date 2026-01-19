import { db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const tableBody = document.getElementById("table-body");
const detailsEl = document.getElementById("details");
const countEl = document.getElementById("count");

async function loadSubmissions() {
  tableBody.innerHTML = "";
  detailsEl.textContent = "Click an entry to view picks…";

  const q = query(
    collection(db, "brackets"),
    orderBy("submittedAt", "desc")
  );

  const snapshot = await getDocs(q);
  countEl.textContent = snapshot.size;

  snapshot.forEach(doc => {
    const data = doc.data();

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${data.entryName}</td>
      <td>${data.email}</td>
      <td>${data.tiebreaker}</td>
      <td>${data.submittedAt?.toDate().toLocaleString() || ""}</td>
    `;

    tr.onclick = () => {
      detailsEl.textContent = JSON.stringify(data.picks, null, 2);
    };

    tableBody.appendChild(tr);
  });
}

loadSubmissions();
