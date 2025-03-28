const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const fs=require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your-secret-key-2810'; // Use environment variable in production
const app = express();


app.use(express.json());
app.use(cors());
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

app.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories');
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Modified registration endpoint with transaction
app.post('/register', upload.single('profilePhoto'), async (req, res) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const { username, email, password } = req.body;
    const profilePhoto = req.file?.path || null;

    // Parse categories from comma-separated string to array
    const categories = req.body.categories 
      ? req.body.categories.split(',').map(c => {
          const id = parseInt(c, 10);
          if (isNaN(id)) throw new Error(`Invalid category ID: ${c}`);
          return id;
        })
      : [];

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user
    const [userResult] = await connection.execute(
      'INSERT INTO users (username, email, password_hash, profile_photo) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, profilePhoto]
    );
    
    // Insert categories using batch query
    if (categories.length > 0) {
      const categoryValues = categories.map(categoryId => [userResult.insertId, categoryId]);
      
      await connection.query(
        'INSERT INTO user_categories (id, category_id) VALUES ?',
        [categoryValues]
      );
    }

    await connection.commit();
    res.status(201).json({ 
      message: 'User created successfully',
      userId: userResult.insertId
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  } finally {
    connection.release();
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


app.get('/user/:userId/categories', authenticateToken, async (req, res) => {
  try {
    // Verify requested user matches token's user
    if (req.params.userId != req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const [categories] = await pool.execute(`
      SELECT c.category_id, c.name 
      FROM user_categories uc
      JOIN categories c ON uc.category_id = c.category_id
      WHERE uc.id = ?
    `, [req.params.userId]);

    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});


// BLOGS POSTING AND RETREIVAL


app.post('/posts', authenticateToken, async (req, res) => {
  let connection;
  try {
    // Destructure with a default empty array for categories
    const { title, content, categories = [] } = req.body;
    
    // Debug logs to ensure all values are defined
    console.log("Received post data:", { title, content, categories });
    console.log("Authenticated user id:", req.user && req.user.id);
    
    // Validate required fields
    if (!req.user || typeof req.user.id === 'undefined' || !title || !content) {
      return res.status(400).json({ error: "Missing required fields or user not authenticated" });
    }
    
    // Acquire a connection and begin a transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Insert the post (only user_id, title, and content)
    const [result] = await connection.execute(
      'INSERT INTO post (user_id, title, content) VALUES (?, ?, ?)',
      [req.user.id, title, content]
    );
    const postId = result.insertId;
    
    // Process categories: they might be numbers or objects with properties "category_id" or "id"
    if (Array.isArray(categories) && categories.length > 0) {
      const values = categories
        .map(cat => {
          let categoryId;
          if (typeof cat === 'object' && cat !== null) {
            // Extract from object: try "category_id", then "id"
            categoryId = cat.category_id || cat.id;
          } else {
            // Assume it's already a number
            categoryId = cat;
          }
          return [postId, categoryId];
        })
        // Filter out any pairs where the categoryId is undefined
        .filter(pair => typeof pair[1] !== 'undefined');
      
      // Only perform insertion if there's at least one valid category ID
      if (values.length > 0) {
        await connection.query(
          'INSERT INTO post_categories (post_id, category_id) VALUES ?',
          [values]
        );
      }
    }
    
    await connection.commit();
    res.status(201).json({ message: "Post created successfully", postId });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error creating post:", error);
    res.status(500).json({ error: error.message || "Failed to create post" });
  } finally {
    if (connection) connection.release();
  }
});





// Get user's posts endpoint
app.get('/posts', authenticateToken, async (req, res) => {
  try {
    const [posts] = await pool.execute(`
      SELECT p.post_id, p.title, p.content, p.created_at, 
      GROUP_CONCAT(c.name) AS categories
      FROM post p 
      LEFT JOIN post_categories pc ON p.post_id = pc.post_id 
      LEFT JOIN categories c ON pc.category_id = c.category_id 
      WHERE p.user_id = ? 
      GROUP BY p.post_id 
      ORDER BY p.created_at DESC;

    `, [req.user.id]);

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});


// INTERACTION WITH THE POSTS

// GET /posts/:post_id - Get full details of a post
app.get('/posts/:post_id', authenticateToken, async (req, res) => {
  try {
    const { post_id } = req.params;
    // Get post details with author and categories, plus like count.
    const [posts] = await pool.execute(`
      SELECT 
        p.post_id, p.title, p.content, p.created_at,
        u.username, u.profile_photo,
        GROUP_CONCAT(DISTINCT c.name) AS categories,
        (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id) AS like_count
      FROM post p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN post_categories pc ON p.post_id = pc.post_id
      LEFT JOIN categories c ON pc.category_id = c.category_id
      WHERE p.post_id = ?
      GROUP BY p.post_id, u.username, u.profile_photo
    `, [post_id]);

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get comments for the post with commenter info
    const [comments] = await pool.execute(`
      SELECT com.comment_id, com.content, com.created_at, u.username, u.profile_photo
      FROM comments com
      JOIN users u ON com.id = u.id
      WHERE com.post_id = ?
      ORDER BY com.created_at ASC
    `, [post_id]);

    const postDetails = posts[0];
    postDetails.comments = comments;
    
    res.json(postDetails);
  } catch (error) {
    console.error('Error fetching post details:', error);
    res.status(500).json({ error: 'Failed to fetch post details' });
  }
});

// POST /posts/:post_id/like - Like a post (only one like per user)
app.post('/posts/:post_id/like', authenticateToken, async (req, res) => {
  try {
    const { post_id } = req.params;
    const user_id = req.user.id;
    
    // Check if the user already liked the post
    const [existing] = await pool.execute(
      'SELECT * FROM post_likes WHERE post_id = ? AND id = ?',
      [post_id, user_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already liked' });
    }
    
    await pool.execute(
      'INSERT INTO post_likes (post_id, id) VALUES (?, ?)',
      [post_id, user_id]
    );
    
    res.status(201).json({ message: 'Post liked successfully' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// POST /posts/:post_id/comment - Comment on a post
app.post('/posts/:post_id/comment', authenticateToken, async (req, res) => {
  try {
    const { post_id } = req.params;
    const { comment } = req.body;
    const user_id = req.user.id;

    if (!comment) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }

    const [result] = await pool.execute(
      'INSERT INTO comments (post_id, id, content) VALUES (?, ?, ?)',
      [post_id, user_id, comment]
    );

    res.status(201).json({ message: 'Comment added successfully', comment_id: result.insertId });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});



// GET /feed - Retrieve all posts for the feed
app.get('/feed', authenticateToken, async (req, res) => {
  try {
    const [posts] = await pool.execute(`
      SELECT
        p.post_id,
        p.title,
        p.created_at,
        u.username,
        u.profile_photo,
        (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id) AS like_count,
        (SELECT COUNT(*) FROM comments com WHERE com.post_id = p.post_id) AS comment_count
      FROM post p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    
    res.json(posts);
  } catch (error) {
    console.error('Error fetching feed posts:', error);
    res.status(500).json({ error: 'Failed to fetch feed posts' });
  }
});




// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
});