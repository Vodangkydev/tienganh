const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://tienganh-fe.vercel.app',
  'https://tienganh-fe.vercel.app/',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or is a subdomain of allowed origins
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin === origin) return true;
      // Allow subdomains
      if (origin && origin.endsWith(allowedOrigin.replace('https://', '').replace('http://', ''))) {
        return true;
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database setup - Use in-memory database for Vercel
const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to in-memory SQLite database');
  }
});

// Static data for Vercel deployment (fallback when database fails)
const staticVocabulary = [
  { id: 1, vietnamese: 'con mèo', english: 'cat', type: 'noun', pronunciation: '/kæt/', image_url: '', difficulty: 1 },
  { id: 2, vietnamese: 'quả táo', english: 'apple', type: 'noun', pronunciation: '/ˈæpəl/', image_url: '', difficulty: 1 },
  { id: 3, vietnamese: 'màu đỏ', english: 'red', type: 'adjective', pronunciation: '/red/', image_url: '', difficulty: 1 },
  { id: 4, vietnamese: 'chạy', english: 'run', type: 'verb', pronunciation: '/rʌn/', image_url: '', difficulty: 1 },
  { id: 5, vietnamese: 'ngôi nhà', english: 'house', type: 'noun', pronunciation: '/haʊs/', image_url: '', difficulty: 1 },
  { id: 6, vietnamese: 'con chó', english: 'dog', type: 'noun', pronunciation: '/dɔːɡ/', image_url: '', difficulty: 1 },
  { id: 7, vietnamese: 'màu xanh', english: 'blue', type: 'adjective', pronunciation: '/bluː/', image_url: '', difficulty: 1 },
  { id: 8, vietnamese: 'đi bộ', english: 'walk', type: 'verb', pronunciation: '/wɔːk/', image_url: '', difficulty: 1 },
  { id: 9, vietnamese: 'xin chào', english: 'hello', type: 'greeting', pronunciation: '/həˈloʊ/', image_url: '', difficulty: 1 }
];

let vocabularyData = [...staticVocabulary];
let userProgressData = [];

