import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCars } from "../hooks/useCars";
import CarCard from "../components/CarCard";
import { formatPrice, getFinanceSnapshot } from "../utils/helpers";

const quickFilters = [
  { label: "Electric under ₹20L", search: "electric", minPrice: 500000, maxPrice: 2000000 },
  { label: "Family SUVs", bodyType: "suv" },
  { label: "Low-mileage picks", sortBy: "mileage", order: "asc" },
  { label: "Best AI score", sortBy: "aiScore", order: "desc" },
];

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { cars: featured, loading } = useCars({ limit: 6, sortBy: "createdAt", order: "desc" });

  const marketStats = useMemo(() => {
    const averagePrice = featured.length
      ? Math.round(featured.reduce((sum, car) => sum + Number(car.price || 0), 0) / featured.length)
      : 0;
    const electricCount = featured.filter((car) => car.fuelType === "electric").length;
    const averageViews = featured.length
      ? Math.round(featured.reduce((sum, car) => sum + Number(car.views || 0), 0) / featured.length)
      : 0;

    return { averagePrice, electricCount, averageViews };
  }, [featured]);

  const sampleFinance = getFinanceSnapshot(featured[0]?.price || 1800000);

  const handleSearch = (event) => {
    event.preventDefault();
    navigate(`/cars?search=${encodeURIComponent(search)}`);
  };

  const handleQuickFilter = (config) => {
    const params = new URLSearchParams();
    Object.entries(config).forEach(([key, value]) => {
      if (key !== "label" && value !== undefined && value !== "") params.set(key, value);
    });
    navigate(`/cars?${params.toString()}`);
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroCopy}>
          <div style={styles.badge}>Car marketplace for buyers and sellers</div>
          <h1 style={styles.heroTitle}>Car Scout helps people discover, compare and close better vehicle deals.</h1>
          <p style={styles.heroText}>
            Search verified listings, review AI-backed condition confidence, estimate finance instantly and move from inquiry to negotiation in one flow.
          </p>

          <form onSubmit={handleSearch} style={styles.searchForm}>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search make, model, city or body type"
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchBtn}>Explore listings</button>
          </form>

          <div style={styles.quickFilterRow}>
            {quickFilters.map((filter) => (
              <button key={filter.label} onClick={() => handleQuickFilter(filter)} style={styles.filterChip}>
                {filter.label}
              </button>
            ))}
          </div>

          <div style={styles.heroMetrics}>
            <Metric value="360°" label="virtual-ready listing experience" />
            <Metric value="AI" label="condition and price guidance" />
            <Metric value="EMI" label="instant affordability estimates" />
          </div>
        </div>

        <div style={styles.heroPanel}>
          <div style={styles.panelTop}>
            <div>
              <div style={styles.panelLabel}>Market pulse</div>
              <div style={styles.panelValue}>{formatPrice(marketStats.averagePrice || 1500000)}</div>
            </div>
            <div style={styles.liveDot}>Live</div>
          </div>

          <div style={styles.panelCardGrid}>
            <InsightCard title="Electric picks" value={`${marketStats.electricCount}`} meta="featured cars in the latest feed" />
            <InsightCard title="Average interest" value={`${marketStats.averageViews}`} meta="views per fresh listing" />
            <InsightCard title="Typical upfront" value={formatPrice(sampleFinance.downPayment)} meta="20% down payment estimate" />
            <InsightCard title="Monthly EMI" value={formatPrice(sampleFinance.monthly)} meta="5-year financing snapshot" />
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.eyebrow}>Platform value</div>
            <h2 style={styles.sectionTitle}>Built around real buyer and seller decisions</h2>
          </div>
        </div>
        <div style={styles.featureGrid}>
          <FeatureCard title="Advanced search and compare" description="Filter by make, budget, body type, city, fuel, transmission and AI score, then shortlist your best options side by side." />
          <FeatureCard title="Inspection-led trust" description="Every listing can surface condition details, seller credibility and inspection-based value context so buyers can act with more confidence." />
          <FeatureCard title="Negotiation workflow" description="Message sellers directly, discuss terms, save promising cars and move naturally from discovery to test drive planning." />
          <FeatureCard title="Finance visibility" description="Show down payment and monthly EMI estimates before a buyer even starts a conversation, reducing friction later in the journey." />
        </div>
      </section>

      <section style={styles.sectionAlt}>
        <div style={styles.sectionHeaderWide}>
          <div>
            <div style={styles.eyebrow}>Buyer to seller flow</div>
            <h2 style={styles.sectionTitle}>A clean end-to-end marketplace journey</h2>
          </div>
          <Link to="/dashboard" style={styles.inlineLink}>Open dashboard</Link>
        </div>
        <div style={styles.timeline}>
          <StepCard step="01" title="Discover" description="Browse new and used listings with meaningful filters and market-aware sorting." />
          <StepCard step="02" title="Evaluate" description="Compare price, mileage, AI score, inspection notes and financing fit before committing time." />
          <StepCard step="03" title="Connect" description="Contact sellers, negotiate faster, shortlist top cars and prepare for a test drive." />
          <StepCard step="04" title="Close" description="Use a transparent workflow for decision-making, paperwork and transaction follow-through." />
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeaderWide}>
          <div>
            <div style={styles.eyebrow}>Latest inventory</div>
            <h2 style={styles.sectionTitle}>Fresh cars added to the marketplace</h2>
          </div>
          <Link to="/cars" style={styles.inlineLink}>View all cars</Link>
        </div>

        {loading ? (
          <div style={styles.grid}>
            {[...Array(6)].map((_, index) => <div key={index} style={styles.skeleton} />)}
          </div>
        ) : (
          <div style={styles.grid}>
            {featured.map((car) => <CarCard key={car._id} car={car} />)}
          </div>
        )}
      </section>

      <section style={styles.ctaSection}>
        <div style={styles.ctaCard}>
          <div>
            <div style={styles.eyebrow}>For sellers</div>
            <h2 style={styles.ctaTitle}>List faster, get more qualified leads and manage your pipeline in one place.</h2>
            <p style={styles.ctaText}>Car Scout gives sellers better presentation, communication and demand visibility from the first listing onward.</p>
          </div>
          <div style={styles.ctaActions}>
            <Link to="/list-car" style={styles.primaryCta}>List a car</Link>
            <Link to="/register" style={styles.secondaryCta}>Create account</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ value, label }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricValue}>{value}</div>
      <div style={styles.metricLabel}>{label}</div>
    </div>
  );
}

