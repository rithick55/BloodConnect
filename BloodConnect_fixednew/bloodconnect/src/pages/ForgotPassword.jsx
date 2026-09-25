import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [demoOtp, setDemoOtp] = useState("");

  const [loading, setLoading] = useState(false);

  // STEP 1
  const sendOtp = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanPhone = phone.trim();

    if (!cleanPhone) {
      return setError(
        "Please enter your registered mobile number."
      );
    }

    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      return setError(
        "Please enter a valid 10-digit mobile number."
      );
    }
    if (!role) {
      return setError("Please select your account type.");
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8090/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: cleanPhone,
            role: role,
          }),
        }
      );

      const data = await response.text();

      if (!response.ok) {
        throw new Error(
          data || "Unable to send OTP."
        );
      }

      // Demo OTP
      setDemoOtp(data);

      setStep(2);

      setSuccess(
        "OTP generated successfully."
      );
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 2
  const verifyOtp = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!/^[0-9]{6}$/.test(otp)) {
      return setError(
        "Please enter the 6-digit OTP."
      );
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8090/api/auth/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: phone.trim(),
            role: role,
            otp: otp.trim(),
          }),
        }
      );

      const data = await response.text();

      if (!response.ok) {
        throw new Error(
          data || "Invalid OTP."
        );
      }

      setSuccess(
        "OTP verified successfully."
      );

      setStep(3);
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
        "Unable to verify OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 3
  const resetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      return setError(
        "Password must contain at least 6 characters."
      );
    }

    if (newPassword !== confirmPassword) {
      return setError(
        "Passwords do not match."
      );
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8090/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: phone.trim(),
            role: role,
            otp: otp.trim(),
            newPassword: newPassword,
          }),
        }
      );

      const data = await response.text();

      if (!response.ok) {
        throw new Error(
          data || "Password reset failed."
        );
      }

      setSuccess(
        "Password changed successfully!"
      );

      setTimeout(() => {
        navigate(
          role === "DONOR"
            ? "/donor-login"
            : "/receiver-login",
          {
            replace: true,
          }
        );
      }, 1500);
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
        "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">

        <div className="auth-header">

          <span className="auth-icon">
            🔐
          </span>

          <h1>
            {step === 1 &&
              "Forgot Password?"}

            {step === 2 &&
              "Verify OTP"}

            {step === 3 &&
              "Reset Password"}
          </h1>

          <p>
            {step === 1 &&
              "Enter your registered mobile number."}

            {step === 2 &&
              "Enter the 6-digit OTP generated for your account."}

            {step === 3 &&
              "Create a new password for your account."}
          </p>

        </div>

        {/* STEP 1 */}

        {step === 1 && (
          <form
            className="auth-form"
            onSubmit={sendOtp}
          >

            <div className="form-group">

              <label>
                Mobile Number
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                maxLength={10}
                placeholder="Enter your 10-digit mobile number"
              />

              <div className="form-group">
                <label>Account Type</label>

                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="">Select account type</option>
                  <option value="DONOR">Donor</option>
                  <option value="RECEIVER">Receiver</option>
                </select>
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
              disabled={loading}
            >
              {loading
                ? "Generating OTP..."
                : "Send OTP"}
            </button>

            <div className="auth-footer">

              <span>
                Remember your password?
              </span>

              <Link to="/receiver-login">
                Login
              </Link>

            </div>

          </form>
        )}

        {/* STEP 2 */}

        {step === 2 && (
          <form
            className="auth-form"
            onSubmit={verifyOtp}
          >

            <div className="form-group">

              <label>
                Enter OTP
              </label>

              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                maxLength={6}
                placeholder="Enter 6-digit OTP"
              />

            </div>

            <div
              style={{
                padding: "12px",
                marginBottom: "16px",
                borderRadius: "8px",
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                textAlign: "center",
              }}
            >
              <strong>
                Demo OTP: {demoOtp}
              </strong>
            </div>

            {error && (
              <p className="form-error">
                {error}
              </p>
            )}

            {success && (
              <p
                style={{
                  color: "#16a34a",
                  textAlign: "center",
                  marginBottom: "12px",
                }}
              >
                {success}
              </p>
            )}

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading
                ? "Verifying..."
                : "Verify OTP"}
            </button>

            <button
              type="button"
              className="auth-button"
              style={{
                marginTop: "10px",
                background: "#6b7280",
              }}
              onClick={() => {
                setStep(1);
                setOtp("");
                setDemoOtp("");
                setRole("");
                setError("");
                setSuccess("");
              }}
            >
              Change Mobile Number
            </button>

          </form>
        )}

        {/* STEP 3 */}

        {step === 3 && (
          <form
            className="auth-form"
            onSubmit={resetPassword}
          >

            <div className="form-group">

              <label>
                New Password
              </label>

              <div className="password-input-wrapper">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter new password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
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

              <label>
                Confirm Password
              </label>

              <div className="password-input-wrapper">

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Confirm new password"
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

            {success && (
              <p
                style={{
                  color: "#16a34a",
                  textAlign: "center",
                  marginBottom: "12px",
                }}
              >
                {success}
              </p>
            )}

            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading
                ? "Updating Password..."
                : "Reset Password"}
            </button>

          </form>
        )}

      </div>
    </main>
  );
}

export default ForgotPassword;