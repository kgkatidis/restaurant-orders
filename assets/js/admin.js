import { db } from "./firebase-config.js";
import {
  ref, get, push, set, update, remove, onValue, query, orderByKey, startAt, endAt, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { codePrefix, buildCode, parseCode } from "./code.js";

const PIN_KEY = "adminPin";
const UNLOCK_KEY = "adminUnlocked";

const el = (id) => document.getElementById(id);

const setupGate = el("setupGate");
const loginGate = el("loginGate");
const adminPanel = el("adminPanel");

let categories = {};
let menuItems = {};

// ---------- auth gate ----------
function showGate() {
  const storedPin = localStorage.getItem(PIN_KEY);
  if (!storedPin) {
    setupGate.classList.remove("hidden");
    loginGate.classList.add("hidden");
    adminPanel.classList.add("hidden");
  } else if (sessionStorage.getItem(UNLOCK_KEY) === "1") {
    unlock();
  } else {
    loginGate.classList.remove("hidden");
    setupGate.classList.add("hidden");
    adminPanel.classList.add("hidden");
  }
}

function unlock() {
  setupGate.classList.add("hidden");
  loginGate.classList.add("hidden");
  adminPanel.classList.remove("hidden");
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
  if (!confirm("Θέλετε να ορίσετε νέο PIN διαχειριστή;")) return;
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
  onValue(ref(db, "categories"), (snap) => {
    categories = snap.val() || {};
    renderCategoryList();
    renderCategorySelect();
    renderItemList();
  });
  onValue(ref(db, "menu"), (snap) => {
    menuItems = snap.val() || {};
    renderItemList();
  });
}

// ---------- categories ----------
function renderCategoryList() {
  const list = el("categoryList");
  list.innerHTML = "";
  const entries = Object.entries(categories).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
  if (entries.length === 0) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = "Δεν υπάρχουν κατηγορίες ακόμα.";
    list.appendChild(p);
    return;
  }
  entries.forEach(([id, c]) => {
    const row = document.createElement("div");
    row.className = "admin-item-row";
    const info = document.createElement("div");
    info.className = "info";
    info.innerHTML = `<div class="name">${escapeHtml(c.name?.el || "")}</div>
      <div class="sub">EN: ${escapeHtml(c.name?.en || "")} · BG: ${escapeHtml(c.name?.bg || "")} · σειρά ${c.order ?? 0}</div>`;
    const actions = document.createElement("div");
    actions.className = "row-actions";
    const editBtn = mkBtn("Επεξεργασία", "secondary", () => editCategory(id, c));
    const delBtn = mkBtn("Διαγραφή", "danger", () => deleteCategory(id));
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    row.appendChild(info);
    row.appendChild(actions);
    list.appendChild(row);
  });
}

function renderCategorySelect() {
  const select = el("itemCategory");
  const current = select.value;
  select.innerHTML = "";
  Object.entries(categories)
    .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
    .forEach(([id, c]) => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = c.name?.el || id;
      select.appendChild(opt);
    });
  if (current) select.value = current;
}

function editCategory(id, c) {
  el("categoryEditId").value = id;
  el("catNameEl").value = c.name?.el || "";
  el("catNameEn").value = c.name?.en || "";
  el("catNameBg").value = c.name?.bg || "";
  el("catOrder").value = c.order ?? 0;
  el("catSubmitBtn").textContent = "Ενημέρωση κατηγορίας";
  el("catCancelEditBtn").classList.remove("hidden");
}

function resetCategoryForm() {
  el("categoryEditId").value = "";
  el("catNameEl").value = "";
  el("catNameEn").value = "";
  el("catNameBg").value = "";
  el("catOrder").value = 0;
  el("catSubmitBtn").textContent = "Προσθήκη κατηγορίας";
  el("catCancelEditBtn").classList.add("hidden");
}

el("catCancelEditBtn").addEventListener("click", resetCategoryForm);

el("catSubmitBtn").addEventListener("click", async () => {
  const err = el("catError");
  err.classList.add("hidden");
  const nameEl = el("catNameEl").value.trim();
  if (!nameEl) {
    err.textContent = "Το όνομα (ΕΛ) είναι υποχρεωτικό.";
    err.classList.remove("hidden");
    return;
  }
  const data = {
    name: {
      el: nameEl,
      en: el("catNameEn").value.trim(),
      bg: el("catNameBg").value.trim()
    },
    order: Number(el("catOrder").value) || 0
  };
  const editId = el("categoryEditId").value;
  if (editId) {
    await update(ref(db, `categories/${editId}`), data);
  } else {
    await set(push(ref(db, "categories")), data);
  }
  resetCategoryForm();
});

async function deleteCategory(id) {
  if (!confirm("Διαγραφή κατηγορίας; Τα προϊόντα της θα μείνουν χωρίς κατηγορία.")) return;
  await remove(ref(db, `categories/${id}`));
}

