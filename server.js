const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your-secret-key-2810'; // Use environment variable in production
const app = express();




app.use(express.json());
app.use(cors());
app.use(express.json()); // For JSON bodies
app.use(express.urlencoded({ extended: true })); // For URL-encoded bodies
app.use('/photos/profile_photos', express.static(path.join(__dirname, 'photos/profile_photos')));

// Configure file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'photos/profile_photos');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = uuidv4() + path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Database connection pool (update with your credentials)
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '2810',
  database: 'cspit',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Registration endpoint with file upload
app.post('/register', upload.single('profilePhoto'), async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const profilePhoto = req.file ? req.file.path : null;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash, profile_photo) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, profilePhoto]
    );
    
    res.status(201).json({ 
      message: 'User created successfully',
      userId: result.insertId
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// Modified login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt with:', { email }); // Add logging
    
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (rows.length === 0) {
      console.log('No user found with email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      console.log('Password mismatch for user:', user.id);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // In login endpoint
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    console.log('Successful login for user:', user.id);
    res.json({ 
      message: 'Login successful',
      token: token, // Add this line
      userId: user.id,
      username: user.username,
      profilePhoto: user.profile_photo
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});



// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const [user] = await pool.execute('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    if (!user[0]) return res.sendStatus(403);
    req.user = user[0];
    next();
  } catch (err) {
    console.error('JWT error:', err);
    res.sendStatus(403);
  }
};

// Profile endpoint
app.get('/profile', authenticateToken, async (req, res) => {
  res.json({
    userId: req.user.id,
    username: req.user.username,
    email: req.user.email,
    profilePhoto: req.user.profile_photo || null
  });
});


// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
});