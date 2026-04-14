import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import CarCard from "../components/CarCard";
import { timeAgo } from "../utils/helpers";

export default function Profile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/users/${id}`).then((r) => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ color: "rgba(255,255,255,0.4)", padding: 60, textAlign: "center", background: "#0e0f13", minHeight: "100vh" }}>Loading...</div>;
  if (!data) return null;

  const { user, listings } = data;

  return (
    <div style={{ background: "#0e0f13", minHeight: "100vh", paddingBottom: 60 }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ background: "#1c1f2a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 28, marginBottom: 32, display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#e8f542", color: "#0e0f13", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 28, flexShrink: 0 }}>
            {user.avatar ? <img src={user.avatar} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }} alt={user.name} /> : user.name?.[0]}
          </div>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: "#f0f0ee", margin: "0 0 6px" }}>{user.name}</h1>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {user.isVerified && <span style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", fontSize: 12, padding: "2px 8px", borderRadius: 4 }}>✓ Verified</span>}
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textTransform: "capitalize" }}>{user.role}</span>
              {user.city && <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>📍 {user.city}</span>}
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Member since {new Date(user.createdAt).getFullYear()}</span>
            </div>
            {user.bio && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "10px 0 0", maxWidth: 500 }}>{user.bio}</p>}
          </div>
        </div>

        {listings?.length > 0 && (
          <>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: "#f0f0ee", margin: "0 0 18px" }}>Active listings</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {listings.map((car) => <CarCard key={car._id} car={car} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
