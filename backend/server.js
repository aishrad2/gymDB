import mysql from 'mysql2'

import dotenv from 'dotenv'
dotenv.config()

console.log('Connecting with:', {
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  host: process.env.MYSQL_HOST,
  database: process.env.MYSQL_DATABASE
});
import express from 'express'

const app = express();
app.listen(3003, () => {
    console.log("The server has started")
})

app.get('/', (req, res) => {
    res.send("Testing")
})



const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()

async function getEmployees() {
    const [rows] = await pool.query("SELECT * FROM employee")
    return rows
}

async function getEmployee(employeeId) {
    const [rows] = await pool.query(`
        SELECT * FROM employee
        WHERE employeeId = ?
        `, [employeeId])
    return rows
}

const employee = await getEmployee(1)
console.log(employee)