// Initialize database
const initializeDatabase = () => {
  db.serialize(() => {
    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        console.log('Users table ready');
      }
    });

    // Create vocabulary table (now with user_id)
    db.run(`CREATE TABLE IF NOT EXISTS vocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      vietnamese TEXT NOT NULL,
      english TEXT NOT NULL,
      type TEXT NOT NULL,
      pronunciation TEXT,
      image_url TEXT,
      difficulty INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
      if (err) {
        console.error('Error creating vocabulary table:', err);
      } else {
        console.log('Vocabulary table ready');
      }
    });

    // Create user_progress table
    db.run(`CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word_id INTEGER,
      user_id INTEGER,
      is_correct BOOLEAN,
      is_nearly_correct BOOLEAN,
      attempt_count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (word_id) REFERENCES vocabulary (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
      if (err) {
        console.error('Error creating user_progress table:', err);
      } else {
        console.log('User progress table ready');
      }
    });

    // Create default admin user
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`, 
      ['admin', defaultPassword], (err) => {
        if (err) {
          console.error('Error creating default user:', err);
        } else {
          console.log('Default admin user created (username: admin, password: admin123)');
        }
      }
    );
  });
};

// Initialize database after connection
initializeDatabase();

// Middleware to ensure database is initialized on each request (for Vercel serverless)
app.use((req, res, next) => {
  // Check if tables exist, if not, initialize
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='vocabulary'", (err, row) => {
    if (err || !row) {
      console.log('Reinitializing database for request');
      initializeDatabase();
    }
    next();
  });
});

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Utility function to calculate similarity
const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Routes

// User Registration (username only)
app.post('/api/register', (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long' });
  }

  // Check if username already exists
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Create user with empty password (not used for authentication)
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', 
      [username, ''], 
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        const token = jwt.sign({ userId: this.lastID, username }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ 
          message: 'User registered successfully', 
          token,
          user: { id: this.lastID, username }
        });
      }
    );
  });
});

// User Login (username only)
app.post('/api/login', (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ 
      message: 'Login successful', 
      token,
      user: { id: user.id, username: user.username }
    });
  });
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
  res.json({ 
    user: { 
      id: req.user.userId, 
      username: req.user.username 
    } 
  });
});

// Get all vocabulary words for authenticated user
app.get('/api/vocabulary', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  db.all('SELECT * FROM vocabulary WHERE user_id = ? ORDER BY id ASC', [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching vocabulary from database:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows || []);
  });
});

// Get random vocabulary word for authenticated user
app.get('/api/vocabulary/random', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  db.get('SELECT * FROM vocabulary WHERE user_id = ? ORDER BY RANDOM() LIMIT 1', [userId], (err, row) => {
    if (err) {
      console.error('Error fetching random word from database:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'No vocabulary words found for this user' });
    }
    
    res.json(row);
  });
});

// Check answer for authenticated user
app.post('/api/check-answer', authenticateToken, (req, res) => {
  const { wordId, userAnswer, languageMode = 'vietnamese' } = req.body;
  const userId = req.user.userId;
  
  if (!wordId || !userAnswer) {
    return res.status(400).json({ error: 'Missing wordId or userAnswer' });
  }

  // Check if the word belongs to the authenticated user
  db.get('SELECT * FROM vocabulary WHERE id = ? AND user_id = ?', [wordId, userId], (err, word) => {
    if (err) {
      console.error('Error fetching word from database:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!word) {
      return res.status(404).json({ error: 'Word not found or does not belong to user' });
    }

    const userAnswerLower = userAnswer.toLowerCase().trim();
    
    // Determine correct answer based on language mode
    let correctAnswer, correctAnswerLower;
    if (languageMode === 'vietnamese') {
      // VN→EN mode: user should answer in English
      correctAnswer = word.english;
      correctAnswerLower = word.english.toLowerCase().trim();
    } else {
      // EN→VN mode: user should answer in Vietnamese
      correctAnswer = word.vietnamese;
      correctAnswerLower = word.vietnamese.toLowerCase().trim();
    }
    
    let result = 'incorrect';
    let similarity = 0;

    if (userAnswerLower === correctAnswerLower) {
      result = 'correct';
      similarity = 1;
    } else {
      similarity = calculateSimilarity(userAnswerLower, correctAnswerLower);
      if (similarity >= 0.6) {
        result = 'nearly-correct';
      }
    }

    // Save progress (try database, fallback to memory)
    const isCorrect = result === 'correct';
    const isNearlyCorrect = result === 'nearly-correct';
    
    db.run(
      'INSERT INTO user_progress (word_id, user_id, is_correct, is_nearly_correct, attempt_count) VALUES (?, ?, ?, ?, ?)',
      [wordId, userId, isCorrect, isNearlyCorrect, 1],
      function(err) {
        if (err) {
          console.error('Error saving progress to database:', err);
          return res.status(500).json({ error: 'Database error' });
        }
      }
    );

    res.json({
      result,
      similarity,
      correctAnswer: correctAnswer,
      pronunciation: word.pronunciation,
      word: word,
      languageMode: languageMode
    });
  });
});

// Get user statistics for authenticated user
app.get('/api/stats', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  db.all(
    'SELECT is_correct, is_nearly_correct FROM user_progress WHERE user_id = ?',
    [userId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      const stats = {
        total: rows.length,
        correct: rows.filter(row => row.is_correct).length,
        nearlyCorrect: rows.filter(row => row.is_nearly_correct).length,
        incorrect: rows.filter(row => !row.is_correct && !row.is_nearly_correct).length
      };

      res.json(stats);
    }
  );
});

// Add new vocabulary word for authenticated user
app.post('/api/vocabulary', authenticateToken, (req, res) => {
  const { vietnamese, english, type, pronunciation, image_url, difficulty } = req.body;
  const userId = req.user.userId;
  
  if (!vietnamese || !english || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    'INSERT INTO vocabulary (user_id, vietnamese, english, type, pronunciation, image_url, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, vietnamese, english, type, pronunciation || '', image_url || '', difficulty || 1],
    function(err) {
      if (err) {
        console.error('Error adding word to database:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, message: 'Word added successfully' });
    }
  );
});

// Delete vocabulary word by ID for authenticated user
app.delete('/api/vocabulary/:id', authenticateToken, (req, res) => {
  const wordId = req.params.id;
  const userId = req.user.userId;
  
  if (!wordId) {
    return res.status(400).json({ error: 'Missing word ID' });
  }

  // First delete related user progress records
  db.run(
    'DELETE FROM user_progress WHERE word_id = ? AND user_id = ?',
    [wordId, userId],
    function(err) {
      if (err) {
        console.error('Error deleting user progress:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Then delete the vocabulary word
      db.run(
        'DELETE FROM vocabulary WHERE id = ? AND user_id = ?',
        [wordId, userId],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Word not found or does not belong to user' });
          }
          
          res.json({ message: 'Word deleted successfully', deletedRows: this.changes });
        }
      );
    }
  );
});

// Delete all vocabulary words for authenticated user (bulk delete)
app.delete('/api/vocabulary', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  console.log('Bulk delete request received for user:', userId);
  
  try {
    // First delete all user progress records for this user
    db.run(
      'DELETE FROM user_progress WHERE user_id = ?',
      [userId],
      function(err) {
        if (err) {
          console.error('Error deleting user progress:', err);
          return res.status(500).json({ error: 'Database error' });
        } else {
          console.log(`Deleted ${this.changes} user progress records`);
        }
        
        // Then delete all vocabulary words for this user
        db.run(
          'DELETE FROM vocabulary WHERE user_id = ?',
          [userId],
          function(err) {
            if (err) {
              console.error('Error deleting vocabulary:', err);
              res.status(500).json({ error: 'Failed to delete vocabulary: ' + err.message });
              return;
            }
            
            console.log(`Deleted ${this.changes} vocabulary words`);
            res.json({ 
              message: 'All vocabulary words deleted successfully', 
              deletedRows: this.changes 
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Get hint for word for authenticated user
app.get('/api/hint/:wordId', authenticateToken, (req, res) => {
  const wordId = req.params.wordId;
  const userId = req.user.userId;
  
  db.get('SELECT * FROM vocabulary WHERE id = ? AND user_id = ?', [wordId, userId], (err, word) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!word) {
      return res.status(404).json({ error: 'Word not found or does not belong to user' });
    }

    // Generate smart hint based on word length
    const englishWord = word.english.toLowerCase();
    let hint = '';
    
    if (englishWord.length <= 3) {
      // For short words (1-3 letters), show first letter
      hint = englishWord.charAt(0) + '_'.repeat(englishWord.length - 1);
    } else if (englishWord.length <= 6) {
      // For medium words (4-6 letters), show first 2 letters
      hint = englishWord.substring(0, 2) + '_'.repeat(englishWord.length - 2);
    } else {
      // For long words (7+ letters), show first 3 letters
      hint = englishWord.substring(0, 3) + '_'.repeat(englishWord.length - 3);
    }

    res.json({
      hint,
      wordLength: englishWord.length,
      pronunciation: word.pronunciation
    });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  // Check database connection
  db.get('SELECT 1 as test', (err, row) => {
    if (err) {
      console.error('Database health check failed:', err);
      return res.status(500).json({ 
        status: 'ERROR', 
        timestamp: new Date().toISOString(),
        database: 'FAILED',
        error: err.message,
        allowedOrigins: allowedOrigins,
        origin: req.headers.origin
      });
    }
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'CONNECTED',
      allowedOrigins: allowedOrigins,
      origin: req.headers.origin
    });
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API available at http://localhost:${PORT}/api`);
});

