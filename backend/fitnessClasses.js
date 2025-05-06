import mysql from 'mysql2'
dotenv.config()
import dotenv from 'dotenv'
import express, { Router } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import bodyParser from 'body-parser'
import bcrypt from 'bcrypt'
const saltRounds = 10;
const router = express.Router();

//encoder to parse input data from html
const encoder = bodyParser.urlencoded()

//env file configuration
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express();
// app.use('/fitnessClasses', router);
app.use(express.json());
app.use("/assets", express.static(path.join(__dirname, "../frontend/assets")))
//port
app.listen(3002, () => {
    console.log("The server has started")
})


// Frontend Requests:

//get request to index.html
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/fitnessClasses.html"))
})

router.get('/myFitnessClasses', (req, res) => {
    console.log('Route /myFitnessClasses accessed');
    res.sendFile(path.join(__dirname, '../frontend/myFitnessClasses.html'));
});

router.get("/fitnessClasses", function (req, res) {
    res.sendFile(path.join(__dirname, "../frontend/fitnessClasses.html"));
})


// Backend Requests: 

//Connection pool to SQL db, using mysql 2 promise version
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()
router.get('/api/instructors', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT firstName, lastName
        FROM gymDB.Employee
        JOIN Employee_Role ON Employee.employeeId = Employee_Role.employeeId
        JOIN Role ON Employee_Role.roleId = Role.roleId
        WHERE roleName = 'Instructor';
      `);
  
      const instructors = rows.map(row => ({
        name: `${row.firstName} ${row.lastName}`
      }));
  
      res.json(instructors);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  router.get('/api/fitness-classes', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM View_All_Fitness_Classes');
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch fitness classes' });
    }
  });

  router.get('/api/current-user/classes', async (req, res) => {
    try {
      const [user] = await pool.query('SELECT username FROM CurrentUser');
      const username = user[0].username;
      const [enrolledClasses] = await pool.query('CALL selectMyEnrolledClasses(?)', [username]);
      res.json(enrolledClasses[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch fitness classes' });
    }
  });

  router.get('/api/filter-type/:type', async (req, res) => {
    const type = req.params.type
    console.log('type to filter by is: ', type)
    try {
      const [rows] = await pool.query('Call filterByType(?)', [type]);
      console.log('rows: ', rows)
      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch fitness classes' });
    }
  });

    
  router.get('/api/filter-instructor/:instructor', async (req, res) => {
    const instructor = req.params.instructor
    console.log('instructor to filter by: ', instructor)
    try {
      const [rows] = await pool.query('Call filterByInstructor(?)', [instructor]);
      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch fitness classes' });
    }
  });

  router.get('/api/current-user', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT currentUserId, username FROM CurrentUser');
      console.log('rows: ', rows)
      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch fitness classes' });
    }
  });

  router.post('/api/enroll', async (req, res) => {
    const { userId, fitnessClassId } = req.body;
    console.log('trying to enroll userId, fitnessClassId: ', userId, fitnessClassId)
    try {
      await pool.execute('CALL enrollment_transaction(?, ?)', [userId, fitnessClassId]);
      return res.json({ success: true, message: 'Enrolled successfully!' });
    } catch (error) {
      console.error('Error calling stored procedure:', error);
      return res.status(400).json({ success: false, message: error.sqlMessage || error.message });
    }
  });  
  
  router.delete('/api/unenroll', async (req, res) => {
    console.log('req.body:', req.body);
    const { userId, fitnessClassId } = req.body;
    console.log('userId, fitnessClassId:', userId, fitnessClassId);
    try {
      const [results] = await pool.execute('DELETE FROM Member_FitnessClass WHERE memberId = ? AND fitnessClassId = ?', [userId, fitnessClassId]);
      console.log('results:', results);
      if (results.affectedRows > 0) {
        console.log('Unenrollment successful');
        return res.json({ success: true, message: 'Successfully unenrolled from the class.' });
      } else {
        return res.status(400).json({ success: false, message: 'No enrollment found to unenroll from.' });
      }
    } catch (error) {
      console.error('Error calling delete:', error);
      return res.status(400).json({ success: false, error: error.sqlMessage || 'Unenrollment failed.' });
    }
  });
  
  
  export default Router;