// ---------- menu items ----------
function renderItemList() {
  const list = el("itemList");
  list.innerHTML = "";
  const entries = Object.entries(menuItems).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
  if (entries.length === 0) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = "Δεν υπάρχουν προϊόντα ακόμα.";
    list.appendChild(p);
    return;
  }
  entries.forEach(([id, item]) => {
    const row = document.createElement("div");
    row.className = "admin-item-row";
    const catName = categories[item.categoryId]?.name?.el || "χωρίς κατηγορία";
    const info = document.createElement("div");
    info.className = "info";
    info.innerHTML = `<div class="name">${escapeHtml(item.name?.el || "")} — ${Number(item.price || 0).toFixed(2)} €</div>
      <div class="sub">${escapeHtml(catName)}</div>`;
    const actions = document.createElement("div");
    actions.className = "row-actions";
    const availBtn = document.createElement("button");
    availBtn.className = `pill-toggle ${item.available === false ? "off" : "on"}`;
    availBtn.textContent = item.available === false ? "Μη διαθέσιμο" : "Διαθέσιμο";
    availBtn.addEventListener("click", () =>
      update(ref(db, `menu/${id}`), { available: item.available === false })
    );
    const editBtn = mkBtn("Επεξεργασία", "secondary", () => editItem(id, item));
    const delBtn = mkBtn("Διαγραφή", "danger", () => deleteItem(id));
    actions.appendChild(availBtn);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    row.appendChild(info);
    row.appendChild(actions);
    list.appendChild(row);
  });
}

function editItem(id, item) {
  el("itemEditId").value = id;
  el("itemCategory").value = item.categoryId || "";
  el("itemNameEl").value = item.name?.el || "";
  el("itemNameEn").value = item.name?.en || "";
  el("itemNameBg").value = item.name?.bg || "";
  el("itemPrice").value = item.price ?? "";
  el("itemDescEl").value = item.desc?.el || "";
  el("itemDescEn").value = item.desc?.en || "";
  el("itemDescBg").value = item.desc?.bg || "";
  el("itemOrder").value = item.order ?? 0;
  el("itemAvailable").value = item.available === false ? "false" : "true";
  el("itemSubmitBtn").textContent = "Ενημέρωση προϊόντος";
  el("itemCancelEditBtn").classList.remove("hidden");
}

function resetItemForm() {
  el("itemEditId").value = "";
  el("itemNameEl").value = "";
  el("itemNameEn").value = "";
  el("itemNameBg").value = "";
  el("itemPrice").value = "";
  el("itemDescEl").value = "";
  el("itemDescEn").value = "";
  el("itemDescBg").value = "";
  el("itemOrder").value = 0;
  el("itemAvailable").value = "true";
  el("itemSubmitBtn").textContent = "Προσθήκη προϊόντος";
  el("itemCancelEditBtn").classList.add("hidden");
}

el("itemCancelEditBtn").addEventListener("click", resetItemForm);

el("itemSubmitBtn").addEventListener("click", async () => {
  const err = el("itemError");
  err.classList.add("hidden");
  const nameEl = el("itemNameEl").value.trim();
  const price = Number(el("itemPrice").value);
  if (!nameEl) {
    err.textContent = "Το όνομα (ΕΛ) είναι υποχρεωτικό.";
    err.classList.remove("hidden");
    return;
  }
  if (!(price >= 0)) {
    err.textContent = "Δώστε έγκυρη τιμή.";
    err.classList.remove("hidden");
    return;
  }
  if (Object.keys(categories).length === 0) {
    err.textContent = "Δημιουργήστε πρώτα μια κατηγορία.";
    err.classList.remove("hidden");
    return;
  }
  const data = {
    categoryId: el("itemCategory").value,
    name: {
      el: nameEl,
      en: el("itemNameEn").value.trim(),
      bg: el("itemNameBg").value.trim()
    },
    desc: {
      el: el("itemDescEl").value.trim(),
      en: el("itemDescEn").value.trim(),
      bg: el("itemDescBg").value.trim()
    },
    price,
    order: Number(el("itemOrder").value) || 0,
    available: el("itemAvailable").value === "true"
  };
  const editId = el("itemEditId").value;
  if (editId) {
    await update(ref(db, `menu/${editId}`), data);
  } else {
    await set(push(ref(db, "menu")), data);
  }
  resetItemForm();
});

async function deleteItem(id) {
  if (!confirm("Διαγραφή προϊόντος;")) return;
  await remove(ref(db, `menu/${id}`));
}

// ---------- helpers ----------
function mkBtn(text, cls, onClick) {
  const b = document.createElement("button");
  b.className = `btn small ${cls}`;
  b.textContent = text;
  b.addEventListener("click", onClick);
  return b;
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}