// Reset user stats for authenticated user
app.delete('/api/stats', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  db.run(
    'DELETE FROM user_progress WHERE user_id = ?',
    [userId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Stats reset successfully', deletedRows: this.changes });
    }
  );
});

// Reset user data (for development/testing)
app.post('/api/reset-user-data', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  console.log('User data reset request received for user:', userId);
  
  try {
    db.serialize(() => {
      // Delete all user progress records
      db.run('DELETE FROM user_progress WHERE user_id = ?', [userId], (err) => {
        if (err) {
          console.error('Error deleting user progress:', err);
        }
      });
      
      // Delete all vocabulary words for this user
      db.run('DELETE FROM vocabulary WHERE user_id = ?', [userId], (err) => {
        if (err) {
          console.error('Error deleting vocabulary:', err);
          return res.status(500).json({ error: err.message });
        }
        
        // Add some sample words for this user
        const sampleWords = [
          [userId, 'con mèo', 'cat', 'noun', '/kæt/', '', 1],
          [userId, 'quả táo', 'apple', 'noun', '/ˈæpəl/', '', 1],
          [userId, 'màu đỏ', 'red', 'adjective', '/red/', '', 1],
          [userId, 'chạy', 'run', 'verb', '/rʌn/', '', 1],
          [userId, 'ngôi nhà', 'house', 'noun', '/haʊs/', '', 1],
          [userId, 'con chó', 'dog', 'noun', '/dɔːɡ/', '', 1],
          [userId, 'màu xanh', 'blue', 'adjective', '/bluː/', '', 1],
          [userId, 'đi bộ', 'walk', 'verb', '/wɔːk/', '', 1],
          [userId, 'xin chào', 'hello', 'greeting', '/həˈloʊ/', '', 1]
        ];

        const stmt = db.prepare(`INSERT INTO vocabulary (user_id, vietnamese, english, type, pronunciation, image_url, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        sampleWords.forEach(word => {
          stmt.run(word, (err) => {
            if (err) {
              console.error('Error inserting sample word:', err);
            }
          });
        });
        stmt.finalize((err) => {
          if (err) {
            console.error('Error finalizing statement:', err);
          } else {
            console.log('Sample data inserted for user');
          }
        });
        
        res.json({ message: 'User data reset successfully' });
      });
    });
  } catch (error) {
    console.error('Error in reset user data:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('📦 Database connection closed.');
    process.exit(0);
  });
});
