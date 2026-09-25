import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const API_URL = import.meta.env.VITE_API_URL;

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: email,
            password: password,
            role: "ADMIN",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Invalid admin email or password."
        );
      }

      if (data.role !== "ADMIN") {
        setError("This account is not an admin account.");
        return;
      }

      // Save logged-in admin
      localStorage.setItem(
        "bloodconnectAdmin",
        JSON.stringify(data)
      );

      navigate("/admin-dashboard", { replace: true });

    } catch (error) {
      console.error("Admin login failed:", error);
      setError(
        error.message || "Unable to login. Please try again."
      );
    }
  };

  return (
    <main className="auth-page">

      <div className="auth-card">

        {/* Header */}

        <div className="auth-header">

          <span className="auth-icon">
            🛡️
          </span>

          <h1>
            Admin Login
          </h1>

          <p>
            Sign in to manage BloodConnect.
          </p>

        </div>


        {/* Login Form */}

        <form
          className="auth-form"
          onSubmit={handleLogin}
        >

          {/* Email */}

          <div className="form-group">

            <label>
              Email
            </label>

            <input
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

          </div>


          {/* Password */}

          <div className="form-group">

            <label>
              Password
            </label>

            <div className="password-input-wrapper">

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>

            </div>

          </div>

          <div className="forgot-password">
            <Link to="/forgot-password">
              Forgot Password?
            </Link>
          </div>

          {/* Error */}

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}


          {/* Login */}

          <button
            type="submit"
            className="auth-button"
          >
            Login
          </button>

        </form>


        {/* Temporary credentials */}




        {/* Footer */}

        <div className="auth-footer">

          <Link to="/login">
            ← Back to login options
          </Link>

        </div>

      </div>

    </main>
  );
}

export default AdminLogin;