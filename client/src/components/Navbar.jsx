import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/"); };
  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <span style={styles.logoDot} />
          CarScout
        </Link>

        {/* Desktop links */}
        <div style={styles.links}>
          <Link to="/cars" style={{ ...styles.link, ...(isActive("/cars") ? styles.linkActive : {}) }}>Browse</Link>
          {user?.role !== "buyer" && (
            <Link to="/list-car" style={{ ...styles.link, ...(isActive("/list-car") ? styles.linkActive : {}) }}>Sell a car</Link>
          )}
          {user && (
            <Link to="/messages" style={{ ...styles.link, ...(isActive("/messages") ? styles.linkActive : {}) }}>Messages</Link>
          )}
        </div>

        {/* Auth area */}
        <div style={styles.authArea}>
          {user ? (
            <div style={styles.userMenu}>
              <Link to="/dashboard" style={styles.avatarBtn}>
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} style={styles.avatarImg} />
                  : <div style={styles.avatarInitials}>{user.name?.[0]?.toUpperCase()}</div>
                }
                <span style={styles.userName}>{user.name.split(" ")[0]}</span>
              </Link>
              <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
            </div>
          ) : (
            <div style={styles.authBtns}>
              <Link to="/login" style={styles.btnOutline}>Sign in</Link>
              <Link to="/register" style={styles.btnAccent}>Get started</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: { background: "#0e0f13", borderBottom: "1px solid rgba(255,255,255,0.07)", position: "sticky", top: 0, zIndex: 100 },
  inner: { maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", height: 60, gap: 32 },
  logo: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#f0f0ee", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 },
  logoDot: { display: "inline-block", width: 8, height: 8, background: "#e8f542", borderRadius: "50%" },
  links: { display: "flex", gap: 24, flex: 1 },
  link: { color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: 14, transition: "color .2s" },
  linkActive: { color: "#f0f0ee" },
  authArea: { marginLeft: "auto" },
  authBtns: { display: "flex", gap: 10 },
  btnOutline: { border: "1px solid rgba(255,255,255,0.15)", padding: "7px 16px", borderRadius: 8, fontSize: 13, color: "#f0f0ee", textDecoration: "none", background: "transparent" },
  btnAccent: { background: "#e8f542", color: "#0e0f13", padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" },
  userMenu: { display: "flex", alignItems: "center", gap: 12 },
  avatarBtn: { display: "flex", alignItems: "center", gap: 8, textDecoration: "none" },
  avatarImg: { width: 32, height: 32, borderRadius: "50%", objectFit: "cover" },
  avatarInitials: { width: 32, height: 32, borderRadius: "50%", background: "#e8f542", color: "#0e0f13", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 },
  userName: { color: "#f0f0ee", fontSize: 14 },
  logoutBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer" },
};
