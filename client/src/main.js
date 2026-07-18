import { Game } from './game/Game.js';
import * as api from './api/index.js';

let game;
let currentUser = null;
let currentToken = null;
let isLoginMode = true;

document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const screens = {
    menu: document.getElementById('main-menu'),
    hud: document.getElementById('hud'),
    gameOver: document.getElementById('game-over'),
    leaderboard: document.getElementById('leaderboard-screen')
  };
  
  const hudElements = {
    score: document.getElementById('current-score'),
    multiplier: document.getElementById('current-multiplier'),
    healthFill: document.getElementById('health-fill')
  };
  
  const authStatusDisplay = document.getElementById('auth-status-display');
  
  const showScreen = (screenName) => {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
  };

  // Game setup
  const container = document.getElementById('game-container');
  game = new Game(container, {
    updateScore: (val) => hudElements.score.innerText = val,
    updateMultiplier: (val) => hudElements.multiplier.innerText = val,
    updateHealth: (val) => hudElements.healthFill.style.width = `${val}%`,
    onGameOver: async (finalScore) => {
      showScreen('gameOver');
      document.getElementById('final-score-val').innerText = finalScore;
      
      try {
        const username = currentUser ? currentUser.username : 'Guest';
        await api.submitScore(username, finalScore, currentToken);
      } catch (err) {
        console.error('Failed to submit score:', err);
      }
    }
  });

  // Buttons
  document.getElementById('btn-start').addEventListener('click', () => {
    showScreen('hud');
    game.start();
  });

  document.getElementById('btn-restart').addEventListener('click', () => {
    showScreen('hud');
    game.start();
  });

  document.getElementById('btn-menu-return').addEventListener('click', () => {
    showScreen('menu');
  });

  // Settings
  const sensSlider = document.getElementById('sensitivity-slider');
  sensSlider.addEventListener('input', (e) => {
    if (game && game.player) {
      game.player.lateralSpeed = parseFloat(e.target.value);
    }
  });

  // Leaderboard
  document.getElementById('btn-leaderboard').addEventListener('click', async () => {
    showScreen('leaderboard');
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '<div class="loading">Loading...</div>';
    
    try {
      const scores = await api.fetchLeaderboard();
      list.innerHTML = '';
      if (scores.length === 0) {
        list.innerHTML = '<div>No scores yet!</div>';
        return;
      }
      scores.forEach((s, i) => {
        const div = document.createElement('div');
        div.className = 'lb-entry';
        div.innerHTML = `<span>#${i+1} ${s.username}</span> <span>${s.score}</span>`;
        list.appendChild(div);
      });
    } catch (err) {
      list.innerHTML = '<div class="error-msg">Failed to load leaderboard</div>';
    }
  });

  document.getElementById('btn-close-leaderboard').addEventListener('click', () => {
    showScreen('menu');
  });

  // Auth
  const authModal = document.getElementById('auth-modal');
  const authForm = document.getElementById('auth-form');
  const authTitle = document.getElementById('auth-title');
  const authSubmit = document.getElementById('auth-submit');
  const toggleAuthModeBtn = document.getElementById('toggle-auth-mode');
  const authError = document.getElementById('auth-error');

  document.getElementById('btn-auth').addEventListener('click', () => {
    if (currentUser) {
      // Logout
      currentUser = null;
      currentToken = null;
      authStatusDisplay.innerText = 'Playing as Guest';
      document.getElementById('btn-auth').innerText = 'LOGIN / REGISTER';
    } else {
      authModal.classList.add('active');
    }
  });

  document.getElementById('close-auth').addEventListener('click', () => {
    authModal.classList.remove('active');
  });

  toggleAuthModeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    authTitle.innerText = isLoginMode ? 'LOGIN' : 'REGISTER';
    authSubmit.innerText = isLoginMode ? 'LOGIN' : 'REGISTER';
    toggleAuthModeBtn.innerText = isLoginMode ? 'Need an account? Register' : 'Already have an account? Login';
    authError.innerText = '';
  });

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('auth-username').value;
    const pass = document.getElementById('auth-password').value;
    
    try {
      authError.innerText = 'Processing...';
      let data;
      if (isLoginMode) {
        data = await api.loginUser(user, pass);
      } else {
        data = await api.registerUser(user, pass);
      }
      
      currentUser = data.user;
      currentToken = data.token;
      
      authModal.classList.remove('active');
      authStatusDisplay.innerText = `Logged in as ${currentUser.username}`;
      document.getElementById('btn-auth').innerText = 'LOGOUT';
      authError.innerText = '';
      
    } catch (err) {
      authError.innerText = err.message;
    }
  });
});
