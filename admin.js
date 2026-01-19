import { db, auth } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

/* =========================
   CONFIG
========================= */

// 🔒 CHANGE THIS TO YOUR ADMIN EMAIL
const ADMIN_EMAIL = "jbgerloff@gmail.com";

/* =========================
   DOM ELEMENTS
========================= */

const loginDiv = document.getElementById("login");
const dashboardDiv = document.getElementById("dashboard");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");

const tableBody = document.getElementById("table-body");
const detailsEl = document.getElementById("details");
const countEl = document.getElementById("count");
const adminEmailEl = document.getElementById("adminEmail");

/* =========================
   AUTH HANDLING
========================= */

loginBtn.onclick = async () => {
  console.log("Login button clicked");
  loginError.textContent = "";

  try {
    console.log("Attempting sign-in...");
    await signInWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
    console.log("Sign-in success");
  } catch (err) {
    console.error("AUTH ERROR:", err);
    loginError.textContent = err.message;
  }
};

logoutBtn.onclick = async () => {
  await signOut(auth);
};

onAuthStateChanged(auth, user => {
  if (!user || user.email !== ADMIN_EMAIL) {
    loginDiv.style.display = "block";
    dashboardDiv.style.display = "none";
    return;
  }

  loginDiv.style.display = "none";
  dashboardDiv.style.display = "block";
  adminEmailEl.textContent = user.email;

  loadSubmissions();
});

/* =========================
   FIRESTORE QUERY
========================= */

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


