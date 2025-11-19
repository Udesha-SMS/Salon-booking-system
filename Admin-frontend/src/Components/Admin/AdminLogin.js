import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminLogin.css';
import loginImage from '../../Assets/login-image.jpg';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/admin/login', {
        username,
        password
      });

      if (response.data.success) {
        localStorage.setItem('adminUser', JSON.stringify(response.data.admin));
        navigate('/admin-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-left">
        <div className="admin-logo-bar">
          {/* You can add logo here if needed */}
        </div>

        <h2 className="admin-login-title">Admin Login</h2>
        <p className="admin-login-subtitle">Sign in to access the admin dashboard</p>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            className="admin-login-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="admin-login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p style={{ color: "red", marginTop: "-10px" }}>{error}</p>}
          <button 
            type="submit" 
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>

      <div className="admin-login-right">
        <img src={loginImage} alt="Admin" className="admin-login-image" />
      </div>
    </div>
  );
};

export default AdminLogin;