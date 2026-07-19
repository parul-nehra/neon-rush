const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';

export const loginUser = async (username, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.msg || 'Login failed');
  }
  return res.json();
};

export const registerUser = async (username, password) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.msg || 'Registration failed');
  }
  return res.json();
};

export const fetchLeaderboard = async () => {
  const res = await fetch(`${API_URL}/scores/leaderboard`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
};

export const submitScore = async (username, score, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_URL}/scores`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ username, score })
  });
  
  if (!res.ok) throw new Error('Failed to submit score');
  return res.json();
};
