
import { useState } from 'react';
import './Auth.css';

const BASE_URL = 'https://skillsbridge-j1nn.onrender.com';

function Auth({ onBack, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');

    if (!email || !password || (!isLogin && !name)) {
      setMessage('Please fill all fields');
      return;
    }

    try {
      setLoading(true);

      const endpoint = isLogin
        ? `${BASE_URL}/api/auth/login`
        : `${BASE_URL}/api/auth/register`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(
          isLogin
            ? { email, password }
            : { name, email, password }
        )
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || 'Something went wrong');
        return;
      }

      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        onLoginSuccess(data.user);
      } else {
        setMessage('Registration successful! Please login.');

        setIsLogin(true);
        setName('');
        setPassword('');
      }

    } catch (error) {
      console.error('Authentication error:', error);
      setMessage('Server connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">

        <button
          className="back-btn"
          onClick={onBack}
          type="button"
        >
          ← Back to Home
        </button>

        <h1 className="auth-logo">
          Skills<span>Bridge</span>
        </h1>

        <h2>
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </h2>

        <p className="auth-subtitle">
          {isLogin
            ? 'Login to continue your learning journey.'
            : 'Join SkillsBridge and start growing your skills.'}
        </p>

        <form onSubmit={handleSubmit}>

          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {message && (
            <p className="auth-message">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : isLogin
                ? 'Login'
                : 'Sign Up'}
          </button>

        </form>

        <p className="auth-switch">
          {isLogin
            ? "Don't have an account? "
            : 'Already have an account? '}

          <span
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage('');
            }}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </span>
        </p>

      </div>
    </div>
  );
}

export default Auth;
