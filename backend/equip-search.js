import mysql from 'mysql2'
dotenv.config()
import dotenv from 'dotenv'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import bodyParser from 'body-parser'
import bcrypt from 'bcrypt'
const saltRounds = 10;

//encoder to parse input data from html
const encoder = bodyParser.urlencoded()

//env file configuration
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express();
app.use("/assets", express.static(path.join(__dirname, "../frontend/assets")))

//port
app.listen(3000, () => {
    console.log("The server has started")
})

//get request to index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/equip_search.html"))
})


//Connection pool to SQL db, using mysql 2 promise version
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()

async function getMuscleGroups() {
    const [rows] = await pool.query("SELECT * FROM musclegroup")
    return rows
}

async function getRooms() {
    const [rows] = await pool.query("SELECT * FROM room")
    return rows
}

async function getMuscleGroup(muscleGroupId) {
    const [rows] = await pool.query(`
        SELECT * FROM musclegroup
        WHERE muscleGroupId = ?
        `, [muscleGroupId])
    return rows
}

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


app.use(express.json()); 

app.post("/api/search", async (req, res) => {
  let { text, muscleGroupId, roomId } = req.body;

  const conditions = [];
  const values = [];

  if (text && text.trim()) {
    conditions.push("equipmentName LIKE ?");
    values.push(`%${text.trim()}%`);
  }

  if (muscleGroupId) {
    conditions.push("e.muscleGroupId = ?");
    values.push(muscleGroupId);
  }

  if (roomId) {
    conditions.push("e.roomId = ?");
    values.push(roomId);
  }

  const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const query = `
    SELECT 
      e.equipmentId,
      e.equipmentName,
      e.muscleGroupId,
      e.roomId,
      mg.muscleGroupName,
      r.roomName,
      e.quantity
    FROM equipment e
    LEFT JOIN musclegroup mg ON e.muscleGroupId = mg.muscleGroupId
    LEFT JOIN room r ON e.roomId = r.roomId
    ${whereClause}
  `;

  try {
    const [rows] = await pool.query(query, values);
    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch equipment:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/rent", async (req, res) => {
    const { equipmentId, newQuantity } = req.body;
  
    if (!equipmentId || newQuantity < 0) {
      return res.status(400).json({ error: "Invalid data" });
    }

  
    try {
      const [result] = await pool.query(
        "UPDATE equipment SET quantity = ? WHERE equipmentId = ?",
        [newQuantity, equipmentId]
      );
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Equipment not found" });
      }
  
      res.json({ success: true });
    } catch (err) {
      console.error("Error updating equipment:", err);
      res.status(500).json({ error: "Server error" });
    }
  });
  

  

