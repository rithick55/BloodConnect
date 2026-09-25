import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const API_URL = import.meta.env.VITE_API_URL;

function DonorLogin() {
  const navigate = useNavigate();
  const { loginWithBackendUser } = useApp();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Check empty fields
    if (!identifier.trim() || !password) {
      return setError("Please enter your email/mobile number and password.");
    }

    try {
      // Send login request to API Gateway
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: identifier.trim(),
            password: password,
            role: "DONOR",
          }),
        }
      );

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      // Backend returned an error
      if (!response.ok) {
        return setError(
          data.message || "Invalid email or password."
        );
      }
      localStorage.setItem(
        "bloodconnect_user",
        JSON.stringify(data)
      );

      localStorage.setItem(
        "bloodconnect_token",
        data.token
      );

      // Update React authentication session
      loginWithBackendUser(data);

      // Go to donor dashboard
      navigate("/donor-dashboard", {
        replace: true,
      });

    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Unable to connect to the server. Please try again."
      );
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <span className="auth-icon">❤️</span>

          <h1>Donor Login</h1>

          <p>
            Sign in to help someone in need.
          </p>
        </div>


        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">
            <label>Email or Mobile Number</label>

            <input
              type="text"
              value={identifier}
              onChange={(e) =>
                setIdentifier(e.target.value)
              }
              placeholder="Enter your email or mobile number"
            />
          </div>


          <div className="form-group">
            <label>Password</label>

            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
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


          {error && (
            <p className="form-error">
              {error}
            </p>
          )}


          <button
            type="submit"
            className="auth-button"
          >
            Login
          </button>

        </form>


        <div className="auth-footer">
          <span>Don't have an account?</span>

          <Link to="/donor-register">
            Register
          </Link>
        </div>


        {/* <div className="demo-credentials">
          <strong>Demo account</strong>

          <p>
            Email: arun@bloodconnect.com
          </p>

          <p>
            Password: demo123
          </p>
        </div> */}

      </div>
    </main>
  );
}

export default DonorLogin;
