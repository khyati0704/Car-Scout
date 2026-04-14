import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notifySuccess } from "../utils/toastBus";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "buyer", phone: "", city: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await register(form);
      notifySuccess("Account created successfully.");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}><span style={styles.logoDot} />CarScout</div>
        <h1 style={styles.title}>Create account</h1>
        <p style={styles.sub}>Join the marketplace</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={submit} style={styles.form}>
          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Full name</label>
              <input value={form.name} onChange={(e) => handle("name", e.target.value)} placeholder="Your name" required style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input type="email" value={form.email} onChange={(e) => handle("email", e.target.value)} placeholder="you@example.com" required style={styles.input} />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input type="password" value={form.password} onChange={(e) => handle("password", e.target.value)} placeholder="Min 6 characters" required style={styles.input} />
          </div>
          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Phone (optional)</label>
              <input value={form.phone} onChange={(e) => handle("phone", e.target.value)} placeholder="+91 9876543210" style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>City (optional)</label>
              <input value={form.city} onChange={(e) => handle("city", e.target.value)} placeholder="Surat" style={styles.input} />
            </div>
          </div>

          {/* Role selector */}
          <div style={styles.field}>
            <label style={styles.label}>I want to</label>
            <div style={styles.roleRow}>
              {[
                { val: "buyer", label: "🔍 Buy a car", desc: "Browse and purchase" },
                { val: "seller", label: "🚗 Sell a car", desc: "List and sell vehicles" },
              ].map((r) => (
                <div
                  key={r.val}
                  onClick={() => handle("role", r.val)}
                  style={{ ...styles.roleCard, ...(form.role === r.val ? styles.roleActive : {}) }}
                >
                  <div style={styles.roleLabel}>{r.label}</div>
                  <div style={styles.roleDesc}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={styles.switchText}>
          Already have an account?{" "}
          <Link to="/login" style={styles.switchLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { background: "#0e0f13", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { background: "#1c1f2a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 500 },
  logo: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#f0f0ee", display: "flex", alignItems: "center", gap: 8, marginBottom: 28 },
  logoDot: { display: "inline-block", width: 8, height: 8, background: "#e8f542", borderRadius: "50%" },
  title: { fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: "#f0f0ee", margin: "0 0 6px" },
  sub: { fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 28px" },
  error: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "10px 14px", borderRadius: 8, fontSize: 14, marginBottom: 20 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 },
  input: { background: "#16181f", border: "1px solid rgba(255,255,255,0.1)", color: "#f0f0ee", padding: "11px 14px", borderRadius: 8, fontSize: 14, fontFamily: "inherit" },
  roleRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  roleCard: { background: "#16181f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "border-color .15s" },
  roleActive: { border: "1px solid #16f3f7", background: "rgba(232,245,66,0.05)" },
  roleLabel: { fontSize: 14, fontWeight: 600, color: "#f0f0ee", marginBottom: 3 },
  roleDesc: { fontSize: 12, color: "rgba(255,255,255,0.4)" },
  btn: { background: "#42e0f5", color: "#0e0f13", border: "none", padding: "13px", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne', sans-serif", marginTop: 4 },
  switchText: { textAlign: "center", fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 24 },
  switchLink: { color: "#42e9f5", textDecoration: "none", fontWeight: 500 },
};
