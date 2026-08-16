import { db } from "./firebase-config.js";
import {
  ref, get, set, push, onValue, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { parseCode } from "./code.js";
import { getLang, setLang, t } from "./i18n.js";

const STORAGE_KEY = "tableCode";

let lang = getLang();
let menuItems = {};
let categories = {};
let cart = {}; // itemId -> qty
let ordersUnsub = null;
let menuUnsub = null;

// ---------- DOM refs ----------
const el = (id) => document.getElementById(id);

const entryScreen = el("entryScreen");
const orderScreen = el("orderScreen");

const resumeCodeInput = el("resumeCodeInput");
const resumeError = el("resumeError");
const resumeBtn = el("resumeBtn");

const menuContainer = el("menuContainer");
const cartContainer = el("cartContainer");
const cartTotalRow = el("cartTotalRow");
const cartTotalValue = el("cartTotalValue");
const orderNotes = el("orderNotes");
const submitOrderBtn = el("submitOrderBtn");
const orderStatusContainer = el("orderStatusContainer");
const tableBadge = el("tableBadge");
const changeTableLink = el("changeTableLink");

// ---------- i18n rendering ----------
function applyTranslations() {
  document.documentElement.lang = lang;
  el("appTitle").textContent = t("app_title", lang);
  el("resumeCodeLabel").textContent = t("enter_code_label", lang);
  resumeBtn.textContent = t("enter_code_btn", lang);
  el("menuHeading").textContent = t("menu_heading", lang);
  el("cartHeading").textContent = t("cart_heading", lang);
  el("totalLabel").textContent = t("total", lang);
  orderNotes.placeholder = t("notes_placeholder", lang);
  submitOrderBtn.textContent = t("submit_order", lang);
  el("orderStatusHeading").textContent = t("order_status_heading", lang);
  changeTableLink.textContent = t("change_table", lang);

  document.querySelectorAll("#langSwitch button").forEach((b) => {
    b.classList.toggle("active", b.dataset.lang === lang);
  });

  renderMenu();
  renderCart();
}

el("langSwitch").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-lang]");
  if (!btn) return;
  lang = btn.dataset.lang;
  setLang(lang);
  applyTranslations();
});

// ---------- resume with existing code ----------
resumeBtn.addEventListener("click", async () => {
  resumeError.classList.add("hidden");
  const code = resumeCodeInput.value.trim();
  const parsed = parseCode(code);
  if (!parsed) {
    resumeError.textContent = t("invalid_code", lang);
    resumeError.classList.remove("hidden");
    return;
  }
  resumeBtn.disabled = true;
  try {
    const snap = await get(ref(db, `tables/${code}/meta`));
    if (!snap.exists()) {
      resumeError.textContent = t("code_not_found", lang);
      resumeError.classList.remove("hidden");
      return;
    }
    enterTable(code);
  } finally {
    resumeBtn.disabled = false;
  }
});

changeTableLink.addEventListener("click", (e) => {
  e.preventDefault();
  leaveTable();
});

// ---------- entering / leaving a table session ----------
function enterTable(code) {
  localStorage.setItem(STORAGE_KEY, code);
  const parsed = parseCode(code);
  tableBadge.textContent = `${t("table_label", lang)} ${parsed.table} · ${code}`;
  entryScreen.classList.add("hidden");
  orderScreen.classList.remove("hidden");
  cart = {};
  subscribeMenu();
  subscribeOrders(code);
}

function leaveTable() {
  localStorage.removeItem(STORAGE_KEY);
  if (ordersUnsub) ordersUnsub();
  if (menuUnsub) menuUnsub();
  cart = {};
  orderScreen.classList.add("hidden");
  entryScreen.classList.remove("hidden");
  resumeCodeInput.value = "";
}

// ---------- menu ----------
function subscribeMenu() {
  const catRef = ref(db, "categories");
  onValue(catRef, (snap) => {
    categories = snap.val() || {};
    renderMenu();
  });
  const menuRef = ref(db, "menu");
  menuUnsub = onValue(menuRef, (snap) => {
    menuItems = snap.val() || {};
    renderMenu();
  });
}

