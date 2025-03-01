import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './Home';
import Profile from './Profile';
import './App.css';

function AuthForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const switchMode = () => {
    setIsRegistering(!isRegistering);
    setUsername('');
    setEmail('');
    setPassword('');
    setProfilePhoto(null);
    setMessage('');
  };

  const handleFileChange = (e) => {
    setProfilePhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      
      if (isRegistering) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        if (profilePhoto) {
          formData.append('profilePhoto', profilePhoto);
        }
  
        response = await fetch(`http://localhost:5000/register`, {
          method: 'POST',
          body: formData
        });
      } else {
        response = await fetch(`http://localhost:5000/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
      }
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      
      setMessage(data.message);
      if (!isRegistering) {
        localStorage.setItem('token', data.token);
        navigate('/home');
      }
      
    } catch (error) {
      setMessage(error.message);
      console.error('Submission error:', error);
    }
  };

  return (
    <div className="app-container">
      <h1 className="title">{isRegistering ? 'Register' : 'Login'}</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        {isRegistering && (
          <>
            <input
              className="input-field"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              className="input-field"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </>
        )}
        <input
          className="input-field"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input-field"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="button-container">
          <button className="primary-btn" type="submit">
            {isRegistering ? 'Register' : 'Login'}
          </button>
          <button
            className="secondary-btn"
            type="button"
            onClick={switchMode}
          >
            {isRegistering ? 'Switch to Login' : 'Switch to Register'}
          </button>
        </div>
      </form>
      
      {message && (
        <div className={`message ${message.includes('success') ? 'success-message' : 'error-message'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route path="/home" element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;