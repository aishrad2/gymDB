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
app.use(express.json());

//port
app.listen(3002, () => {
  console.log("The server has started")
})

app.get('/logout', async (req, res) => {
  console.log('trying to log out')
  // await pool.query(`SET SQL_SAFE_UPDATES = 0`);
  await pool.query(`
        DELETE FROM CurrentUser
        WHERE 1 = 1`)
  res.sendFile(path.join(__dirname, "../frontend/index.html"))
})

//get request to index.html
app.get('/', async (req, res) => {
  // await pool.query(`SET SQL_SAFE_UPDATES = 0`);
  // const [rows] = await pool.query(`
  //     DELETE FROM CurrentUser
  //     WHERE 1 = 1`)
  res.sendFile(path.join(__dirname, "../frontend/index.html"))
})


//Connection pool to SQL db, using mysql 2 promise version
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
}).promise()


//post request for index.html
app.post("/", encoder, async function (req, res) {
  var accountType = req.body.account
  var username = req.body.username
  var password = req.body.password
  console.log('got post request: ', accountType, username, password)
  try {
    const [rows] = await pool.query(`
            SELECT memberId AS id, password FROM member WHERE username = ?
            UNION
            SELECT employeeId AS id, password FROM employee WHERE username = ?
        `, [username, username])

    if (rows.length === 0) {
      res.redirect("/");
    }
    const userId = rows[0].id;
    const hashedPwd = rows[0].password;
    const match = await bcrypt.compare(req.body.password, hashedPwd)
    if (match) {
      const [rows] = await pool.query(`
                INSERT INTO CurrentUser (currentUserId, username)
                VALUES (?, ?)
            `, [userId, username])

      console.log('accountType: ', accountType)
      if (accountType == 1) {
        res.redirect("/user_dashboard");
      }
      else if (accountType == 2) {
        res.redirect("/employee");
      }
      else {
        res.redirect("/admin_dashboard");
      }
    }
    else {
      res.redirect("/");
    }
  } catch (error) {
    //do not take this out, its to see if theres any errors w logging in
    console.error("Login error:", error)
    res.redirect("/");
  }
})



//post request for register.html
app.post("/register", encoder, async function (req, res) {
  try {
    const { firstname, lastname, dateOfBirth: dob, username, password, account, membership, phone } = req.body;
    const hashedPwd = await bcrypt.hash(password, saltRounds)

    if (account === "1") {
      await pool.execute(`CALL new_member(?, ?, ?, ?, ?, ?)`, [firstname, lastname, dob, username, hashedPwd, membership]);
      return res.redirect("/user_dashboard");
    } else if (account === "2") {
      await pool.execute(`CALL new_employee(?, ?, ?, ?, ?, ?, ?)`, [firstname, lastname, dob, username, hashedPwd, phone, parseInt(account) - 1]);
      return res.redirect("/employee");
    } else {
      await pool.execute(`CALL new_employee(?, ?, ?, ?, ?, ?, ?)`, [firstname, lastname, dob, username, hashedPwd, phone, parseInt(account) - 1]);
      return res.redirect("/admin_dashboard");
    }
  } catch (error) {
    console.error("Registration failed: ", error)
    return res.redirect("/register")
  }

})

app.get("/welcome", function (req, res) {
  res.sendFile(path.join(__dirname, "../frontend/welcome.html"));
})

app.get("/register", function (req, res) {
  res.sendFile(path.join(__dirname, "../frontend/register.html"));
})

app.get("/admin_dashboard", function (req, res) {
  res.sendFile(path.join(__dirname, "../frontend/admin_dashboard.html"));
})

app.get("/new_equipment.html", function (req, res) {
  res.sendFile(path.join(__dirname, "../frontend/new_equipment.html"));
})

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

app.get('/user_dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/user_dashboard.html'));
});

app.get('/new_equipment.html', (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/new_equipment.html"));
});

app.get('/equipment_success.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/equipment_success.html'));
});

// Fitness Class Routes:
// router.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, "../frontend/fitnessClasses.html"))
// })

app.get('/myFitnessClasses', (req, res) => {
  console.log('Route /myFitnessClasses accessed');
  res.sendFile(path.join(__dirname, '../frontend/myFitnessClasses.html'));
});

app.get("/fitnessClasses", function (req, res) {
  res.sendFile(path.join(__dirname, "../frontend/fitnessClasses.html"));
})


// Backend Requests: 

app.get('/api/instructors', async (req, res) => {
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

app.get('/api/fitness-classes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM View_All_Fitness_Classes');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch fitness classes' });
  }
});

app.get('/api/current-user/classes', async (req, res) => {
  try {
    const [user] = await pool.query('SELECT username FROM CurrentUser');
    console.log('current user: ', user)
    const username = user[0].username;
    const [enrolledClasses] = await pool.query('CALL selectMyEnrolledClasses(?)', [username]);
    res.json(enrolledClasses[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch fitness classes' });
  }
});

app.get('/api/filter-type/:type', async (req, res) => {
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


app.get('/api/filter-instructor/:instructor', async (req, res) => {
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

app.get('/api/current-user', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT currentUserId, username FROM CurrentUser');
    console.log('rows: ', rows)
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch fitness classes' });
  }
});

app.post('/api/enroll', async (req, res) => {
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

app.delete('/api/unenroll', async (req, res) => {
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

// Employee Routes: 
// main page for employees 
app.get('/employee', async (req, res) => {
  // sending html for main page 
  res.sendFile(path.join(__dirname, '../frontend/employee.html'))
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
  // getting current logged in employee
  let currentId = await pool.query("SELECT currentUserId FROM currentuser");
  currentId = currentId[0][0].currentUserId
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
    // getting current logged in employee
    let currentId = await pool.query("SELECT currentUserId FROM currentuser");
    currentId = currentId[0][0].currentUserId
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
  // getting current logged in employee
  let currentId = await pool.query("SELECT currentUserId FROM currentuser");
  currentId = currentId[0][0].currentUserId
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

// Equipment search Routes: 

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

// Membership Routes:
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

// New Equipment Routes: 
app.get('/new_equipment', (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/new_equipment.html"))
})

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