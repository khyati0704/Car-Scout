import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notifySuccess } from "../utils/toastBus";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      notifySuccess("Signed in successfully.");
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoDot} />
          CarScout
        </div>
        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.sub}>Sign in to your account</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={submit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input type="email" value={form.email} onChange={(e) => handle("email", e.target.value)} placeholder="you@example.com" required style={styles.input} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input type="password" value={form.password} onChange={(e) => handle("password", e.target.value)} placeholder="••••••••" required style={styles.input} />
          </div>
          <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p style={styles.switchText}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.switchLink}>Create one</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { background: "#0e0f13", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { background: "#1c1f2a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 420 },
  logo: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#f0f0ee", display: "flex", alignItems: "center", gap: 8, marginBottom: 28 },
  logoDot: { display: "inline-block", width: 8, height: 8, background: "#e8f542", borderRadius: "50%" },
  title: { fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: "#f0f0ee", margin: "0 0 6px" },
  sub: { fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 28px" },
  error: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "10px 14px", borderRadius: 8, fontSize: 14, marginBottom: 20 },
  form: { display: "flex", flexDirection: "column", gap: 18 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 },
  input: { background: "#16181f", border: "1px solid rgba(255,255,255,0.1)", color: "#f0f0ee", padding: "11px 14px", borderRadius: 8, fontSize: 14, fontFamily: "inherit" },
  btn: { background: "#e8f542", color: "#0e0f13", border: "none", padding: "13px", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne', sans-serif", marginTop: 4 },
  switchText: { textAlign: "center", fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 24 },
  switchLink: { color: "#e8f542", textDecoration: "none", fontWeight: 500 },
};
