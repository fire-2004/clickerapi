const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
// Mengizinkan semua akses agar HTML dari HP kamu bisa masuk
app.use(cors());
app.use(express.json());

// Mengambil URL dari Environment Variable Render
const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Sering dibutuhkan untuk koneksi cloud DB
});

dbClient.connect()
    .then(() => {
        console.log("✅ Terhubung ke CockroachDB!");
        return dbClient.query(`
            CREATE TABLE IF NOT EXISTS players (
                uid VARCHAR(255) PRIMARY KEY,
                state JSONB
            )
        `);
    })
    .catch(err => console.error("❌ Error koneksi DB:", err));

app.post('/api/save', async (req, res) => {
    const { uid, state } = req.body;
    if (!uid || !state) return res.status(400).json({ error: "Data tidak lengkap" });

    try {
        await dbClient.query(`
            INSERT INTO players (uid, state) 
            VALUES ($1, $2) 
            ON CONFLICT (uid) DO UPDATE SET state = EXCLUDED.state
        `, [uid, JSON.stringify(state)]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Gagal save ke DB" });
    }
});

// Render akan mengisi process.env.PORT otomatis
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server jalan di port ${PORT}`));