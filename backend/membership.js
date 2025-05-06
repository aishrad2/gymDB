import express from 'express';
import mysql from 'mysql2';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize dotenv
dotenv.config();


const app = express();
const port = 3002; //port nuumber

// Set up __dirname 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));


app.use(cors()); //allows to use accross different ports 
app.use(bodyParser.json());



// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
//MYSQL set=up
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
}).promise()
//membership management page 
app.get('/membershipManagement', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/membershipManagement.html'));
});

// GET all memberships
app.get('/api/memberships', async (req, res) => {
  try {
    // Fetch data from the database
    const [rows] = await pool.query('SELECT * FROM Membership');

    // Hardcoded memberships data
    /* const memberships = [
       { membershipId: 1, membershipName: 'Gold', fee: 30, membershipDescription: 'Premium membership' },
       { membershipId: 2, membershipName: 'Silver', fee: 20, membershipDescription: 'Basic membership' }
     ]; */


    const allMemberships = [...rows];

    // Send combined data as response
    res.json(allMemberships);
  } catch (error) {
    console.error('Error fetching memberships:', error);
    res.status(500).json({ error: 'Error fetching memberships' });  // Error handling
  }
});
app.use(express.static(path.join(__dirname, '../frontend')));

// ADD a membership
app.post('/api/memberships', async (req, res) => {
  const { membershipName, fee, membershipDescription } = req.body
  try {
    await pool.query(
      `INSERT INTO Membership (membershipName, fee, membershipDescription) VALUES (?, ?, ?)`,
      [membershipName, fee, membershipDescription]
    )
    res.status(201).json({ message: 'Membership added successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// UPDATE a membership
app.put('/api/memberships/:id', async (req, res) => {
  const { id } = req.params
  const { membershipName, fee, membershipDescription } = req.body
  try {
    await pool.query(
      `UPDATE Membership SET membershipName = ?, fee = ?, membershipDescription = ? WHERE membershipId = ?`,
      [membershipName, fee, membershipDescription, id]
    )
    res.json({ message: 'Membership updated successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE a membership
app.delete('/api/memberships/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pool.query(`DELETE FROM Membership WHERE membershipId = ?`, [id])
    res.json({ message: 'Membership deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET a member's membership
app.get('/api/members/:id/membership', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT m.membershipId, ms.membershipName, ms.fee, ms.membershipDescription
       FROM Member m
       LEFT JOIN Membership ms ON m.membershipId = ms.membershipId
       WHERE m.memberId = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Member does not have membership.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching member membership:', err);
    res.status(500).json({ error: err.message });
  }
});


// UPDATE a member's membership (change membershipId)
app.put('/api/members/:id/membership', async (req, res) => {
  const { id } = req.params;
  const { membershipId } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE Member SET membershipId = ? WHERE memberId = ?`,
      [membershipId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    res.json({ message: 'Membership updated.' });
  } catch (err) {
    console.error('Error updating member membership:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE a member's membership (set membershipId to NULL)
app.delete('/api/members/:id/membership', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      `UPDATE Member SET membershipId = NULL WHERE memberId = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    res.json({ message: 'Membership removed.' });
  } catch (err) {
    console.error('Error deleting member membership:', err);
    res.status(500).json({ error: err.message });
  }
});
//getting the current User's membership infromation
app.get('/api/current-user/membership', async (req, res) => {
  try {
    const [currentUserRows] = await pool.query(`SELECT username FROM CurrentUser LIMIT 1`); //only one current user at a time
    if (currentUserRows.length === 0) {
      return res.status(404).json({ error: 'No current user found' });
    }

    const username = currentUserRows[0].username;

    const [membershipRows] = await pool.query(
      `SELECT ms.membershipName, ms.fee, ms.membershipDescription
       FROM Member m
       JOIN Membership ms ON m.membershipId = ms.membershipId
       WHERE m.username = ?`,
      [username]
    );

    if (membershipRows.length === 0) {
      return res.status(404).json({ error: 'Membership not found .' });
    }

    res.json(membershipRows[0]);
  } catch (err) {
    console.error('Error fetching current user membership:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific membership by ID
app.get('/api/memberships/:id', async (req, res) => {
  const { id } = req.params;
  try {

    const [rows] = await pool.query('SELECT * FROM Membership WHERE membershipId = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Membership not found.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching membership:', err);
    res.status(500).json({ error: 'Error fetching membership.' });
  }
});

//Update current user's membership
app.put('/api/current-user/membership', async (req, res) => {
  const { membershipId } = req.body;

  try {
    // get the current user from current user table
    const [currentUserRows] = await pool.query('SELECT username FROM CurrentUser LIMIT 1');
    if (currentUserRows.length === 0) {
      return res.status(404).json({ error: 'No current user found' });
    }
    const username = currentUserRows[0].username;

    // Find the memberId based on the username from the Member table
    const [memberRows] = await pool.query('SELECT memberId FROM Member WHERE username = ?', [username]);
    if (memberRows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    const memberId = memberRows[0].memberId;

    // Update the membershipId for the member
    const [result] = await pool.query(
      'UPDATE Member SET membershipId = ? WHERE memberId = ?',
      [membershipId, memberId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Failed to update membership' });
    }

    res.json({ message: 'Membership updated successfully.' });
  } catch (error) {
    console.error('Error updating current user membership:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//Delete the current user's membership

app.delete('/api/current-user/membership', async (req, res) => {
  try {

    const [currentUserRows] = await pool.query('SELECT username FROM CurrentUser LIMIT 1');
    if (currentUserRows.length === 0) {
      return res.status(404).json({ error: 'No current user found' });
    }
    const username = currentUserRows[0].username;


    const [memberRows] = await pool.query('SELECT memberId FROM Member WHERE username = ?', [username]);
    if (memberRows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    const memberId = memberRows[0].memberId;

    // Set the membershipId to NULL 
    const [result] = await pool.query('UPDATE Member SET membershipId = NULL WHERE memberId = ?', [memberId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Failed to delete membership' });
    }

    res.json({ message: 'Membership successfully canceled.' });
  } catch (error) {
    console.error('Error deleting current user membership:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
