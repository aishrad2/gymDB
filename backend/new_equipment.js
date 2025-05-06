import mysql from 'mysql2'
import dotenv from 'dotenv'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import bodyParser from 'body-parser'

const encoder = bodyParser.urlencoded()

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

var currentId;

const app = express();
app.use("/assets", express.static(path.join(__dirname, "../frontend/assets")))
app.listen(3000, () => {
    console.log("The server has started")
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/new_equipment.html"))
})

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()


app.get("/api/musclegroups", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM musclegroup");
        res.json(rows);
    } catch (error) {
        console.error("Failed to fetch muscle groups:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.get("/api/rooms", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM room");
        res.json(rows);
    } catch (error) {
        console.error("Failed to fetch rooms:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/api/newEquip", encoder, async (req, res) => {
    const { equipmentName, muscleGroup, roomName, quantity } = req.body;
  
    try {
      await pool.query(
        `INSERT INTO equipment (equipmentName, muscleGroupId, roomId, quantity)
         VALUES (?, ?, ?, ?)`,
        [equipmentName, muscleGroup, roomName, quantity]
      );
      res.redirect('/equipment_success.html');
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  });

  app.get('/admin_dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin_dashboard.html'));
  });

  app.get('/new_equipment.html', (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/new_equipment.html"));
  });

  app.get('/equipment_success.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/equipment_success.html'));
  });