// Table code format: AAAYYHHHNN (10 digits)
//   AAA  -> table number, 1-999
//   YY   -> last 2 digits of year
//   HHH  -> day of year, 1-366
//   NN   -> sequence number of the party seated at that table on that day, 1-99

export function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date - start;
  return Math.floor(diff / 86400000) + 1;
}

export function codePrefix(tableNumber, date = new Date()) {
  const table = String(tableNumber).padStart(3, "0");
  const year = String(date.getFullYear() % 100).padStart(2, "0");
  const day = String(getDayOfYear(date)).padStart(3, "0");
  return `${table}${year}${day}`;
}

export function buildCode(tableNumber, seq, date = new Date()) {
  return `${codePrefix(tableNumber, date)}${String(seq).padStart(2, "0")}`;
}

// Parses and validates a 10-digit table code. Returns null if invalid.
export function parseCode(code) {
  if (typeof code !== "string" || !/^\d{10}$/.test(code)) return null;
  const table = parseInt(code.slice(0, 3), 10);
  const year = parseInt(code.slice(3, 5), 10);
  const dayOfYear = parseInt(code.slice(5, 8), 10);
  const seq = parseInt(code.slice(8, 10), 10);
  if (table < 1 || table > 999) return null;
  if (dayOfYear < 1 || dayOfYear > 366) return null;
  if (seq < 1 || seq > 99) return null;
  return { table, year, dayOfYear, seq, code };
}
