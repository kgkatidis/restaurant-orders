import { db } from "./firebase-config.js";
import {
  ref, get, set, update, onValue, query, orderByKey, startAt, endAt, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { codePrefix, buildCode, parseCode } from "./code.js";

const PIN_KEY = "managerPin";
const UNLOCK_KEY = "managerUnlocked";

const el = (id) => document.getElementById(id);

const setupGate = el("setupGate");
const loginGate = el("loginGate");
const managerPanel = el("managerPanel");

// ---------- auth gate ----------
function showGate() {
  const storedPin = localStorage.getItem(PIN_KEY);
  if (!storedPin) {
    setupGate.classList.remove("hidden");
    loginGate.classList.add("hidden");
    managerPanel.classList.add("hidden");
  } else if (sessionStorage.getItem(UNLOCK_KEY) === "1") {
    unlock();
  } else {
    loginGate.classList.remove("hidden");
    setupGate.classList.add("hidden");
    managerPanel.classList.add("hidden");
  }
}

function unlock() {
  setupGate.classList.add("hidden");
  loginGate.classList.add("hidden");
  managerPanel.classList.remove("hidden");
  initData();
}

el("setupBtn").addEventListener("click", () => {
  const p1 = el("setupPin1").value.trim();
  const p2 = el("setupPin2").value.trim();
  const err = el("setupError");
  err.classList.add("hidden");
  if (p1.length < 4) {
    err.textContent = "Το PIN πρέπει να έχει τουλάχιστον 4 χαρακτήρες.";
    err.classList.remove("hidden");
    return;
  }
  if (p1 !== p2) {
    err.textContent = "Τα PIN δεν ταιριάζουν.";
    err.classList.remove("hidden");
    return;
  }
  localStorage.setItem(PIN_KEY, p1);
  sessionStorage.setItem(UNLOCK_KEY, "1");
  unlock();
});

el("loginBtn").addEventListener("click", () => {
  const pin = el("loginPin").value.trim();
  const err = el("loginError");
  err.classList.add("hidden");
  if (pin !== localStorage.getItem(PIN_KEY)) {
    err.textContent = "Λάθος PIN.";
    err.classList.remove("hidden");
    return;
  }
  sessionStorage.setItem(UNLOCK_KEY, "1");
  unlock();
});

el("changePinBtn").addEventListener("click", () => {
  if (!confirm("Θέλετε να ορίσετε νέο PIN υπευθύνου;")) return;
  localStorage.removeItem(PIN_KEY);
  sessionStorage.removeItem(UNLOCK_KEY);
  el("setupPin1").value = "";
  el("setupPin2").value = "";
  showGate();
});

showGate();

// ---------- table code generation ----------
el("generateCodeBtn").addEventListener("click", async () => {
  const err = el("tableCodeError");
  err.classList.add("hidden");
  const n = parseInt(el("tableNumberInput").value, 10);
  if (!n || n < 1 || n > 999) {
    err.textContent = "Δώστε αριθμό τραπεζιού από 1 έως 999.";
    err.classList.remove("hidden");
    return;
  }
  const btn = el("generateCodeBtn");
  btn.disabled = true;
  try {
    const prefix = codePrefix(n);
    const tablesRef = ref(db, "tables");
    const q = query(tablesRef, orderByKey(), startAt(prefix + "00"), endAt(prefix + "99"));
    const snap = await get(q);
    let maxSeq = 0;
    if (snap.exists()) {
      snap.forEach((child) => {
        const parsed = parseCode(child.key);
        if (parsed && parsed.seq > maxSeq) maxSeq = parsed.seq;
      });
    }
    const seq = maxSeq + 1;
    if (seq > 99) {
      err.textContent = "Έχει συμπληρωθεί ο μέγιστος αριθμός παρεών για αυτό το τραπέζι σήμερα.";
      err.classList.remove("hidden");
      return;
    }
    const code = buildCode(n, seq);
    const parsed = parseCode(code);
    await set(ref(db, `tables/${code}/meta`), {
      table: parsed.table,
      year: parsed.year,
      dayOfYear: parsed.dayOfYear,
      seq: parsed.seq,
      createdAt: serverTimestamp()
    });
    el("generatedCode").textContent = code;
    el("codeResult").classList.remove("hidden");
    el("tableNumberInput").value = "";
  } finally {
    btn.disabled = false;
  }
});

// ---------- data subscriptions ----------
function initData() {
  onValue(ref(db, "tables"), (snap) => {
    renderActiveTables(snap.val() || {});
  });
}

// ---------- active tables ----------
function renderActiveTables(tablesData) {
  const list = el("activeTablesList");
  list.innerHTML = "";
  list.className = "kitchen-board";
  const tables = Object.entries(tablesData)
    .filter(([, t]) => t.meta && t.meta.paid !== true)
    .map(([code, t]) => ({ code, ...t }))
    .sort((a, b) => (a.meta.createdAt || 0) - (b.meta.createdAt || 0));

  if (tables.length === 0) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = "Δεν υπάρχουν ενεργά τραπέζια αυτή τη στιγμή.";
    list.appendChild(p);
    return;
  }

  tables.forEach((table) => {
    const card = document.createElement("div");
    card.className = "card table-card";

    const heading = document.createElement("h2");
    heading.textContent = `Τραπέζι ${table.meta.table}`;
    card.appendChild(heading);

    const meta = document.createElement("div");
    meta.className = "table-meta";
    meta.textContent = `Κωδικός: ${table.code}`;
    card.appendChild(meta);

    const orders = Object.values(table.orders || {}).sort(
      (a, b) => (a.createdAt || 0) - (b.createdAt || 0)
    );
    let total = 0;
    if (orders.length === 0) {
      const p = document.createElement("p");
      p.className = "hint";
      p.textContent = "Δεν έχει σταλεί ακόμα παραγγελία.";
      card.appendChild(p);
    } else {
      orders.forEach((o) => {
        const lineTotal = Number(o.price || 0) * (o.qty || 0);
        total += lineTotal;
        const row = document.createElement("div");
        row.className = "order-line";
        const name = document.createElement("div");
        name.textContent = `${o.name?.el || ""} × ${o.qty}`;
        const price = document.createElement("div");
        price.textContent = `${lineTotal.toFixed(2)} €`;
        row.appendChild(name);
        row.appendChild(price);
        card.appendChild(row);
      });
      const totalRow = document.createElement("div");
      totalRow.className = "cart-total";
      const totalLabel = document.createElement("span");
      totalLabel.textContent = "Σύνολο";
      const totalValue = document.createElement("span");
      totalValue.textContent = `${total.toFixed(2)} €`;
      totalRow.appendChild(totalLabel);
      totalRow.appendChild(totalValue);
      card.appendChild(totalRow);
    }

    const paidBtn = document.createElement("button");
    paidBtn.className = "btn";
    paidBtn.textContent = "Πληρώθηκε";
    paidBtn.addEventListener("click", () =>
      update(ref(db, `tables/${table.code}/meta`), {
        paid: true,
        paidAt: serverTimestamp()
      })
    );
    card.appendChild(paidBtn);

    list.appendChild(card);
  });
}
