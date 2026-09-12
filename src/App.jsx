import { useState, useEffect, useCallback } from 'react';
import './index.css';
import { playKeyClick, playFRespectSound, playAahSound, playShatterSound, playRepairSound } from './utils/audio';

const WORD_LIST = [
  'CAT', 'DOG', 'HELLO', 'APPLE', 'HOUSE', 
  'CHAIR', 'WATER', 'TIGER', 'MANGO', 'BANANA', 
  'ELEPHANT', 'COMPUTER', 'KEYBOARD', 'CHOCOLATE'
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const QWERTY_LAYOUT = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

// Helper to generate a complete random mapping
const generateMapping = () => {
  const shuffled = [...ALPHABET].sort(() => Math.random() - 0.5);
  const mapping = {};
  ALPHABET.forEach((letter, index) => {
    mapping[letter] = shuffled[index];
  });
  return mapping;
};

// Helper to get a random word
const getRandomWord = () => WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];

function App() {
  const [gameState, setGameState] = useState('playing'); // 'playing' | 'gameover'
  const [targetWord, setTargetWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [mapping, setMapping] = useState({});
  const [score, setScore] = useState(0);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [inputStatus, setInputStatus] = useState(''); // '' | 'error' | 'success'
  const [isShuffling, setIsShuffling] = useState(false);
  const [isShattered, setIsShattered] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [showRespectToast, setShowRespectToast] = useState(false);
  const [showPEmojiPopup, setShowPEmojiPopup] = useState(false);
  const [showAMemePopup, setShowAMemePopup] = useState(false);

  const initGame = useCallback(() => {
    setGameState('playing');
    setTargetWord(getRandomWord());
    setUserInput('');
    setMapping(generateMapping());
    setScore(0);
    setWordsCompleted(0);
    setWrongClicks(0);
    setTimeLeft(60);
    setInputStatus('');
    setIsShattered(false);
    setIsRepairing(false);
  }, []);

  // Init on mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer logic
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('gameover');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  const handleNextWord = useCallback(() => {
    setIsShuffling(true);
    setTimeout(() => {
      let nextWord = getRandomWord();
      while (nextWord === targetWord) {
        nextWord = getRandomWord();
      }
      setTargetWord(nextWord);
      setUserInput('');
      setMapping(generateMapping());
      setInputStatus('');
      setIsShuffling(false);
    }, 400); // Wait for shuffle animation
  }, [targetWord]);

  const triggerRespects = useCallback(() => {
    playFRespectSound();
    setShowRespectToast(true);
    setTimeout(() => {
      setShowRespectToast(false);
    }, 1500);
  }, []);

  const triggerPEmoji = useCallback(() => {
    playKeyClick();
    setShowPEmojiPopup(true);
    setTimeout(() => {
      setShowPEmojiPopup(false);
    }, 3000);
  }, []);

  const triggerAMeme = useCallback(() => {
    playAahSound();
    setShowAMemePopup(true);
    setTimeout(() => {
      setShowAMemePopup(false);
    }, 3000);
  }, []);

  const handleRepairKeyboard = useCallback(() => {
    if (!isShattered || isRepairing) return;
    setIsRepairing(true);
    playRepairSound();

    setTimeout(() => {
      setIsShattered(false);
      setIsRepairing(false);
      setUserInput('');
      setInputStatus('');
    }, 500);
  }, [isShattered, isRepairing]);

  const handleKeyPress = useCallback((key) => {
    if (gameState !== 'playing' || isShuffling) return;

    // If keyboard is shattered, clicking any key repairs it!
    if (isShattered) {
      handleRepairKeyboard();
      return;
    }

    if (key === 'F') {
      triggerRespects();
    } else if (key === 'P') {
      triggerPEmoji();
    } else if (key === 'A') {
      triggerAMeme();
    } else {
      playKeyClick();
    }

    if (key === 'BACKSPACE') {
      setUserInput((prev) => prev.slice(0, -1));
      setInputStatus('');
      return;
    }

    if (key === 'CLEAR') {
      setUserInput('');
      setInputStatus('');
      return;
    }

    // Normal letter key
    const outputLetter = mapping[key];
    const newInput = userInput + outputLetter;
    
    // Check if user reached full length of the target word
    if (newInput.length === targetWord.length) {
      setUserInput(newInput);

      if (newInput === targetWord) {
        // Exact match -> Success!
        setInputStatus('success');
        setScore((prev) => prev + 100);
        setWordsCompleted((prev) => prev + 1);
        setTimeout(() => {
          handleNextWord();
        }, 500);
      } else {
        // Reached word length, but NOT exact match -> SHATTER THE KEYS!
        setInputStatus('error');
        setWrongClicks((prev) => prev + 1);
        setIsShattered(true);
        playShatterSound();
        // Keyboard remains shattered until user repairs it!
      }
    } else if (targetWord.startsWith(newInput)) {
      setUserInput(newInput);
      setInputStatus('');
    } else {
      // Wrong letter before full length
      setUserInput(newInput);
      setInputStatus('error');
      setWrongClicks((prev) => prev + 1);
      
      // auto remove error state after short delay
      setTimeout(() => setInputStatus(''), 400);
    }
  }, [gameState, isShuffling, isShattered, targetWord, userInput, mapping, handleNextWord, triggerRespects, triggerPEmoji, triggerAMeme, handleRepairKeyboard]);

  // Handle Physical Keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing' || isShuffling) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (isShattered) {
        handleRepairKeyboard();
        return;
      }

      const upperKey = e.key.toUpperCase();
      if (upperKey === 'BACKSPACE') {
        e.preventDefault();
        handleKeyPress('BACKSPACE');
      } else if (upperKey === 'DELETE' || upperKey === 'ESCAPE') {
        e.preventDefault();
        handleKeyPress('CLEAR');
      } else if (/^[A-Z]$/.test(upperKey)) {
        e.preventDefault();
        handleKeyPress(upperKey);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isShuffling, isShattered, handleKeyPress, handleRepairKeyboard]);

  if (gameState === 'gameover') {
    return (
      <div className="game-over">
        <h2>GAME OVER</h2>
        <div className="game-over-stats">
          <div className="stat-box">
            <div className="label">Final Score</div>
            <div className="value">{score}</div>
          </div>
          <div className="stat-box">
            <div className="label">Words</div>
            <div className="value">{wordsCompleted}</div>
          </div>
          <div className="stat-box">
            <div className="label">Wrong Clicks</div>
            <div className="value">{wrongClicks}</div>
          </div>
        </div>
        <button className="btn-primary" onClick={initGame}>
          PLAY AGAIN
        </button>
      </div>
    );
  }

  return (
    <div className="game-container">
      {showRespectToast && (
        <div className="respect-toast">
          <span className="respect-icon">🫡</span>
          <span className="respect-text">RESPECTS PAID (F)</span>
        </div>
      )}

      {showPEmojiPopup && (
        <div className="p-emoji-overlay" onClick={() => setShowPEmojiPopup(false)}>
          <div className="p-emoji-card" onClick={(e) => e.stopPropagation()}>
            <button className="p-emoji-close" onClick={() => setShowPEmojiPopup(false)}>×</button>
            <img src="/p-emoji.jpeg" alt="P Key Emoji" className="p-emoji-img" />
          </div>
        </div>
      )}

      {showAMemePopup && (
        <div className="a-emoji-overlay" onClick={() => setShowAMemePopup(false)}>
          <div className="a-emoji-card" onClick={(e) => e.stopPropagation()}>
            <button className="a-emoji-close" onClick={() => setShowAMemePopup(false)}>×</button>
            <img src="/a-meme.png" alt="A Key Meme" className="a-emoji-img" />
          </div>
        </div>
      )}

      {isShattered && (
        <div className="shatter-banner">
          💥 KEYBOARD SHATTERED! 💥
        </div>
      )}

      <header className="header">
        <h1>WRONG KEYBOARD</h1>
        <p>The keyboard knows what you're trying to type. It just doesn't care.</p>
      </header>

      <div className="game-info">
        <div className="info-item">
          <span className="info-label">Score</span>
          <span className="info-value">{score}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Words</span>
          <span className="info-value">{wordsCompleted}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Time</span>
          <span className={`info-value ${timeLeft <= 10 ? 'timer-low' : ''}`}>
            0:{timeLeft.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <main className="play-area">
        <div className="target-word-container">
          <div className="target-word-label">TYPE THIS</div>
          <div className="target-word">{targetWord}</div>
        </div>

        <div className="user-input-container">
          <div className="target-word-label">YOUR INPUT</div>
          <div className={`user-input ${inputStatus}`}>
            {userInput.split('').map((char, index) => (
              <span key={index}>{char}</span>
            ))}
          </div>
        </div>

        <div className={`keyboard ${isShuffling ? 'shuffle-anim' : ''} ${isShattered ? 'shattered' : ''} ${isRepairing ? 'repairing' : ''}`}>
          {QWERTY_LAYOUT.map((row, rowIndex) => (
            <div key={rowIndex} className="keyboard-row">
              {row.map((key) => (
                <button
                  key={key}
                  className={`key ${key === 'F' ? 'f-key' : ''} ${key === 'P' ? 'p-key' : ''} ${key === 'A' ? 'a-key' : ''}`}
                  onClick={() => handleKeyPress(key)}
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
          <div className="keyboard-row" style={{ marginTop: '0.5rem' }}>
            <button 
              className="key action-key" 
              onClick={() => handleKeyPress('CLEAR')}
            >
              CLEAR
            </button>
            <button 
              className="key action-key" 
              style={{ flexGrow: 1, maxWidth: '200px' }}
              onClick={() => handleKeyPress('BACKSPACE')}
            >
              BACKSPACE
            </button>
          </div>
        </div>

        {isShattered && (
          <div className="repair-container">
            <button className="repair-btn" onClick={handleRepairKeyboard}>
              🔨 FIX KEYBOARD
            </button>
            <span className="repair-hint">Click the button or press any key to repair!</span>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
