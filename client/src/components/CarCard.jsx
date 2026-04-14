import { Link } from "react-router-dom";
import { conditionInfo, formatMileage, formatPrice, scoreColor, timeAgo } from "../utils/helpers";

export default function CarCard({ car, onSave, isSaved }) {
  const condition = conditionInfo(car.condition);

  return (
    <div style={styles.card}>
      <Link to={`/cars/${car._id}`} style={styles.link}>
        <div style={styles.imageWrap}>
          {car.images?.[0]
            ? <img src={car.images[0]} alt={`${car.make} ${car.model}`} style={styles.image} />
            : <div style={styles.placeholder}>Car</div>
          }

          <div style={{ ...styles.badge, color: condition.color, borderColor: `${condition.color}44`, background: `${condition.color}1a` }}>
            {condition.label}
          </div>

          <div style={{ ...styles.scoreBadge, color: scoreColor(car.aiScore || 0) }}>
            {car.aiScore ? `AI ${car.aiScore}/10` : "AI pending"}
          </div>
        </div>

        <div style={styles.content}>
          <h3 style={styles.name}>{car.year} {car.make} {car.model}</h3>
          <p style={styles.meta}>
            {formatMileage(car.mileage)} · {car.fuelType} · {car.transmission?.toUpperCase()}
            {car.city ? ` · ${car.city}` : ""}
          </p>

          <div style={styles.footer}>
            <span style={styles.price}>{formatPrice(car.price)}</span>
            <span style={styles.time}>{timeAgo(car.createdAt)}</span>
          </div>
        </div>
      </Link>

      {onSave && (
        <button onClick={() => onSave(car._id)} style={styles.saveBtn} title={isSaved ? "Unsave" : "Save"}>
          {isSaved ? "Saved" : "Save"}
        </button>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(2,6,23,0.98))",
    border: "1px solid rgba(148,163,184,0.14)",
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    transition: "transform .18s ease, border-color .18s ease, box-shadow .18s ease",
    boxShadow: "0 18px 40px rgba(2,6,23,0.18)",
  },
  link: { display: "block", textDecoration: "none" },
  imageWrap: { position: "relative", height: 196, background: "#0f172a", overflow: "hidden" },
  image: { width: "100%", height: "100%", objectFit: "cover" },
  placeholder: { width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" },
  badge: { position: "absolute", top: 12, left: 12, fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 999, border: "1px solid transparent" },
  scoreBadge: { position: "absolute", top: 12, right: 12, fontSize: 11, fontWeight: 800, background: "rgba(2,6,23,0.75)", padding: "5px 10px", borderRadius: 999 },
  content: { padding: "14px 16px 16px" },
  name: { margin: "0 0 6px", fontFamily: "'Syne', sans-serif", fontSize: 18, lineHeight: 1.25, color: "#f8fafc" },
  meta: { margin: "0 0 14px", color: "#94a3b8", fontSize: 13, lineHeight: 1.6 },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  price: { fontFamily: "'Syne', sans-serif", color: "#86efac", fontSize: 22, fontWeight: 800 },
  time: { color: "#94a3b8", fontSize: 12 },
  saveBtn: { position: "absolute", bottom: 16, right: 16, background: "rgba(15,23,42,0.88)", border: "1px solid rgba(148,163,184,0.18)", color: "#f8fafc", borderRadius: 999, padding: "8px 12px", cursor: "pointer" },
};
