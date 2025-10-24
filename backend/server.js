const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
  // Create vocabulary table
  db.run(`CREATE TABLE IF NOT EXISTS vocabulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vietnamese TEXT NOT NULL,
    english TEXT NOT NULL,
    type TEXT NOT NULL,
    pronunciation TEXT,
    image_url TEXT,
    difficulty INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create user_progress table
  db.run(`CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER,
    user_id TEXT,
    is_correct BOOLEAN,
    is_nearly_correct BOOLEAN,
    attempt_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (word_id) REFERENCES vocabulary (id)
  )`);

  // Insert sample data
  const sampleWords = [
    ['con mèo', 'cat', 'noun', '/kæt/', '', 1],
    ['quả táo', 'apple', 'noun', '/ˈæpəl/', '', 1],
    ['màu đỏ', 'red', 'adjective', '/red/', '', 1],
    ['chạy', 'run', 'verb', '/rʌn/', '', 1],
    ['ngôi nhà', 'house', 'noun', '/haʊs/', '', 1],
    ['con chó', 'dog', 'noun', '/dɔːɡ/', '', 1],
    ['màu xanh', 'blue', 'adjective', '/bluː/', '', 1],
    ['đi bộ', 'walk', 'verb', '/wɔːk/', '', 1]
  ];

  const stmt = db.prepare(`INSERT OR IGNORE INTO vocabulary (vietnamese, english, type, pronunciation, image_url, difficulty) VALUES (?, ?, ?, ?, ?, ?)`);
  sampleWords.forEach(word => {
    stmt.run(word);
  });
  stmt.finalize();
});

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

// Get all vocabulary words
app.get('/api/vocabulary', (req, res) => {
  db.all('SELECT * FROM vocabulary ORDER BY RANDOM()', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get random vocabulary word
app.get('/api/vocabulary/random', (req, res) => {
  db.get('SELECT * FROM vocabulary ORDER BY RANDOM() LIMIT 1', (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

// Check answer
app.post('/api/check-answer', (req, res) => {
  const { wordId, userAnswer, userId = 'anonymous' } = req.body;
  
  if (!wordId || !userAnswer) {
    return res.status(400).json({ error: 'Missing wordId or userAnswer' });
  }

  db.get('SELECT * FROM vocabulary WHERE id = ?', [wordId], (err, word) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!word) {
      return res.status(404).json({ error: 'Word not found' });
    }

    const userAnswerLower = userAnswer.toLowerCase().trim();
    const correctAnswerLower = word.english.toLowerCase().trim();
    
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

    // Save progress
    const isCorrect = result === 'correct';
    const isNearlyCorrect = result === 'nearly-correct';
    
    db.run(
      'INSERT INTO user_progress (word_id, user_id, is_correct, is_nearly_correct, attempt_count) VALUES (?, ?, ?, ?, ?)',
      [wordId, userId, isCorrect, isNearlyCorrect, 1],
      function(err) {
        if (err) {
          console.error('Error saving progress:', err);
        }
      }
    );

    res.json({
      result,
      similarity,
      correctAnswer: word.english,
      pronunciation: word.pronunciation,
      word: word
    });
  });
});

// Get user statistics
app.get('/api/stats/:userId', (req, res) => {
  const userId = req.params.userId;
  
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

// Add new vocabulary word
app.post('/api/vocabulary', (req, res) => {
  const { vietnamese, english, type, pronunciation, image_url, difficulty } = req.body;
  
  if (!vietnamese || !english || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    'INSERT INTO vocabulary (vietnamese, english, type, pronunciation, image_url, difficulty) VALUES (?, ?, ?, ?, ?, ?)',
    [vietnamese, english, type, pronunciation || '', image_url || '', difficulty || 1],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Word added successfully' });
    }
  );
});

// Delete vocabulary word by ID
app.delete('/api/vocabulary/:id', (req, res) => {
  const wordId = req.params.id;
  
  if (!wordId) {
    return res.status(400).json({ error: 'Missing word ID' });
  }

  db.run(
    'DELETE FROM vocabulary WHERE id = ?',
    [wordId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Word not found' });
      }
      
      res.json({ message: 'Word deleted successfully', deletedRows: this.changes });
    }
  );
});

// Get hint for word (partial reveal)
app.get('/api/hint/:wordId', (req, res) => {
  const wordId = req.params.wordId;
  
  db.get('SELECT * FROM vocabulary WHERE id = ?', [wordId], (err, word) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!word) {
      return res.status(404).json({ error: 'Word not found' });
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
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API available at http://localhost:${PORT}/api`);
  });
}

// Export for Vercel
module.exports = app;

// Reset user stats
app.delete('/api/stats/:userId', (req, res) => {
  const userId = req.params.userId;
  
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