function FeatureCard({ title, description }) {
  return (
    <article style={styles.featureCard}>
      <h3 style={styles.featureTitle}>{title}</h3>
      <p style={styles.featureText}>{description}</p>
    </article>
  );
}

function StepCard({ step, title, description }) {
  return (
    <article style={styles.stepCard}>
      <div style={styles.step}>{step}</div>
      <h3 style={styles.stepTitle}>{title}</h3>
      <p style={styles.stepText}>{description}</p>
    </article>
  );
}

function InsightCard({ title, value, meta }) {
  return (
    <div style={styles.insightCard}>
      <div style={styles.insightTitle}>{title}</div>
      <div style={styles.insightValue}>{value}</div>
      <div style={styles.insightMeta}>{meta}</div>
    </div>
  );
}

const styles = {
  page: { background: "linear-gradient(180deg, #011101 0%, #02170e 55%, #071702 100%)", minHeight: "100vh", color: "#f8fafc" },
  hero: { maxWidth: 1240, margin: "0 auto", padding: "72px 24px 32px", display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(300px, 0.9fr)", gap: 22, alignItems: "stretch" },
  heroCopy: { padding: 8 },
  badge: { display: "inline-flex", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(11, 58, 28, 0.28)", color: "#86efac", borderRadius: 999, padding: "8px 14px", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 18 },
  heroTitle: { fontFamily: "'Syne', sans-serif", fontSize: 68, lineHeight: 0.98, letterSpacing: "-0.04em", margin: 0, maxWidth: 760 },
  heroText: { color: "#94a3b8", fontSize: 17, lineHeight: 1.75, maxWidth: 640, margin: "18px 0 28px" },
  searchForm: { display: "flex", gap: 10, background: "rgba(10, 30, 11, 0.82)", padding: 8, borderRadius: 20, border: "1px solid rgba(148,163,184,0.18)", maxWidth: 680 },
  searchInput: { flex: 1, background: "transparent", border: "none", color: "#f8fafc", padding: "14px 16px", fontSize: 15, outline: "none" },
  searchBtn: { border: "none", background: "#22c55e", color: "#052e16", padding: "14px 22px", borderRadius: 14, fontWeight: 800, cursor: "pointer" },
  quickFilterRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 },
  filterChip: { background: "rgba(15,23,42,0.8)", color: "#cbd5e1", border: "1px solid rgba(148,163,184,0.16)", borderRadius: 999, padding: "10px 14px", cursor: "pointer" },
  heroMetrics: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 28, maxWidth: 720 },
  metricCard: { background: "rgba(15,23,42,0.54)", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 18, padding: 18 },
  metricValue: { fontFamily: "'Syne', sans-serif", fontSize: 28, color: "#f8fafc" },
  metricLabel: { color: "#94a3b8", fontSize: 13, marginTop: 6, lineHeight: 1.5 },
  heroPanel: { background: "linear-gradient(160deg, rgba(15,23,42,0.95), rgba(6,78,59,0.78))", border: "1px solid rgba(148,163,184,0.16)", borderRadius: 28, padding: 24, boxShadow: "0 24px 80px rgba(2,6,23,0.38)" },
  panelTop: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 },
  panelLabel: { color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 11, marginBottom: 6 },
  panelValue: { fontFamily: "'Syne', sans-serif", fontSize: 42, color: "#f8fafc" },
  liveDot: { background: "rgba(34,197,94,0.16)", color: "#86efac", padding: "6px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 },
  panelCardGrid: { display: "grid", gap: 12 },
  insightCard: { background: "rgba(2,6,23,0.4)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 18, padding: 16 },
  insightTitle: { color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em" },
  insightValue: { fontFamily: "'Syne', sans-serif", fontSize: 26, color: "#f8fafc", marginTop: 8 },
  insightMeta: { color: "#cbd5e1", fontSize: 13, marginTop: 6, lineHeight: 1.5 },
  section: { maxWidth: 1240, margin: "0 auto", padding: "32px 24px 24px" },
  sectionAlt: { maxWidth: 1240, margin: "0 auto", padding: "24px 24px 24px" },
  sectionHeader: { marginBottom: 20 },
  sectionHeaderWide: { display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap", marginBottom: 20 },
  eyebrow: { color: "#22c55e", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 },
  sectionTitle: { margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 34, lineHeight: 1.1 },
  inlineLink: { color: "#86efac", textDecoration: "none", fontWeight: 700 },
  featureGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 },
  featureCard: { background: "rgba(15,23,42,0.72)", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 22, padding: 22 },
  featureTitle: { margin: "0 0 10px", fontFamily: "'Syne', sans-serif", fontSize: 20 },
  featureText: { margin: 0, color: "#94a3b8", lineHeight: 1.7, fontSize: 14 },
  timeline: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 },
  stepCard: { background: "linear-gradient(180deg, rgba(15,23,42,0.82), rgba(2,6,23,0.95))", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 22, padding: 22 },
  step: { color: "#22c55e", fontFamily: "'Syne', sans-serif", fontSize: 28, marginBottom: 18 },
  stepTitle: { margin: "0 0 8px", fontFamily: "'Syne', sans-serif", fontSize: 20 },
  stepText: { margin: 0, color: "#94a3b8", lineHeight: 1.7, fontSize: 14 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 },
  skeleton: { height: 300, borderRadius: 18, background: "linear-gradient(90deg, rgba(15,23,42,0.7), rgba(30,41,59,0.7), rgba(15,23,42,0.7))", animation: "pulse 1.5s infinite" },
  ctaSection: { maxWidth: 1240, margin: "0 auto", padding: "24px 24px 80px" },
  ctaCard: { background: "linear-gradient(135deg, rgba(6,78,59,0.9), rgba(15,23,42,0.98))", border: "1px solid rgba(110,231,183,0.25)", borderRadius: 30, padding: 32, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", flexWrap: "wrap" },
  ctaTitle: { margin: "0 0 12px", fontFamily: "'Syne', sans-serif", fontSize: 34, maxWidth: 720 },
  ctaText: { margin: 0, color: "#d1fae5", lineHeight: 1.7, maxWidth: 720 },
  ctaActions: { display: "flex", gap: 12, flexWrap: "wrap" },
  primaryCta: { background: "#f8fafc", color: "#052e16", textDecoration: "none", padding: "14px 22px", borderRadius: 14, fontWeight: 800 },
  secondaryCta: { background: "transparent", color: "#f8fafc", textDecoration: "none", padding: "14px 22px", borderRadius: 14, border: "1px solid rgba(248,250,252,0.28)", fontWeight: 700 },
};
