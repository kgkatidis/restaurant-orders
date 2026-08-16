export const LANGS = ["el", "en", "bg"];

export const STRINGS = {
  el: {
    app_title: "Παραγγελία",
    lang_label: "Γλώσσα",
    enter_code_label: "Κωδικός εισόδου",
    enter_code_btn: "Είσοδος",
    invalid_code: "Μη έγκυρος κωδικός.",
    code_not_found: "Ο κωδικός δεν βρέθηκε.",
    menu_heading: "Μενού",
    unavailable: "Μη διαθέσιμο",
    add: "Προσθήκη",
    cart_heading: "Παραγγελία",
    notes_placeholder: "Σχόλια (προαιρετικό)",
    submit_order: "Αποστολή παραγγελίας",
    empty_cart: "Το καλάθι είναι άδειο.",
    no_orders_yet: "Δεν έχετε στείλει ακόμα παραγγελία.",
    order_sent: "Η παραγγελία στάλθηκε!",
    order_status_heading: "Κατάσταση παραγγελίας",
    status_pending: "Σε εκκρεμότητα",
    status_preparing: "Σε προετοιμασία",
    status_delivered: "Παραδόθηκε",
    qty: "Ποσότητα",
    total: "Σύνολο",
    table_label: "Τραπέζι",
    change_table: "Αλλαγή τραπεζιού",
    remove: "Αφαίρεση",
    currency: "€"
  },
  en: {
    app_title: "Order",
    lang_label: "Language",
    enter_code_label: "Entry code",
    enter_code_btn: "Enter",
    invalid_code: "Invalid code.",
    code_not_found: "Code not found.",
    menu_heading: "Menu",
    unavailable: "Unavailable",
    add: "Add",
    cart_heading: "Your order",
    notes_placeholder: "Notes (optional)",
    submit_order: "Send order",
    empty_cart: "Your cart is empty.",
    no_orders_yet: "You haven't sent an order yet.",
    order_sent: "Order sent!",
    order_status_heading: "Order status",
    status_pending: "Pending",
    status_preparing: "Preparing",
    status_delivered: "Delivered",
    qty: "Qty",
    total: "Total",
    table_label: "Table",
    change_table: "Change table",
    remove: "Remove",
    currency: "€"
  },
  bg: {
    app_title: "Поръчка",
    lang_label: "Език",
    enter_code_label: "Код за вход",
    enter_code_btn: "Вход",
    invalid_code: "Невалиден код.",
    code_not_found: "Кодът не е намерен.",
    menu_heading: "Меню",
    unavailable: "Не е налично",
    add: "Добави",
    cart_heading: "Вашата поръчка",
    notes_placeholder: "Бележки (по желание)",
    submit_order: "Изпрати поръчката",
    empty_cart: "Кошницата е празна.",
    no_orders_yet: "Все още нямате изпратена поръчка.",
    order_sent: "Поръчката е изпратена!",
    order_status_heading: "Статус на поръчката",
    status_pending: "В очакване",
    status_preparing: "Приготвя се",
    status_delivered: "Доставено",
    qty: "Кол-во",
    total: "Общо",
    table_label: "Маса",
    change_table: "Смяна на маса",
    remove: "Премахни",
    currency: "€"
  }
};

export function getLang() {
  const stored = localStorage.getItem("lang");
  if (stored && LANGS.includes(stored)) return stored;
  return "el";
}

export function setLang(lang) {
  if (LANGS.includes(lang)) localStorage.setItem("lang", lang);
}

export function t(key, lang = getLang()) {
  return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.el[key] || key;
}
