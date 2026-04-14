import { formatPrice, formatMileage, getCompareSpecs, scoreColor } from "../utils/helpers";

export default function CompareTray({ cars, onRemove, onClear }) {
  if (!cars.length) return null;

  return (
    <section style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Buyer shortlist</div>
          <h2 style={styles.title}>Compare your top picks side by side</h2>
        </div>
        <button onClick={onClear} style={styles.clearBtn}>Clear shortlist</button>
      </div>

      <div style={styles.grid}>
        {cars.map((car) => (
          <article key={car._id} style={styles.card}>
            <div style={styles.cardTop}>
              <div>
                <div style={styles.carName}>{car.year} {car.make} {car.model}</div>
                <div style={styles.meta}>{car.city || "Pan-India"} · {formatMileage(car.mileage)}</div>
              </div>
              <button onClick={() => onRemove(car._id)} style={styles.removeBtn}>Remove</button>
            </div>

            <div style={styles.priceRow}>
              <span style={styles.price}>{formatPrice(car.price)}</span>
              <span style={{ ...styles.score, color: scoreColor(car.aiScore || 0) }}>
                {car.aiScore ? `AI ${car.aiScore}/10` : "AI pending"}
              </span>
            </div>

            <div style={styles.specList}>
              {getCompareSpecs(car).map((spec) => (
                <div key={spec.label} style={styles.specRow}>
                  <span style={styles.specLabel}>{spec.label}</span>
                  <span style={styles.specValue}>{spec.value}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const styles = {
  wrap: {
    background: "linear-gradient(135deg, rgba(17,24,39,0.98), rgba(15,23,42,0.94))",
    border: "1px solid rgba(148,163,184,0.16)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    boxShadow: "0 20px 60px rgba(15,23,42,0.25)",
  },
  header: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 18, flexWrap: "wrap" },
  eyebrow: { fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 },
  title: { margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 24, color: "#f8fafc" },
  clearBtn: { background: "transparent", border: "1px solid rgba(148,163,184,0.3)", color: "#cbd5e1", padding: "10px 14px", borderRadius: 999, cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 },
  card: { background: "rgba(15,23,42,0.7)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 16, padding: 18 },
  cardTop: { display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  carName: { color: "#f8fafc", fontWeight: 700, fontSize: 16, lineHeight: 1.35 },
  meta: { color: "#94a3b8", fontSize: 13, marginTop: 4 },
  removeBtn: { background: "transparent", border: "none", color: "#fda4af", cursor: "pointer", padding: 0 },
  priceRow: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 14 },
  price: { fontFamily: "'Syne', sans-serif", fontSize: 20, color: "#f8fafc", fontWeight: 800 },
  score: { fontSize: 12, fontWeight: 700 },
  specList: { display: "flex", flexDirection: "column", gap: 10 },
  specRow: { display: "flex", justifyContent: "space-between", gap: 12, paddingTop: 10, borderTop: "1px solid rgba(148,163,184,0.12)" },
  specLabel: { color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" },
  specValue: { color: "#e2e8f0", fontSize: 13, fontWeight: 600 },
};
