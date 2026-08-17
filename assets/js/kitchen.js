import { db } from "./firebase-config.js";
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

const board = document.getElementById("board");
const emptyState = document.getElementById("emptyState");
const pendingCount = document.getElementById("pendingCount");
const menuAvailabilityList = document.getElementById("menuAvailabilityList");

let categories = {};
let menuItems = {};

const STATUS_LABEL = {
  pending: "Σε εκκρεμότητα",
  preparing: "Σε προετοιμασία",
  delivered: "Παραδόθηκε"
};

const NEXT_STATUS = {
  pending: "preparing",
  preparing: "delivered"
};

const NEXT_ACTION_LABEL = {
  pending: "Ξεκίνησε",
  preparing: "Ολοκληρώθηκε ✓"
};

function setStatus(code, orderId, newStatus) {
  update(ref(db, `tables/${code}/orders/${orderId}`), {
    status: newStatus,
    updatedAt: Date.now()
  });
}

function render(tablesData) {
  board.innerHTML = "";
  const tables = Object.entries(tablesData || {})
    .map(([code, t]) => ({ code, ...t }))
    .map((t) => {
      const orders = Object.entries(t.orders || {}).map(([id, o]) => ({ id, ...o }));
      const active = orders.filter((o) => o.status !== "delivered");
      return { ...t, orders, active };
    })
    .filter((t) => t.active.length > 0)
    .sort((a, b) => {
      const at = Math.min(...a.active.map((o) => o.createdAt || Infinity));
      const bt = Math.min(...b.active.map((o) => o.createdAt || Infinity));
      return at - bt;
    });

  let totalPending = 0;
  tables.forEach((t) => (totalPending += t.active.length));
  pendingCount.textContent = totalPending > 0 ? `${totalPending} εκκρεμή προϊόντα` : "";

  emptyState.classList.toggle("hidden", tables.length > 0);

  tables.forEach((table) => {
    const card = document.createElement("div");
    card.className = "card table-card";

    const heading = document.createElement("h2");
    heading.textContent = `Τραπέζι ${table.meta?.table ?? "?"}`;
    card.appendChild(heading);

    const meta = document.createElement("div");
    meta.className = "table-meta";
    meta.textContent = `Κωδικός: ${table.code}`;
    card.appendChild(meta);

    const sortedActive = [...table.active].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    sortedActive.forEach((order) => {
      const row = document.createElement("div");
      row.className = "kitchen-item";

      const qty = document.createElement("div");
      qty.className = "kq";
      qty.textContent = `×${order.qty}`;
      row.appendChild(qty);

      const info = document.createElement("div");
      info.className = "kname";
      const name = document.createElement("div");
      name.textContent = (order.name && order.name.el) || "";
      info.appendChild(name);
      if (order.notes) {
        const notes = document.createElement("div");
        notes.className = "knotes";
        notes.textContent = order.notes;
        info.appendChild(notes);
      }
      const pill = document.createElement("span");
      pill.className = `status-pill ${order.status}`;
      pill.textContent = STATUS_LABEL[order.status] || order.status;
      info.appendChild(document.createElement("br"));
      info.appendChild(pill);
      row.appendChild(info);

      const nextStatus = NEXT_STATUS[order.status];
      if (nextStatus) {
        const btn = document.createElement("button");
        btn.className = "btn small";
        btn.textContent = NEXT_ACTION_LABEL[order.status];
        btn.addEventListener("click", () => setStatus(table.code, order.id, nextStatus));
        row.appendChild(btn);
      }

      card.appendChild(row);
    });

    board.appendChild(card);
  });
}

onValue(ref(db, "tables"), (snap) => {
  render(snap.val());
});

// ---------- menu availability ----------
function renderMenuAvailability() {
  menuAvailabilityList.innerHTML = "";
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
      menuAvailabilityList.appendChild(heading);
    }
    items.forEach((item) => menuAvailabilityList.appendChild(renderAvailabilityRow(item)));
  };

  const knownIds = new Set(catList.map((c) => c.id));
  catList.forEach((c) => renderGroup(c.id, c.name?.el || ""));
  Object.keys(itemsByCategory)
    .filter((id) => !knownIds.has(id))
    .forEach((id) => renderGroup(id, ""));

  if (Object.keys(menuItems).length === 0) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = "Δεν υπάρχουν προϊόντα στο μενού ακόμα.";
    menuAvailabilityList.appendChild(p);
  }
}

function renderAvailabilityRow(item) {
  const row = document.createElement("div");
  row.className = "admin-item-row";

  const info = document.createElement("div");
  info.className = "info";
  const name = document.createElement("div");
  name.className = "name";
  name.textContent = item.name?.el || "";
  info.appendChild(name);
  row.appendChild(info);

  const availBtn = document.createElement("button");
  availBtn.className = `pill-toggle ${item.available === false ? "off" : "on"}`;
  availBtn.textContent = item.available === false ? "Μη διαθέσιμο" : "Διαθέσιμο";
  availBtn.addEventListener("click", () =>
    update(ref(db, `menu/${item.id}`), { available: item.available === false })
  );
  row.appendChild(availBtn);

  return row;
}

onValue(ref(db, "categories"), (snap) => {
  categories = snap.val() || {};
  renderMenuAvailability();
});

onValue(ref(db, "menu"), (snap) => {
  menuItems = snap.val() || {};
  renderMenuAvailability();
});
