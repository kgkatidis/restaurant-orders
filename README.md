# Σύστημα Παραγγελιών Εστιατορίου

Στατικό site (GitHub Pages) με 3 σελίδες που συγχρονίζονται σε πραγματικό χρόνο μέσω Firebase Realtime Database:

- **index.html** — Σελίδα πελάτη (πολυγλωσσική: Ελληνικά / English / Български)
- **kitchen.html** — Σελίδα κουζίνας
- **admin.html** — Σελίδα διαχειριστή (διαχείριση μενού, PIN-protected)

## ⚠️ Απαραίτητο βήμα πριν λειτουργήσει: Database Rules

Οι κανόνες ασφαλείας της Realtime Database ξεκινούν κλειδωμένοι από προεπιλογή (κανείς δεν μπορεί να διαβάσει/γράψει). Πρέπει να μπεις στο [Firebase Console](https://console.firebase.google.com/project/restaurant-orders-app/database/restaurant-orders-app-default-rtdb/rules) → Realtime Database → Rules και να επικολλήσεις:

```json
{
  "rules": {
    "menu": {
      ".read": true,
      ".write": true
    },
    "categories": {
      ".read": true,
      ".write": true
    },
    "tables": {
      ".read": true,
      ".write": true
    }
  }
}
```

Πάτησε **Publish**. Χωρίς αυτό το βήμα, οι σελίδες θα φορτώνουν αλλά καμία παραγγελία/μενού δεν θα αποθηκεύεται (θα βλέπεις σφάλματα `PERMISSION_DENIED` στην κονσόλα).

> Σημείωση ασφαλείας: αυτοί οι κανόνες επιτρέπουν ανοιχτή πρόσβαση σε όποιον έχει το URL, αφού δεν χρησιμοποιείται Firebase Authentication. Είναι επαρκές για μικρή εσωτερική χρήση σε ένα εστιατόριο. Για μεγαλύτερη ασφάλεια στο μέλλον, πρόσθεσε Firebase Authentication.

## Πώς δουλεύει ο κωδικός τραπεζιού

Μορφή: `ΑΑΑΥΥΗΗΗΝΝ` (10 ψηφία)

| Τμήμα | Σημασία | Εύρος |
|---|---|---|
| ΑΑΑ | Αριθμός τραπεζιού | 1–999 |
| ΥΥ | 2 τελευταία ψηφία έτους | π.χ. 26 |
| ΗΗΗ | Ημέρα του έτους | 1–366 |
| ΝΝ | Αύξων αριθμός παρέας στο τραπέζι, τη συγκεκριμένη ημέρα | 1–99 |

Ο κωδικός δημιουργείται από τον **διαχειριστή** (admin.html → «Δημιουργία κωδικού τραπεζιού»): δίνει τον αριθμό τραπεζιού και το σύστημα υπολογίζει αυτόματα ολόκληρο τον κωδικό (ελέγχοντας τη βάση για το επόμενο διαθέσιμο ΝΝ) και τον εμφανίζει για να τον δώσει ο σερβιτόρος στον πελάτη. Ο πελάτης μπαίνει στο index.html στο δικό του κινητό και εισάγει τον κωδικό.

## Διαχειριστής — PIN

Η σελίδα admin.html δεν χρησιμοποιεί πραγματικό login (δεν υπάρχει Firebase Authentication). Την πρώτη φορά που θα την ανοίξεις, σου ζητά να ορίσεις ένα PIN, το οποίο αποθηκεύεται τοπικά στον browser (localStorage) της συσκευής. Αυτό είναι απλή προστασία από επισκέπτες, όχι πραγματική ασφάλεια — οποιοσδήποτε ξέρει το URL μπορεί τεχνικά να γράψει απευθείας στη βάση.

## Δομή δεδομένων (Realtime Database)

```
categories/{categoryId}: { name: {el,en,bg}, order }
menu/{itemId}: { categoryId, name: {el,en,bg}, desc: {el,en,bg}, price, order, available }
tables/{code}/meta: { table, year, dayOfYear, seq, createdAt }
tables/{code}/orders/{orderId}: { itemId, name, price, qty, notes, status, createdAt }
```

Κατάσταση παραγγελίας (`status`): `pending` → `preparing` → `delivered`.