function renderMenu() {
  menuContainer.innerHTML = "";
  const catList = Object.entries(categories)
    .map(([id, c]) => ({ id, ...c }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const itemsByCategory = {};
  Object.entries(menuItems).forEach(([id, item]) => {
    const catId = item.categoryId || "_uncat";
    if (!itemsByCategory[catId]) itemsByCategory[catId] = [];
    itemsByCategory[catId].push({ id, ...item });
  });

  const renderGroup = (catId, catName) => {
    const items = (itemsByCategory[catId] || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    if (items.length === 0) return;
    if (catName) {
      const heading = document.createElement("div");
      heading.className = "category-heading";
      heading.textContent = catName;
      menuContainer.appendChild(heading);
    }
    items.forEach((item) => menuContainer.appendChild(renderMenuItem(item)));
  };

  const knownIds = new Set(catList.map((c) => c.id));
  catList.forEach((c) => renderGroup(c.id, (c.name && c.name[lang]) || c.name?.el || ""));
  Object.keys(itemsByCategory)
    .filter((id) => !knownIds.has(id))
    .forEach((id) => renderGroup(id, ""));
}

function renderMenuItem(item) {
  const row = document.createElement("div");
  row.className = "menu-item" + (item.available === false ? " is-unavailable" : "");

  const info = document.createElement("div");
  info.className = "info";
  const name = document.createElement("div");
  name.className = "name";
  name.textContent = (item.name && item.name[lang]) || item.name?.el || "";
  info.appendChild(name);

  const desc = (item.desc && item.desc[lang]) || item.desc?.el || "";
  if (desc) {
    const descEl = document.createElement("div");
    descEl.className = "desc";
    descEl.textContent = desc;
    info.appendChild(descEl);
  }

  const price = document.createElement("div");
  price.className = "price";
  price.textContent = `${Number(item.price || 0).toFixed(2)} ${t("currency", lang)}`;
  info.appendChild(price);

  row.appendChild(info);

  if (item.available === false) {
    const badge = document.createElement("div");
    badge.className = "hint";
    badge.textContent = t("unavailable", lang);
    row.appendChild(badge);
    return row;
  }

  const stepper = document.createElement("div");
  stepper.className = "qty-stepper";
  const minus = document.createElement("button");
  minus.type = "button";
  minus.textContent = "−";
  const qtySpan = document.createElement("span");
  qtySpan.textContent = cart[item.id] || 0;
  const plus = document.createElement("button");
  plus.type = "button";
  plus.textContent = "+";

  minus.addEventListener("click", () => {
    const current = cart[item.id] || 0;
    if (current > 0) cart[item.id] = current - 1;
    if (cart[item.id] === 0) delete cart[item.id];
    qtySpan.textContent = cart[item.id] || 0;
    renderCart();
  });
  plus.addEventListener("click", () => {
    cart[item.id] = (cart[item.id] || 0) + 1;
    qtySpan.textContent = cart[item.id];
    renderCart();
  });

  stepper.appendChild(minus);
  stepper.appendChild(qtySpan);
  stepper.appendChild(plus);
  row.appendChild(stepper);

  return row;
}

// ---------- cart ----------
function renderCart() {
  cartContainer.innerHTML = "";
  const entries = Object.entries(cart).filter(([, qty]) => qty > 0);
  if (entries.length === 0) {
    const msg = document.createElement("p");
    msg.className = "hint";
    msg.textContent = t("empty_cart", lang);
    cartContainer.appendChild(msg);
    cartTotalRow.classList.add("hidden");
    submitOrderBtn.disabled = true;
    return;
  }
  submitOrderBtn.disabled = false;
  let total = 0;
  entries.forEach(([itemId, qty]) => {
    const item = menuItems[itemId];
    if (!item) return;
    const lineTotal = Number(item.price || 0) * qty;
    total += lineTotal;
    const row = document.createElement("div");
    row.className = "cart-row";
    const name = document.createElement("div");
    name.className = "name";
    name.textContent = `${(item.name && item.name[lang]) || item.name?.el || ""} × ${qty}`;
    const lt = document.createElement("div");
    lt.className = "line-total";
    lt.textContent = `${lineTotal.toFixed(2)} ${t("currency", lang)}`;
    row.appendChild(name);
    row.appendChild(lt);
    cartContainer.appendChild(row);
  });
  cartTotalRow.classList.remove("hidden");
  cartTotalValue.textContent = `${total.toFixed(2)} ${t("currency", lang)}`;
}

submitOrderBtn.addEventListener("click", async () => {
  const code = localStorage.getItem(STORAGE_KEY);
  if (!code) return;
  const entries = Object.entries(cart).filter(([, qty]) => qty > 0);
  if (entries.length === 0) return;
  submitOrderBtn.disabled = true;
  try {
    const notes = orderNotes.value.trim();
    for (const [itemId, qty] of entries) {
      const item = menuItems[itemId];
      if (!item) continue;
      const orderRef = push(ref(db, `tables/${code}/orders`));
      await set(orderRef, {
        itemId,
        name: item.name || {},
        price: item.price || 0,
        qty,
        notes,
        status: "pending",
        createdAt: serverTimestamp()
      });
    }
    cart = {};
    orderNotes.value = "";
    renderMenu();
    renderCart();
  } finally {
    submitOrderBtn.disabled = false;
  }
});

// ---------- order status ----------
function subscribeOrders(code) {
  const ordersRef = ref(db, `tables/${code}/orders`);
  ordersUnsub = onValue(ordersRef, (snap) => {
    const data = snap.val() || {};
    const list = Object.entries(data)
      .map(([id, o]) => ({ id, ...o }))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    renderOrderStatus(list);
  });
}

function renderOrderStatus(list) {
  orderStatusContainer.innerHTML = "";
  if (list.length === 0) {
    const msg = document.createElement("p");
    msg.className = "hint";
    msg.textContent = t("no_orders_yet", lang);
    orderStatusContainer.appendChild(msg);
    return;
  }
  list.forEach((o) => {
    const row = document.createElement("div");
    row.className = "order-line";
    const name = document.createElement("div");
    name.textContent = `${(o.name && o.name[lang]) || o.name?.el || ""} × ${o.qty}`;
    const pill = document.createElement("span");
    pill.className = `status-pill ${o.status || "pending"}`;
    pill.textContent = t(`status_${o.status || "pending"}`, lang);
    row.appendChild(name);
    row.appendChild(pill);
    orderStatusContainer.appendChild(row);
  });
}

// ---------- init ----------
function init() {
  applyTranslations();
  const savedCode = localStorage.getItem(STORAGE_KEY);
  if (savedCode && parseCode(savedCode)) {
    get(ref(db, `tables/${savedCode}/meta`)).then((snap) => {
      if (snap.exists()) {
        enterTable(savedCode);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    });
  }
}

init();
