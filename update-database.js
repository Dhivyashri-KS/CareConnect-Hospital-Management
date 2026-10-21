const db = require("better-sqlite3")("hospital.db");

const columns = db.prepare("PRAGMA table_info(patients)").all()
  .map(column => column.name);

if (!columns.includes("blood")) {
  db.exec("ALTER TABLE patients ADD COLUMN blood TEXT");
  console.log("Blood group column added!");
}

if (!columns.includes("address")) {
  db.exec("ALTER TABLE patients ADD COLUMN address TEXT");
  console.log("Address column added!");
}

console.log("Current patient columns:");
console.log(
  db.prepare("PRAGMA table_info(patients)")
    .all()
    .map(column => column.name)
);

db.close();