
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const port = 3000;

// MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'fahadpathan',
  password: '123',
  database: 'taskwizard'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL database.');
  }
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the registration page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});
// Handle registration form submission
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  // Check if the username is already taken
  connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) {
      console.error('Error retrieving user:', err);
      res.sendStatus(500);
    } else {
      if (results.length > 0) {
        res.status(409).send('Username already taken.');
      } else {
        // Hash the password
        bcrypt.hash(password, 10, (err, hashedPassword) => {
          if (err) {
            console.error('Error hashing password:', err);
            res.sendStatus(500);
          } else {
            // Store the user in the database
            connection.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
              if (err) {
                console.error('Error registering user:', err);
                res.sendStatus(500);
              } else {
                // Generate a JWT
                const token = jwt.sign({ username: username }, 'your_secret_key');

                // Send the token and success message
                res.json({ token, message: 'Registration successful!' });
              }
            });
          }
        });
      }
    }
  });
});

// Serve the login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Handle login form submission
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Retrieve the user from the database
  connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) {
      console.error('Error retrieving user:', err);
      res.sendStatus(500);
    } else {
      if (results.length === 0) {
        res.status(401).send('Invalid username or password.');
      } else {
        const user = results[0];

        // Compare the password with the stored hashed password
        bcrypt.compare(password, user.password, (err, passwordMatch) => {
          if (err) {
            console.error('Error comparing passwords:', err);
            res.sendStatus(500);
          } else if (!passwordMatch) {
            res.status(401).send('Invalid username or password.');
          } else {
            // Generate a JWT
            const token = jwt.sign({ userId: user.id, username: user.username }, 'your_secret_key');
            res.json({ token, message: 'Login successful!' });
          }
        });
      }
    }
  });
});

// Authorization middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, 'your_secret_key', (err, user) => {
    if (err) {
      console.error('Error verifying token:', err);
      return res.sendStatus(403);
    }

    req.user = user;
    next();
  });
}

// Protected route - Fetch tasks
app.get('/tasks', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  connection.query('SELECT * FROM tasks WHERE user_id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Error retrieving tasks:', err);
      res.sendStatus(500);
    } else {
      res.json(results);
    }
  });
});
// Protected route - Add a task
app.post('/tasks', authenticateToken, (req, res) => {

  const userId = req.user.userId;
  const task = req.body.task;
console.log(userId);
  connection.query('INSERT INTO tasks (task, user_id) VALUES (?, ?)', [task, userId], (err) => {
    if (err) {
      console.error('Error adding task:', err);
      res.sendStatus(500);
    } else {
      res.sendStatus(201);
    }
  });
});


// Protected route - Update a task
app.put('/tasks/:id', authenticateToken, (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.userId;
  const task = req.body.task;

  connection.query('UPDATE tasks SET task = ? WHERE id = ? AND user_id = ?', [task, taskId, userId], (err) => {
    if (err) {
      console.error('Error updating task:', err);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
});

// Protected route - Delete a task
app.delete('/tasks/:id', authenticateToken, (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.userId;

  connection.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId], (err) => {
    if (err) {
      console.error('Error deleting task:', err);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});