import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

function ReceiverRegister() {
  const navigate = useNavigate();
  const { addRegisteredUser } = useApp();

  const [form, setForm] = useState({
    name: "",
    age: "",
    bloodGroup: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const change = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    // Check required fields
    if (
      !form.name.trim() ||
      !form.age ||
      !form.bloodGroup ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.password
    ) {
      return setError("Please fill in all fields.");
    }

    // Check password length
    if (form.password.length < 6) {
      return setError(
        "Password must contain at least 6 characters."
      );
    }

    // Check password confirmation
    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match.");
    }

    try {
      // Send registration request to API Gateway
      const response = await fetch(
        "http://localhost:8090/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            role: "RECEIVER",
            phone: form.phone.trim(),
            age: Number(form.age),
            bloodGroup: form.bloodGroup,
            state: "",
            district: "",
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
          data.message || "Registration failed. Please try again."
        );
      }

      // Registration successful
      const registeredUser = data.user || data;

      addRegisteredUser({
        ...registeredUser,
        role: "RECEIVER",
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        age: Number(form.age),
        bloodGroup: form.bloodGroup,
        state: "",
        district: "",
      });

      navigate("/receiver-login", {
        replace: true,
        state: {
          registered: true,
        },
      });

    } catch (error) {
      console.error("Registration error:", error);

      setError(
        "Unable to connect to the server. Please try again."
      );
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <span className="auth-icon">🩸</span>

          <h1>Create Receiver Account</h1>

          <p>
            Create an account to find nearby blood donors.
          </p>
        </div>


        <form
          className="auth-form"
          onSubmit={submit}
        >

          <div className="form-group">
            <label>Full Name</label>

            <input
              value={form.name}
              onChange={(e) =>
                change("name", e.target.value)
              }
              placeholder="Enter your name"
            />
          </div>

          <div className="form-group">
            <label>Age</label>

            <input
              type="number"
              min="1"
              max="120"
              value={form.age}
              onChange={(e) =>
                change("age", e.target.value)
              }
              placeholder="Enter your age"
            />
          </div>

          <div className="form-group">
            <label>Blood Group</label>

            <select
              value={form.bloodGroup}
              onChange={(e) =>
                change("bloodGroup", e.target.value)
              }
            >
              <option value="">
                Select Blood Group
              </option>

              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                change("email", e.target.value)
              }
              placeholder="Enter your email"
            />
          </div>


          <div className="form-group">
            <label>Phone Number</label>

            <input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                change("phone", e.target.value)
              }
              placeholder="Enter your phone number"
            />
          </div>


          <div className="form-group">
            <label>Password</label>

            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  change("password", e.target.value)
                }
                placeholder="Create a password"
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


          <div className="form-group">
            <label>Confirm Password</label>

            <div className="password-input-wrapper">
              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={form.confirmPassword}
                onChange={(e) =>
                  change("confirmPassword", e.target.value)
                }
                placeholder="Confirm your password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
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
            Create Account
          </button>

        </form>


        <div className="auth-footer">
          <span>Already have an account?</span>

          <Link to="/receiver-login">
            Login
          </Link>
        </div>

      </div>
    </main>
  );
}

export default ReceiverRegister;