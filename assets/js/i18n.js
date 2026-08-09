export const LANGS = ["el", "en", "bg"];

export const STRINGS = {
  el: {
    app_title: "Παραγγελία",
    lang_label: "Γλώσσα",
    tab_new: "Νέο τραπέζι",
    tab_resume: "Έχω κωδικό",
    table_number_label: "Αριθμός τραπεζιού",
    generate_code_btn: "Δημιουργία κωδικού",
    enter_code_label: "Κωδικός εισόδου",
    enter_code_btn: "Είσοδος",
    code_display_label: "Ο κωδικός του τραπεζιού είναι",
    code_hint: "Δώστε αυτόν τον κωδικό στον πελάτη για να παραγγείλει από το κινητό του.",
    continue_to_menu: "Συνέχεια στο μενού",
    invalid_code: "Μη έγκυρος κωδικός.",
    invalid_table: "Δώστε αριθμό τραπεζιού από 1 έως 999.",
    code_not_found: "Ο κωδικός δεν βρέθηκε.",
    menu_heading: "Μενού",
    unavailable: "Μη διαθέσιμο",
    add: "Προσθήκη",
    cart_heading: "Παραγγελία",
    notes_placeholder: "Σχόλια (προαιρετικό)",
    submit_order: "Αποστολή παραγγελίας",
    empty_cart: "Το καλάθι είναι άδειο.",
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
    tab_new: "New table",
    tab_resume: "I have a code",
    table_number_label: "Table number",
    generate_code_btn: "Generate code",
    enter_code_label: "Entry code",
    enter_code_btn: "Enter",
    code_display_label: "The table code is",
    code_hint: "Give this code to the customer so they can order from their phone.",
    continue_to_menu: "Continue to menu",
    invalid_code: "Invalid code.",
    invalid_table: "Enter a table number from 1 to 999.",
    code_not_found: "Code not found.",
    menu_heading: "Menu",
    unavailable: "Unavailable",
    add: "Add",
    cart_heading: "Your order",
    notes_placeholder: "Notes (optional)",
    submit_order: "Send order",
    empty_cart: "Your cart is empty.",
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
    tab_new: "Нова маса",
    tab_resume: "Имам код",
    table_number_label: "Номер на маса",
    generate_code_btn: "Генериране на код",
    enter_code_label: "Код за вход",
    enter_code_btn: "Вход",
    code_display_label: "Кодът на масата е",
    code_hint: "Дайте този код на клиента, за да поръча от телефона си.",
    continue_to_menu: "Продължи към менюто",
    invalid_code: "Невалиден код.",
    invalid_table: "Въведете номер на маса от 1 до 999.",
    code_not_found: "Кодът не е намерен.",
    menu_heading: "Меню",
    unavailable: "Не е налично",
    add: "Добави",
    cart_heading: "Вашата поръчка",
    notes_placeholder: "Бележки (по желание)",
    submit_order: "Изпрати поръчката",
    empty_cart: "Кошницата е празна.",
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
