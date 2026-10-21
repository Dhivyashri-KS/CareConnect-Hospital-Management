const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = 3000;

// Connect to the existing database.
const db = new Database(path.join(__dirname, "hospital.db"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define the tables and their permitted fields.
const resources = {
    patients: {
        fields: ["name", "age", "gender", "phone", "blood", "address"],
        required: ["name", "age", "gender"]
    },

    doctors: {
        fields: ["name", "specialization", "phone", "email"],
        required: ["name", "specialization"]
    },

    appointments: {
        fields: [
            "patient_name",
            "doctor_name",
            "appointment_date",
            "appointment_time",
            "status"
        ],
        required: [
            "patient_name",
            "doctor_name",
            "appointment_date",
            "appointment_time",
            "status"
        ]
    },

    laboratory: {
        fields: [
            "test_name",
            "patient_name",
            "test_date",
            "result",
            "status"
        ],
        required: ["test_name", "patient_name", "test_date", "status"]
    },

    beds: {
        fields: ["room_number", "bed_number", "bed_type", "status"],
        required: ["room_number", "bed_number", "bed_type", "status"]
    },

    billing: {
        fields: [
            "patient_name",
            "amount",
            "bill_date",
            "payment_status",
            "description"
        ],
        required: ["patient_name", "amount", "bill_date", "payment_status"]
    }
};

// Create the tables if they do not already exist.
db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        phone TEXT,
        blood TEXT,
        address TEXT
    );

    CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        specialization TEXT NOT NULL,
        phone TEXT,
        email TEXT
    );

    CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_name TEXT NOT NULL,
        doctor_name TEXT NOT NULL,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT NOT NULL,
        status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS laboratory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_name TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        test_date TEXT NOT NULL,
        result TEXT,
        status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS beds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number TEXT NOT NULL,
        bed_number TEXT NOT NULL,
        bed_type TEXT NOT NULL,
        status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS billing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_name TEXT NOT NULL,
        amount REAL NOT NULL,
        bill_date TEXT NOT NULL,
        payment_status TEXT NOT NULL,
        description TEXT
    );
`);

// Validate the fields received from the frontend.
function validateRecord(resource, body, isUpdate = false) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return "A valid JSON object is required.";
    }

    const allowedFields = resource.fields;
    const invalidFields = Object.keys(body).filter(
        key => !allowedFields.includes(key)
    );

    if (invalidFields.length > 0) {
        return "Unknown field(s): " + invalidFields.join(", ");
    }

    for (const field of resource.fields) {
        const value = body[field];

        if (
            resource.required.includes(field) &&
            !isUpdate &&
            (value === undefined || value === null || String(value).trim() === "")
        ) {
            return field + " is required.";
        }

        if (
            resource.required.includes(field) &&
            isUpdate &&
            value !== undefined &&
            (value === null || String(value).trim() === "")
        ) {
            return field + " cannot be empty.";
        }
    }

    if (
        body.age !== undefined &&
        (!Number.isInteger(Number(body.age)) || Number(body.age) < 0)
    ) {
        return "Age must be a non-negative integer.";
    }

    if (
        body.amount !== undefined &&
        (!Number.isFinite(Number(body.amount)) || Number(body.amount) < 0)
    ) {
        return "Amount must be a non-negative number.";
    }

    return null;
}

// GET: Retrieve all records.
app.get("/api/:table", (req, res) => {
    try {
        const resource = resources[req.params.table];

        if (!resource) {
            return res.status(404).json({ error: "Table not found." });
        }

        const rows = db
            .prepare(`SELECT * FROM "${req.params.table}" ORDER BY id DESC`)
            .all();

        res.json(rows);
    } catch (error) {
        console.error("GET error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET: Retrieve one record.
app.get("/api/:table/:id", (req, res) => {
    try {
        const table = req.params.table;

        if (!resources[table]) {
            return res.status(404).json({ error: "Table not found." });
        }

        const record = db
            .prepare(`SELECT * FROM "${table}" WHERE id = ?`)
            .get(req.params.id);

        if (!record) {
            return res.status(404).json({ error: "Record not found." });
        }

        res.json(record);
    } catch (error) {
        console.error("GET record error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// POST: Add a new record.
app.post("/api/:table", (req, res) => {
    try {
        const table = req.params.table;
        const resource = resources[table];

        if (!resource) {
            return res.status(404).json({ error: "Table not found." });
        }

        const validationError = validateRecord(resource, req.body);

        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const fields = resource.fields.filter(
            field => req.body[field] !== undefined
        );

        if (fields.length === 0) {
            return res.status(400).json({
                error: "No valid fields were provided."
            });
        }

        const columns = fields.map(field => `"${field}"`).join(", ");
        const placeholders = fields.map(() => "?").join(", ");
        const values = fields.map(field => req.body[field]);

        const result = db.prepare(`
            INSERT INTO "${table}" (${columns})
            VALUES (${placeholders})
        `).run(...values);

        const createdRecord = db
            .prepare(`SELECT * FROM "${table}" WHERE id = ?`)
            .get(result.lastInsertRowid);

        res.status(201).json({
            message: "Record added successfully.",
            record: createdRecord
        });
    } catch (error) {
        console.error("POST error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// PUT: Update an existing record.
app.put("/api/:table/:id", (req, res) => {
    try {
        const table = req.params.table;
        const resource = resources[table];

        if (!resource) {
            return res.status(404).json({ error: "Table not found." });
        }

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Invalid record ID." });
        }

        const existingRecord = db
            .prepare(`SELECT * FROM "${table}" WHERE id = ?`)
            .get(id);

        if (!existingRecord) {
            return res.status(404).json({ error: "Record not found." });
        }

        const validationError = validateRecord(
            resource,
            req.body,
            true
        );

        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const fields = resource.fields.filter(
            field => req.body[field] !== undefined
        );

        if (fields.length === 0) {
            return res.status(400).json({
                error: "No fields were provided to update."
            });
        }

        const assignments = fields
            .map(field => `"${field}" = ?`)
            .join(", ");

        const values = fields.map(field => req.body[field]);
        values.push(id);

        db.prepare(`
            UPDATE "${table}"
            SET ${assignments}
            WHERE id = ?
        `).run(...values);

        const updatedRecord = db
            .prepare(`SELECT * FROM "${table}" WHERE id = ?`)
            .get(id);

        res.json({
            message: "Record updated successfully.",
            record: updatedRecord
        });
    } catch (error) {
        console.error("PUT error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// DELETE: Remove a record.
app.delete("/api/:table/:id", (req, res) => {
    try {
        const table = req.params.table;
        const resource = resources[table];

        if (!resource) {
            return res.status(404).json({ error: "Table not found." });
        }

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Invalid record ID." });
        }

        const existingRecord = db
            .prepare(`SELECT id FROM "${table}" WHERE id = ?`)
            .get(id);

        if (!existingRecord) {
            return res.status(404).json({ error: "Record not found." });
        }

        db.prepare(`DELETE FROM "${table}" WHERE id = ?`).run(id);

        res.json({ message: "Record deleted successfully." });
    } catch (error) {
        console.error("DELETE error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Handle invalid JSON and other request errors.
app.use((error, req, res, next) => {
    console.error("Request error:", error.message);

    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({ error: "Invalid JSON request body." });
    }

    res.status(500).json({ error: "An unexpected server error occurred." });
});

// Serve the frontend.
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Start the server.
app.listen(PORT, () => {
    console.log(`CareConnect server running at http://localhost:${PORT}`);
});