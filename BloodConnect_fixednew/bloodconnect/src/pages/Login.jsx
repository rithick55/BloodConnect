import { Link } from "react-router-dom";

function Login() {
  return (
    <main className="login-page">

      <div className="login-header">
        <span className="hero-label">WELCOME BACK</span>

        <h1>How would you like to continue?</h1>

        <p>
          Choose your account type to continue.
        </p>
      </div>

      <div className="role-cards">

        <Link to="/receiver-login" className="role-card">
          <div className="role-icon">🩸</div>

          <h2>Receiver</h2>

          <p>
            Find nearby blood donors when you need blood.
          </p>

          <span className="role-link">
            Continue →
          </span>
        </Link>


        <Link to="/donor-login" className="role-card">
          <div className="role-icon">❤️</div>

          <h2>Donor</h2>

          <p>
            Donate blood and help someone in need.
          </p>

          <span className="role-link">
            Continue →
          </span>
        </Link>


        <Link to="/admin-login" className="role-card admin-card">
          <div className="role-icon">🛡️</div>

          <h2>Admin</h2>

          <p>
            Manage and monitor the BloodConnect platform.
          </p>

          <span className="role-link">
            Admin Login →
          </span>
        </Link>

      </div>

    </main>
  );
}

export default Login;