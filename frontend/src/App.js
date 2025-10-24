import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader, ChevronLeft, ChevronRight, RotateCcw, Plus, Eye, EyeOff, X, Settings, HelpCircle, Star, Volume2 } from 'lucide-react';
import axios from 'axios';
import './App.css';

// Compact Icons Component
const CompactIcons = {
  Checkmark: ({ size = 20, color = "#4caf50" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill={color}/>
    </svg>
  ),
  Lightbulb: ({ size = 20, color = "#ff6b6b" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" fill={color}/>
    </svg>
  ),
  MagnifyingGlass: ({ size = 20, color = "#ff6b6b" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill={color}/>
    </svg>
  ),
  Reset: ({ size = 16, color = "#dc3545" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill={color}/>
    </svg>
  ),
  Add: ({ size = 16, color = "#6c757d" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill={color}/>
    </svg>
  ),
  Delete: ({ size = 16, color = "#dc3545" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill={color}/>
    </svg>
  )
};

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [currentWord, setCurrentWord] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [wordHint, setWordHint] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [termDelimiter, setTermDelimiter] = useState('custom');
  const [entryDelimiter, setEntryDelimiter] = useState('newline');
  const [customTermDelimiter, setCustomTermDelimiter] = useState(':');
  const [customEntryDelimiter, setCustomEntryDelimiter] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [toast, setToast] = useState(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [allWords, setAllWords] = useState([]);
  const [stats, setStats] = useState({
    correct: 0,
    nearlyCorrect: 0,
    incorrect: 0,
    total: 0
  });
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [languageMode, setLanguageMode] = useState('vietnamese'); // 'vietnamese' or 'english'
  const [showSettings, setShowSettings] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [wordFilter, setWordFilter] = useState('all'); // 'all' or 'favorites'
  const [userId] = useState(() => {
    // Generate or get user ID from localStorage
    let id = localStorage.getItem('userId');
    if (!id) {
      id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', id);
    }
    return id;
  });

  // Load random word on component mount
  useEffect(() => {
    loadAllWords();
    loadUserStats();
  }, []);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Filter words based on wordFilter
  const filteredWords = wordFilter === 'favorites' 
    ? allWords.filter(word => favorites.includes(word.id))
    : allWords;

  // Update current word when wordIndex or filtered words change
  useEffect(() => {
    if (filteredWords.length > 0) {
      if (wordIndex >= filteredWords.length) {
        setWordIndex(0);
      } else {
        setCurrentWord(filteredWords[wordIndex]);
        resetWordState();
      }
    }
  }, [wordIndex, filteredWords]);

  // Reset wordIndex when filter changes
  useEffect(() => {
    setWordIndex(0);
  }, [wordFilter]);

  const loadAllWords = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/vocabulary`);
      setAllWords(response.data);
      setWordIndex(0);
    } catch (err) {
      setError('Không thể tải từ vựng. Vui lòng thử lại.');
      console.error('Error loading words:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetWordState = () => {
    setUserInput('');
    setFeedback(null);
    setIsAnswered(false);
    setShowHint(false);
    setWordHint('');
    setShowAnswer(false);
    // Giữ nguyên languageMode để người dùng có thể tiếp tục với chế độ đã chọn
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadUserStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stats/${userId}`);
      setStats(response.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const resetStats = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/stats/${userId}`);
      setStats({
        correct: 0,
        nearlyCorrect: 0,
        incorrect: 0,
        total: 0
      });
      showToast('Đã reset thống kê thành công!', 'success');
    } catch (err) {
      showToast('Không thể reset thống kê. Vui lòng thử lại.', 'error');
      console.error('Error resetting stats:', err);
    }
  };

  const deleteVocabulary = async () => {
    try {
      // Lấy danh sách từ vựng hiện tại
      const response = await axios.get(`${API_BASE_URL}/vocabulary`);
      const words = response.data;
      
      // Kiểm tra xem từ "hello" có tồn tại không
      const helloExists = words.find(w => w.english.toLowerCase() === 'hello');
      
      // Xóa tất cả từ vựng
      for (const word of words) {
        await axios.delete(`${API_BASE_URL}/vocabulary/${word.id}`);
      }
      
      // Tạo lại từ "hello" với thông tin đầy đủ
      await axios.post(`${API_BASE_URL}/vocabulary`, {
        english: 'hello',
        vietnamese: 'xin chào',
        type: 'greeting',
        pronunciation: '/həˈloʊ/',
        image_url: '',
        difficulty: 1
      });
      
      // Tải lại danh sách từ vựng
      await loadAllWords();
      showToast('Đã xóa từ vựng thành công! Chỉ còn lại từ "hello: xin chào"', 'success');
    } catch (err) {
      showToast('Không thể xóa từ vựng. Vui lòng thử lại.', 'error');
      console.error('Error deleting vocabulary:', err);
    }
  };

  const handleSubmit = async () => {
    if (!userInput.trim() || !currentWord) return;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/check-answer`, {
        wordId: currentWord.id,
        userAnswer: userInput,
        userId: userId,
        languageMode: languageMode // Thêm thông tin về chế độ ngôn ngữ
      });

      const { result, correctAnswer, pronunciation } = response.data;
      setFeedback({ result, correctAnswer, pronunciation });
      setIsAnswered(true);
      
      // Update local stats
      setStats(prev => ({
        ...prev,
        [result === 'correct' ? 'correct' : result === 'nearly-correct' ? 'nearlyCorrect' : 'incorrect']: 
          prev[result === 'correct' ? 'correct' : result === 'nearly-correct' ? 'nearlyCorrect' : 'incorrect'] + 1,
        total: prev.total + 1
      }));

      // Tự động chuyển từ tiếp theo nếu trả lời đúng và bật autoAdvance
      if (result === 'correct' && autoAdvance) {
        setTimeout(() => {
          handleNext();
        }, 1500); // Chờ 1.5 giây để người dùng thấy kết quả đúng
      }
    } catch (err) {
      setError('Không thể kiểm tra đáp án. Vui lòng thử lại.');
      console.error('Error checking answer:', err);
    }
  };

  const handleNext = () => {
    if (wordIndex < filteredWords.length - 1) {
      setWordIndex(wordIndex + 1);
    } else {
      setWordIndex(0); // Loop back to first word
    }
    // Reset word state when moving to next word
    resetWordState();
  };

  const handlePrevious = () => {
    if (wordIndex > 0) {
      setWordIndex(wordIndex - 1);
    } else {
      setWordIndex(filteredWords.length - 1); // Loop to last word
    }
    // Reset word state when moving to previous word
    resetWordState();
  };

  const handleRetry = () => {
    setUserInput('');
    setFeedback(null);
    setIsAnswered(false);
    setShowAnswer(false);
  };

  const toggleFavorite = (wordId) => {
    setFavorites(prev => {
      if (prev.includes(wordId)) {
        return prev.filter(id => id !== wordId);
      } else {
        return [...prev, wordId];
      }
    });
  };


  // Auto-detect word type based on common patterns
  const detectWordType = (englishWord) => {
    const word = englishWord.toLowerCase().trim();
    
    // Common prepositions
    const prepositions = [
      'to', 'from', 'at', 'in', 'on', 'with', 'by', 'for', 'about', 'into',
      'through', 'during', 'including', 'until', 'against', 'among', 'throughout',
      'despite', 'towards', 'upon', 'concerning', 'of', 'off', 'over', 'out',
      'below', 'above', 'up', 'down', 'between', 'behind', 'beside', 'beneath',
      'across', 'along', 'around', 'near', 'past', 'within', 'without', 'before',
      'after', 'since', 'toward', 'under', 'underneath', 'among', 'beyond'
    ];
    
    if (prepositions.includes(word)) {
      return 'preposition';
    }
    
    // Common verb endings
    if (word.endsWith('ing') || word.endsWith('ed') || word.endsWith('ize') || word.endsWith('ise')) {
      return 'verb';
    }
    
    // Common adjective endings
    if (word.endsWith('ful') || word.endsWith('less') || word.endsWith('ous') || word.endsWith('able') || word.endsWith('ible')) {
      return 'adjective';
    }
    
    // Common adverb endings
    if (word.endsWith('ly')) {
      return 'adverb';
    }
    
    // Default to noun
    return 'noun';
  };

  const parseBulkData = () => {
    if (!bulkData.trim()) {
      setPreviewData([]);
      return;
    }

    let entrySep, termSep;
    
    // Set entry delimiter
    switch (entryDelimiter) {
      case 'newline':
        entrySep = '\n';
        break;
      case 'semicolon':
        entrySep = ';';
        break;
      case 'custom':
        entrySep = customEntryDelimiter;
        break;
      default:
        entrySep = '\n';
    }

    // Set term delimiter
    switch (termDelimiter) {
      case 'tab':
        termSep = '\t';
        break;
      case 'comma':
        termSep = ',';
        break;
      case 'custom':
        termSep = customTermDelimiter;
        break;
      default:
        termSep = '\t';
    }

    const entries = bulkData.split(entrySep).filter(entry => entry.trim());
    const parsed = [];

    entries.forEach((entry, index) => {
      const parts = entry.split(termSep);
      if (parts.length >= 2) {
        const englishWord = parts[0].trim();
        parsed.push({
          id: index + 1,
          english: englishWord,
          vietnamese: parts[1].trim(),
          type: detectWordType(englishWord),
          pronunciation: '',
          image_url: '',
          difficulty: 1
        });
      }
    });

    setPreviewData(parsed);
  };

  const handleBulkImport = async () => {
    if (previewData.length === 0) {
      showToast('Không có dữ liệu để nhập!', 'warning');
      return;
    }

    try {
      for (const word of previewData) {
        await axios.post(`${API_BASE_URL}/vocabulary`, word);
      }
      
      setBulkData('');
      setPreviewData([]);
      setShowModal(false);
      loadAllWords();
      showToast(`Đã nhập thành công ${previewData.length} từ vựng!`, 'success');
    } catch (err) {
      showToast('Không thể nhập từ vựng. Vui lòng thử lại.', 'error');
      console.error('Error importing vocabulary:', err);
    }
  };

  // Update preview when data or delimiters change
  useEffect(() => {
    parseBulkData();
  }, [bulkData, termDelimiter, entryDelimiter, customTermDelimiter, customEntryDelimiter]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      if (!isAnswered) {
        handleSubmit();
      } else if (feedback?.result === 'correct' && !autoAdvance) {
        // Chỉ chuyển từ thủ công nếu không bật autoAdvance
        handleNext();
      }
    }
  };


  const toggleHint = async () => {
    if (!showHint && currentWord) {
      try {
        // Tạo gợi ý dựa trên mức độ khó và chế độ ngôn ngữ
        const targetWord = languageMode === 'vietnamese' ? currentWord.english : currentWord.vietnamese;
        const hint = generateHint(targetWord, difficulty);
        setWordHint(hint);
        setShowHint(true);
      } catch (err) {
        console.error('Error generating hint:', err);
      }
    } else {
      setShowHint(!showHint);
    }
  };

  const speakWord = (text, lang) => {
    if (!soundEnabled) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };

  const generateHint = (word, difficulty) => {
    if (!word) return '';
    
    const wordLength = word.length;
    let hint = '';
    
    switch (difficulty) {
      case 1: // Dễ - hiển thị 1-2 chữ cái đầu và cuối
        if (wordLength <= 3) {
          hint = word; // Hiển thị toàn bộ từ nếu quá ngắn
        } else if (wordLength <= 5) {
          hint = word.substring(0, 2) + '*'.repeat(wordLength - 2);
        } else {
          hint = word.substring(0, 2) + '*'.repeat(wordLength - 4) + word.substring(wordLength - 2);
        }
        break;
        
      case 2: // Trung bình - hiển thị 1 chữ cái đầu và cuối
        if (wordLength <= 2) {
          hint = word; // Hiển thị toàn bộ từ nếu quá ngắn
        } else {
          hint = word.substring(0, 1) + '*'.repeat(wordLength - 2) + word.substring(wordLength - 1);
        }
        break;
        
      case 3: // Khó - chỉ hiển thị 1 chữ cái đầu hoặc cuối
        if (wordLength <= 1) {
          hint = word;
        } else {
          // Random chọn hiển thị đầu hay cuối
          const showFirst = Math.random() < 0.5;
          if (showFirst) {
            hint = word.substring(0, 1) + '*'.repeat(wordLength - 1);
          } else {
            hint = '*'.repeat(wordLength - 1) + word.substring(wordLength - 1);
          }
        }
        break;
        
      default:
        hint = word;
    }
    
    return hint;
  };

  if (loading) {
    return (
      <div className="app">
        <header className="header">
          <h1>🎓 Học Tiếng Anh Thông Minh</h1>
          <p>Đang tải...</p>
        </header>
        <div className="vocabulary-card">
          <div className="loading">
            <Loader className="animate-spin" size={48} />
            <p>Đang tải từ vựng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <header className="header">
          <h1>🎓 Học Tiếng Anh Thông Minh</h1>
        </header>
        <div className="vocabulary-card">
          <div className="error">
            {error}
            <button 
              onClick={loadAllWords}
              style={{
                marginTop: '10px',
                padding: '10px 20px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="app">
        <header className="header">
          <h1>🎓 Học Tiếng Anh Thông Minh</h1>
        </header>
        <div className="vocabulary-card">
          <div className="error">
            Không có từ vựng nào để học.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🎓 Học Tiếng Anh Thông Minh</h1>
        <p>Luyện tập từ vựng với ☁️ nha</p>
      </header>

      <div className="vocabulary-card" style={{ position: 'relative' }}>
        {/* Header with Language Toggle */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '25px',
          paddingBottom: '20px',
          borderBottom: '2px solid rgba(102, 126, 234, 0.1)'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: isMobile ? '1.6rem' : '2.2rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                cursor: 'pointer'
              }}
              onClick={() => speakWord(languageMode === 'vietnamese' ? currentWord.vietnamese : currentWord.english, languageMode === 'vietnamese' ? 'vi-VN' : 'en-US')}
              >
                {languageMode === 'vietnamese' ? currentWord.vietnamese : currentWord.english}
              </h2>
              <button
                onClick={() => speakWord(languageMode === 'vietnamese' ? currentWord.vietnamese : currentWord.english, languageMode === 'vietnamese' ? 'vi-VN' : 'en-US')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  borderRadius: '50%',
                  color: '#667eea'
                }}
                title="Phát âm"
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(102, 126, 234, 0.1)';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <Volume2 size={20} />
              </button>
            </div>
            <div style={{ 
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div className="word-type" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                {currentWord.type}
              </div>
              <button
                onClick={() => toggleFavorite(currentWord.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}
                title={favorites.includes(currentWord.id) ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
              >
                <Star 
                  size={20} 
                  fill={favorites.includes(currentWord.id) ? '#ffc107' : 'none'}
                  color={favorites.includes(currentWord.id) ? '#ffc107' : '#9ca3af'}
                />
              </button>
            </div>
          </div>
          
          <button 
            onClick={() => setLanguageMode(languageMode === 'vietnamese' ? 'english' : 'vietnamese')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: isMobile ? '42px' : '44px',
              height: isMobile ? '42px' : '44px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontSize: isMobile ? '1.1rem' : '1.2rem',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)';
              e.target.style.transform = 'translateY(-2px) scale(1.05)';
              e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            }}
            title={languageMode === 'vietnamese' ? 'Chuyển sang chế độ EN→VN' : 'Chuyển sang chế độ VN→EN'}
          >
            🌐
          </button>
        </div>

        <div className="image-hint">
          {/* Central Hint Button - Like in the image */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '20px',
            position: 'relative'
          }}>
            <button 
              onClick={toggleHint}
              style={{
                background: showHint 
                  ? 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)'
                  : 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                border: 'none',
                cursor: 'pointer',
                color: showHint ? 'white' : '#ff6b6b',
                fontSize: isMobile ? '0.9rem' : '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: isMobile ? '10px 16px' : '12px 20px',
                borderRadius: '25px',
                transition: 'all 0.3s ease',
                fontWeight: '600',
                boxShadow: showHint 
                  ? '0 4px 15px rgba(255, 107, 107, 0.4)'
                  : '0 2px 10px rgba(255, 107, 107, 0.2)',
                transform: 'translateY(0)',
                border: '2px solid transparent',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px) scale(1.05)';
                e.target.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = showHint 
                  ? '0 4px 15px rgba(255, 107, 107, 0.4)'
                  : '0 2px 10px rgba(255, 107, 107, 0.2)';
              }}
            >
              <CompactIcons.MagnifyingGlass size={20} color={showHint ? 'white' : '#ff6b6b'} />
              {showHint ? 'Ẩn gợi ý' : 'Xem gợi ý'}
            </button>
          </div>
          
          {showHint && wordHint && (
            <div className="word-hint">
              <div className="hint-display">{wordHint}</div>
              
            </div>
          )}
        </div>

        {/* Input Section */}
        <div style={{ 
          marginBottom: '30px',
          padding: isMobile ? '15px' : '25px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(102, 126, 234, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            gap: isMobile ? '10px' : '15px',
            alignItems: 'stretch',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <input
              type="text"
              className="input-field"
              placeholder={languageMode === 'vietnamese' ? "Nhập từ tiếng Anh..." : "Nhập từ tiếng Việt..."}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isAnswered}
              style={{
                flex: 1,
                padding: isMobile ? '14px 16px' : '16px 20px',
                border: '2px solid rgba(102, 126, 234, 0.2)',
                borderRadius: isMobile ? '12px' : '16px',
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '500',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                outline: 'none',
                minHeight: isMobile ? '48px' : 'auto'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1), 0 8px 25px rgba(102, 126, 234, 0.15)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.background = 'rgba(255, 255, 255, 0.95)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.background = 'rgba(255, 255, 255, 0.9)';
              }}
            />
            <button 
              className="submit-btn"
              onClick={() => {
                if (isAnswered && feedback?.result === 'correct' && !autoAdvance) {
                  // Chỉ chuyển từ thủ công nếu không bật autoAdvance
                  handleNext();
                } else if (!isAnswered) {
                  handleSubmit();
                }
              }}
              disabled={!userInput.trim() || (isAnswered && feedback?.result !== 'correct')}
              style={{
                background: isAnswered && feedback?.result === 'correct' 
                  ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: isMobile ? '12px' : '16px',
                padding: isMobile ? '14px 20px' : '16px 24px',
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '600',
                cursor: (isAnswered && feedback?.result !== 'correct') ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                width: isMobile ? '100%' : 'auto',
                minWidth: isMobile ? 'auto' : '120px',
                minHeight: isMobile ? '48px' : 'auto',
                position: 'relative',
                overflow: 'hidden',
                opacity: (isAnswered && feedback?.result !== 'correct') ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!e.target.disabled) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.target.disabled) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }
              }}
            >
              {isAnswered && feedback?.result === 'correct' && !autoAdvance ? 'Tiếp' : 'Kiểm tra'}
            </button>
          </div>
        </div>

        {feedback && (
          <div className={`feedback ${feedback.result}`}>
            {feedback.result === 'correct' && (
              <>
                <CompactIcons.Checkmark size={24} color="#4caf50" style={{ marginRight: '10px' }} />
                Đúng rồi! 🎉
              </>
            )}
            {feedback.result === 'nearly-correct' && (
              <>
                <AlertCircle size={24} style={{ marginRight: '10px' }} />
                Gần đúng! Hãy thử lại! 💡
              </>
            )}
            {feedback.result === 'incorrect' && (
              <>
                <XCircle size={24} style={{ marginRight: '10px' }} />
                Chưa đúng. Hãy thử lại! 💪
              </>
            )}
            {feedback.pronunciation && (
              <div style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                Phát âm: <em>{feedback.pronunciation}</em>
              </div>
            )}
          </div>
        )}

        {isAnswered && (
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            {!showAnswer ? (
              <button 
                onClick={() => setShowAnswer(true)}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#ff5252'}
                onMouseLeave={(e) => e.target.style.background = '#ff6b6b'}
              >
                <Eye size={20} />
                Xem đáp án
              </button>
            ) : (
              <div style={{ 
                background: '#e8f5e8', 
                padding: '15px', 
                borderRadius: '10px', 
                textAlign: 'center',
                border: '2px solid #4caf50'
              }}>
                <strong>Đáp án đúng: {feedback.correctAnswer}</strong>
                {languageMode === 'vietnamese' && (
                  <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#666' }}>
                    ({currentWord.vietnamese})
                  </div>
                )}
                {languageMode === 'english' && (
                  <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#666' }}>
                    ({currentWord.english})
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Retry Button - Show when answered but not correct */}
        {isAnswered && feedback?.result !== 'correct' && (
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={handleRetry}
              style={{
                width: '100%',
                padding: '12px',
                background: '#ffa726',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#ff9800';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#ffa726';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <RotateCcw size={16} />
              Thử lại
            </button>
          </div>
        )}

        {/* Navigation Buttons - Only show when NOT answered */}
        {!isAnswered && (
          <div className="navigation-buttons" style={{ 
            display: 'flex', 
            gap: '20px', 
            marginTop: '20px', 
            justifyContent: 'center',
            padding: '0 20px'
          }}>
            <button 
              onClick={handlePrevious}
              className="nav-button"
              style={{
                background: 'linear-gradient(135deg, #9c27b0 0%, #8e24aa 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                fontSize: '1.2rem',
                marginRight: 'auto',
                boxShadow: '0 3px 10px rgba(156, 39, 176, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #8e24aa 0%, #7b1fa2 100%)';
                e.target.style.transform = 'translateY(-2px) scale(1.05)';
                e.target.style.boxShadow = '0 5px 15px rgba(156, 39, 176, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #9c27b0 0%, #8e24aa 100%)';
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 3px 10px rgba(156, 39, 176, 0.3)';
              }}
              title="Lùi"
            >
              ⬅️
            </button>
            
            <button 
              onClick={handleNext}
              className="nav-button"
              style={{
                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                fontSize: '1.2rem',
                marginLeft: 'auto',
                boxShadow: '0 3px 10px rgba(76, 175, 80, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #45a049 0%, #388e3c 100%)';
                e.target.style.transform = 'translateY(-2px) scale(1.05)';
                e.target.style.boxShadow = '0 5px 15px rgba(76, 175, 80, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 3px 10px rgba(76, 175, 80, 0.3)';
              }}
              title="Tiếp"
            >
              ➡️
            </button>
          </div>
        )}




        {/* Bottom Section - All controls */}
        <div style={{
          marginTop: '15px',
          paddingTop: '15px',
          borderTop: '1px solid #e2e8f0'
        }}>
          {/* Navigation Info - Center */}
          <div style={{ 
            textAlign: 'center', 
            color: '#6c757d', 
            fontSize: '0.9rem',
            fontWeight: '500',
            padding: '8px 16px',
            background: 'rgba(108, 117, 125, 0.1)',
            borderRadius: '20px',
            border: '1px solid rgba(108, 117, 125, 0.2)',
            marginBottom: '15px',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}>
            Từ {wordIndex + 1} / {filteredWords.length}
          </div>

          {/* Action Icons - Center Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '15px',
            marginBottom: '15px'
          }}>
            {/* Delete Vocabulary Icon */}
            <div 
              onClick={deleteVocabulary}
              style={{
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                background: 'rgba(255, 107, 107, 0.1)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 107, 107, 0.2)';
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 107, 107, 0.1)';
                e.target.style.transform = 'scale(1)';
              }}
              title="Xóa từ vựng"
            >
              <CompactIcons.Delete size={18} />
            </div>

            {/* Add Vocabulary Icon */}
            <div 
              onClick={() => setShowModal(true)}
              style={{
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                background: 'rgba(108, 117, 125, 0.1)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(108, 117, 125, 0.2)';
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(108, 117, 125, 0.1)';
                e.target.style.transform = 'scale(1)';
              }}
              title="Thêm từ vựng"
            >
              <CompactIcons.Add size={18} />
            </div>
          </div>

          {/* Settings and Tips Buttons - Bottom Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '15px'
          }}>
            {/* Settings Button - Left */}
            <button
              onClick={() => setShowSettings(true)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: isMobile ? '48px' : '52px',
                height: isMobile ? '48px' : '52px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                fontSize: isMobile ? '1rem' : '1.1rem',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)';
                e.target.style.transform = 'translateY(-3px) scale(1.08)';
                e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
              title="Cài đặt"
            >
              <Settings size={22} />
            </button>

            {/* Tips Button - Right */}
            <button
              onClick={() => setShowTips(true)}
              style={{
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                color: '#ff6b6b',
                border: 'none',
                borderRadius: '50%',
                width: isMobile ? '48px' : '52px',
                height: isMobile ? '48px' : '52px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: isMobile ? '0.65rem' : '0.7rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(255, 154, 158, 0.4)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #ff8a95 0%, #fecfef 100%)';
                e.target.style.transform = 'translateY(-3px) scale(1.08)';
                e.target.style.boxShadow = '0 8px 25px rgba(255, 154, 158, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)';
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 4px 15px rgba(255, 154, 158, 0.4)';
              }}
              title="Mẹo và hướng dẫn"
            >
              <CompactIcons.Lightbulb size={18} color="#ff6b6b" />
              <span style={{ fontSize: '0.6rem', marginTop: '2px' }}>MẸO</span>
            </button>

          </div>
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#2d3748',
            borderRadius: '15px',
            padding: isMobile ? '25px 20px' : '30px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            color: 'white'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: isMobile ? '1.3rem' : '1.5rem' }}>Nhập dữ liệu.</h2>
                <p style={{ margin: '5px 0 0 0', color: '#a0aec0', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
                  Chép và dán dữ liệu ở đây (từ Word, Excel, Google Docs, v.v.)
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  padding: '5px'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Main Input Area */}
            <textarea
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              placeholder="Ví dụ:
confident : tự tin
friendly : thân thiện
motivated : có động lực
patient : kiên nhẫn
flexible : linh hoạt"
              style={{
                width: '100%',
                height: '180px',
                background: '#1a202c',
                border: '1px solid #4a5568',
                borderRadius: '8px',
                padding: '15px',
                color: 'white',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: '1.5',
                marginBottom: '20px',
                minHeight: isMobile ? '120px' : '180px',
                maxHeight: '300px'
              }}
            />

            {/* Delimiter Options */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
              gap: isMobile ? '15px' : '20px', 
              marginBottom: '20px' 
            }}>
              {/* Term-Definition Delimiter */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: isMobile ? '0.9rem' : '1rem' }}>Giữa thuật ngữ và định nghĩa</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="termDelimiter"
                        value="custom"
                        checked={termDelimiter === 'custom'}
                        onChange={(e) => setTermDelimiter(e.target.value)}
                        style={{ accentColor: '#4299e1' }}
                      />
                      Dấu hai chấm (:)
                    </label>
                    {termDelimiter === 'custom' && (
                      <input
                        type="text"
                        value={customTermDelimiter}
                        onChange={(e) => setCustomTermDelimiter(e.target.value)}
                        placeholder="Nhập ký tự"
                        style={{
                          background: '#1a202c',
                          border: '1px solid #4a5568',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          color: 'white',
                          fontSize: '0.9rem',
                          width: '80px'
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Entry Delimiter */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: isMobile ? '0.9rem' : '1rem' }}>Giữa các thẻ</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="entryDelimiter"
                      value="newline"
                      checked={entryDelimiter === 'newline'}
                      onChange={(e) => setEntryDelimiter(e.target.value)}
                      style={{ accentColor: '#4299e1' }}
                    />
                    Dòng mới
                  </label>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                Xem trước {previewData.length} thẻ
              </h4>
              <div style={{
                background: '#1a202c',
                border: '1px solid #4a5568',
                borderRadius: '8px',
                padding: isMobile ? '12px' : '15px',
                minHeight: isMobile ? '80px' : '100px',
                maxHeight: isMobile ? '150px' : '200px',
                overflow: 'auto',
                fontSize: isMobile ? '0.85rem' : '0.9rem'
              }}>
                {previewData.length === 0 ? (
                  <p style={{ color: '#a0aec0', margin: 0, fontStyle: 'italic' }}>
                    Không có nội dung để xem trước
                  </p>
                ) : (
                  previewData.map((item, index) => (
                    <div key={index} style={{ 
                      padding: isMobile ? '8px 0' : '10px 0', 
                      borderBottom: index < previewData.length - 1 ? '1px solid #4a5568' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: isMobile ? 'wrap' : 'nowrap',
                      gap: isMobile ? '4px' : '0'
                    }}>
                      <span style={{ color: '#68d391', fontWeight: '500', fontSize: isMobile ? '0.9rem' : '1rem' }}>{item.english}</span>
                      <select
                        value={item.type}
                        onChange={(e) => {
                          const newPreviewData = [...previewData];
                          newPreviewData[index].type = e.target.value;
                          setPreviewData(newPreviewData);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          color: '#9ca3af',
                          fontSize: isMobile ? '0.75rem' : '0.85rem',
                          width: isMobile ? '80px' : '120px',
                          textAlign: 'center',
                          appearance: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="noun">(noun)</option>
                        <option value="verb">(verb)</option>
                        <option value="adjective">(adjective)</option>
                        <option value="adverb">(adverb)</option>
                        <option value="preposition">(preposition)</option>
                        <option value="other">(other)</option>
                      </select>
                      <span style={{ color: '#fbb6ce', fontSize: isMobile ? '0.9rem' : '1rem' }}>{item.vietnamese}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'flex-end',
              gap: isMobile ? '15px' : '20px',
              marginTop: '30px'
            }}>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: '#4a5568',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: isMobile ? '14px 20px' : '12px 25px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  transition: 'all 0.3s ease',
                  width: isMobile ? '100%' : 'auto',
                  minHeight: '48px'
                }}
                onMouseEnter={(e) => e.target.style.background = '#2d3748'}
                onMouseLeave={(e) => e.target.style.background = '#4a5568'}
              >
                Hủy nhập
              </button>
              <button 
                onClick={handleBulkImport}
                disabled={previewData.length === 0}
                style={{
                  background: previewData.length === 0 ? '#4a5568' : '#4299e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: isMobile ? '14px 20px' : '12px 25px',
                  cursor: previewData.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  transition: 'all 0.3s ease',
                  width: isMobile ? '100%' : 'auto',
                  minHeight: '48px',
                  opacity: previewData.length === 0 ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (previewData.length > 0) e.target.style.background = '#3182ce';
                }}
                onMouseLeave={(e) => {
                  if (previewData.length > 0) e.target.style.background = '#4299e1';
                }}
              >
                Nhập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: toast.type === 'success' ? '#10b981' : 
                     toast.type === 'error' ? '#ef4444' : 
                     toast.type === 'warning' ? '#f59e0b' : '#3b82f6',
          color: 'white',
          padding: '16px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: '300px',
          maxWidth: '400px',
          animation: 'slideInRight 0.3s ease-out',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {toast.type === 'success' ? '✓' : 
             toast.type === 'error' ? '✕' : 
             toast.type === 'warning' ? '⚠' : 'ℹ'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', marginBottom: '2px' }}>
              {toast.type === 'success' ? 'Thành công!' : 
               toast.type === 'error' ? 'Lỗi!' : 
               toast.type === 'warning' ? 'Cảnh báo!' : 'Thông báo!'}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              {toast.message}
            </div>
          </div>
          <button 
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '4px',
              borderRadius: '4px',
              opacity: 0.7,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.7'}
          >
            ×
          </button>
        </div>
      )}


      {/* Settings Modal */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#2d3748',
            borderRadius: '15px',
            padding: '30px',
            width: '90%',
            maxWidth: '500px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>⚙️ Cài đặt</h2>
              <button 
                onClick={() => setShowSettings(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  padding: '5px'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Language Mode */}
              <div>
                <label style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '10px', display: 'block' }}>
                  Chế độ học
                </label>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="languageMode"
                      value="vietnamese"
                      checked={languageMode === 'vietnamese'}
                      onChange={(e) => setLanguageMode(e.target.value)}
                      style={{ accentColor: '#4299e1' }}
                    />
                    Tiếng Việt → Tiếng Anh
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="languageMode"
                      value="english"
                      checked={languageMode === 'english'}
                      onChange={(e) => setLanguageMode(e.target.value)}
                      style={{ accentColor: '#4299e1' }}
                    />
                    Tiếng Anh → Tiếng Việt
                  </label>
                </div>
              </div>

              {/* Word Filter */}
              <div>
                <label style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '10px', display: 'block' }}>
                  ⭐ Bộ lọc từ vựng
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="wordFilter"
                      value="all"
                      checked={wordFilter === 'all'}
                      onChange={(e) => setWordFilter(e.target.value)}
                      style={{ accentColor: '#4299e1' }}
                    />
                    Tất cả từ
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="wordFilter"
                      value="favorites"
                      checked={wordFilter === 'favorites'}
                      onChange={(e) => setWordFilter(e.target.value)}
                      style={{ accentColor: '#4299e1' }}
                    />
                    Chỉ từ yêu thích
                  </label>
                </div>
              </div>

              {/* Difficulty Level */}
              <div>
                <label style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '10px', display: 'block' }}>
                  Mức độ khó
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(parseInt(e.target.value))}
                  style={{
                    background: '#1a202c',
                    border: '1px solid #4a5568',
                    borderRadius: '8px',
                    padding: '10px',
                    color: 'white',
                    fontSize: '1rem',
                    width: '100%'
                  }}
                >
                  <option value={1}>Dễ (1)</option>
                  <option value={2}>Trung bình (2)</option>
                  <option value={3}>Khó (3)</option>
                </select>
              </div>

              {/* Auto Advance */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={autoAdvance}
                    onChange={(e) => setAutoAdvance(e.target.checked)}
                    style={{ accentColor: '#4299e1', transform: 'scale(1.2)' }}
                  />
                  <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                    Tự động chuyển từ tiếp theo
                  </span>
                </label>
                <p style={{ margin: '5px 0 0 0', color: '#a0aec0', fontSize: '0.9rem' }}>
                  Tự động chuyển sang từ tiếp theo sau khi trả lời đúng
                </p>
              </div>

              {/* Sound */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    style={{ accentColor: '#4299e1', transform: 'scale(1.2)' }}
                  />
                  <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                    Bật âm thanh
                  </span>
                </label>
                <p style={{ margin: '5px 0 0 0', color: '#a0aec0', fontSize: '0.9rem' }}>
                  Phát âm thanh khi trả lời đúng/sai
                </p>
              </div>

              {/* Statistics */}
              <div>
                <label style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '15px', display: 'block' }}>
                  📊 Thống kê học tập
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(4, 1fr)', 
                  gap: '15px',
                  background: '#1a202c',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #4a5568'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '1.8rem', 
                      fontWeight: 'bold', 
                      color: '#4caf50',
                      marginBottom: '5px'
                    }}>
                      {stats.correct}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#a0aec0' }}>Đúng</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '1.8rem', 
                      fontWeight: 'bold', 
                      color: '#ff9800',
                      marginBottom: '5px'
                    }}>
                      {stats.nearlyCorrect}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#a0aec0' }}>Gần đúng</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '1.8rem', 
                      fontWeight: 'bold', 
                      color: '#f44336',
                      marginBottom: '5px'
                    }}>
                      {stats.incorrect}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#a0aec0' }}>Sai</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '1.8rem', 
                      fontWeight: 'bold', 
                      color: '#4299e1',
                      marginBottom: '5px'
                    }}>
                      {stats.total}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#a0aec0' }}>Tổng</div>
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  marginTop: '15px',
                  gap: '10px'
                }}>
                  <button 
                    onClick={resetStats}
                    style={{
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#d32f2f'}
                    onMouseLeave={(e) => e.target.style.background = '#f44336'}
                  >
                    Reset thống kê
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
              <button 
                onClick={() => setShowSettings(false)}
                style={{
                  background: '#4299e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#3182ce'}
                onMouseLeave={(e) => e.target.style.background = '#4299e1'}
              >
                Lưu cài đặt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tips Modal */}
      {showTips && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#2d3748',
            borderRadius: '15px',
            padding: '30px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>💡 Mẹo và hướng dẫn</h2>
              <button 
                onClick={() => setShowTips(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  padding: '5px'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              {/* How to Use */}
              <div>
                <h3 style={{ color: '#68d391', marginBottom: '15px', fontSize: '1.2rem' }}>
                  🎯 Cách sử dụng
                </h3>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                  <li>Nhập từ tiếng Anh hoặc tiếng Việt tương ứng với từ hiển thị</li>
                  <li>Nhấn Enter hoặc nút "Kiểm tra" để kiểm tra đáp án</li>
                  <li>Sử dụng nút "Xem gợi ý" khi gặp khó khăn</li>
                  <li>Dùng các nút mũi tên để chuyển từ</li>
                </ul>
              </div>

              {/* Tips */}
              <div>
                <h3 style={{ color: '#fbb6ce', marginBottom: '15px', fontSize: '1.2rem' }}>
                  💡 Mẹo học hiệu quả
                </h3>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                  <li>Học từ vựng theo chủ đề để dễ nhớ hơn</li>
                  <li>Luyện tập đều đặn mỗi ngày 15-30 phút</li>
                  <li>Đọc to từ vựng để cải thiện phát âm</li>
                  <li>Sử dụng từ vựng trong câu để nhớ lâu hơn</li>
                  <li>Ôn tập lại những từ đã học trước đó</li>
                </ul>
              </div>

              {/* Features */}
              <div>
                <h3 style={{ color: '#f6ad55', marginBottom: '15px', fontSize: '1.2rem' }}>
                  ⚡ Tính năng
                </h3>
                <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                  <li><strong>Chế độ học:</strong> Chuyển đổi giữa VN→EN và EN→VN</li>
                  <li><strong>Thống kê:</strong> Theo dõi tiến độ học tập</li>
                  <li><strong>Gợi ý:</strong> Nhận gợi ý khi gặp khó khăn</li>
                  <li><strong>Nhập hàng loạt:</strong> Thêm nhiều từ vựng cùng lúc</li>
                  <li><strong>Reset:</strong> Xóa thống kê và bắt đầu lại</li>
                </ul>
              </div>

              {/* Keyboard Shortcuts */}
              <div>
                <h3 style={{ color: '#9f7aea', marginBottom: '15px', fontSize: '1.2rem' }}>
                  ⌨️ Phím tắt
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
                  <div style={{ background: '#1a202c', padding: '10px', borderRadius: '8px' }}>
                    <strong>Enter:</strong> Kiểm tra đáp án
                  </div>
                  <div style={{ background: '#1a202c', padding: '10px', borderRadius: '8px' }}>
                    <strong>← →:</strong> Chuyển từ
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
              <button 
                onClick={() => setShowTips(false)}
                style={{
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#45a049'}
                onMouseLeave={(e) => e.target.style.background = '#4caf50'}
              >
                Đã hiểu!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
