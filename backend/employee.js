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

// main page for employees 
app.get('/employee', async (req, res) => {
    // sending html for main page 
    res.sendFile(path.join(__dirname, '../frontend/employee.html'))
    // getting current logged in employee
    currentId = await pool.query("SELECT currentUserId FROM currentuser");
    currentId = currentId[0][0].currentUserId
    console.log(currentId)
})

// profile page for employees
app.get('/employeeProfile', (req, res) => {
    // sending html for profile page
    res.sendFile(path.join(__dirname, '../frontend/employeeProfile.html'))
})

// getting page for adding a new fitness class
app.get('/employeeNewClass', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/employeeNewClass.html'))
})

// sending classes page 
app.get('/employeeClasses', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/employeeClasses.html'))
})

// getting all room names 
app.get('/api/roomNames', async (req, res) => {
    const rooms = await pool.query(`
        SELECT roomName FROM room`);
    res.json(rooms[0]);
})

// getting employee profile data 
app.get('/api/employeeProfile', async (req, res) => {
    // joining employee table with role table 
    const emp = await pool.query(`
        SELECT * FROM employee AS emp
        JOIN employee_role as er
        ON emp.employeeId = er.employeeId
        JOIN role AS r
        ON er.roleId = r.roleId
        WHERE emp.employeeId = ?
        `, [currentId])
    res.json(emp[0]);
})

// getting information from form for new fitness class
app.post("/api/employeeNewClass", encoder, async function (req, res) {
    try {
        const { className, classType, start, end, days, classCap, roomName } = req.body;
        // searching for roomID given roomName
        const roomID = await pool.query('SELECT roomId FROM room WHERE roomName = ?', roomName)
        // inserting into fitnessclass table
        await pool.execute(`INSERT INTO fitnessclass(fitnessClassName, fitnessClassType, startTime, endTime, fitnessClassCapacity, employeeId, roomId) 
            VALUES(?, ?, ?, ?, ?, ?, ?)`, [className, classType, start, end, classCap, currentId, roomID[0][0].roomId])
        // getting ID from inserted row in fitnessclass table
        let classId = await pool.query('SELECT LAST_INSERT_ID()');
        classId = classId[0][0]['LAST_INSERT_ID()']
        // inserting days into dependency table 
        days.forEach(async element => {
            await pool.execute('INSERT INTO fitnessclass_day(fitnessClassId, dayId) VALUES(?, ?)', [classId, parseInt(element)]);
        });
        console.log("Class added successfully!")
        return res.redirect("/employeeClasses")
    } catch (error) {
        console.log("Class add failed:", error)
        return res.redirect("/employeeNewClass")
    }

})

// getting current fitness class data 
app.get('/api/employeeClasses', async (req, res) => {
    // getting classes and rooms 
    let classes = await pool.query(`
        SELECT * FROM fitnessclass AS c
        JOIN room AS r 
        ON c.roomId = r.roomId
        WHERE employeeId = ?
        `, [currentId])
    classes = classes[0]
    res.json(classes);
})

// getting class days 
app.get('/api/classDays', async (req, res) => {
    // getting days associated with fitness class using fitnessclass_day dependency table 
    let days = await pool.query(`
        SELECT cd.fitnessClassId, d.dayName FROM fitnessclass_day AS cd
		JOIN fitnessclass AS c
        ON cd.fitnessClassId = c.fitnessClassId
        JOIN day AS d
        ON d.dayId = cd.dayId;`)
    days = days[0]
    res.json(days)
})

dotenv.config()

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()

