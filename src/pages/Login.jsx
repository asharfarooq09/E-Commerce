import React, { useState, useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";
import ToastContext from "../contexts/ToastContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { user, login } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  useEffect(() => {
    setUsername("mor_2314");
    setPassword("83r5^_");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError("Invalid username or password");
        showToast("Login failed. Please check your credentials.", "error");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
      showToast("Login failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="container">
      <div className="login-container">
        <h2 className="login-title">Login to ShopReact</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>

          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;
