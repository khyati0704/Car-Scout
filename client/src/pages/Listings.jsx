import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCars } from "../hooks/useCars";
import CarCard from "../components/CarCard";
import SearchFilters from "../components/SearchFilters";
import CompareTray from "../components/CompareTray";
import api from "../services/api";
import { formatPrice } from "../utils/helpers";
import { notifyInfo, notifySuccess } from "../utils/toastBus";

const COMPARE_STORAGE_KEY = "car-scout-compare";

export default function Listings() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cars, total, pages, loading, error, filters, updateFilters, setPage } = useCars();
  const [compareIds, setCompareIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(COMPARE_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const urlFilters = Object.fromEntries(searchParams.entries());
    if (Object.keys(urlFilters).length) {
      updateFilters({ ...urlFilters, page: Number(urlFilters.page || 1) });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareIds));
  }, [compareIds]);

  useEffect(() => {
    const nextParams = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined && value !== 1 && value !== 12) {
        nextParams[key] = String(value);
      }
    });
    setSearchParams(nextParams, { replace: true });
  }, [filters, setSearchParams]);

  const compareCars = useMemo(
    () => cars.filter((car) => compareIds.includes(car._id)).slice(0, 3),
    [cars, compareIds]
  );

  const averagePrice = useMemo(() => {
    if (!cars.length) return 0;
    return Math.round(cars.reduce((sum, car) => sum + Number(car.price || 0), 0) / cars.length);
  }, [cars]);

  const avgAiScore = useMemo(() => {
    const scoredCars = cars.filter((car) => car.aiScore);
    if (!scoredCars.length) return null;
    return (scoredCars.reduce((sum, car) => sum + car.aiScore, 0) / scoredCars.length).toFixed(1);
  }, [cars]);

  const toggleSave = async (carId) => {
    if (!user) {
      notifyInfo("Please sign in to save cars.");
      return;
    }

    const response = await api.post(`/users/save/${carId}`);
    notifySuccess(response.data.saved ? "Car saved to your shortlist." : "Car removed from your shortlist.");
  };

  const toggleCompare = (carId) => {
    setCompareIds((current) => {
      if (current.includes(carId)) {
        notifyInfo("Car removed from comparison.");
        return current.filter((id) => id !== carId);
      }
      if (current.length >= 3) {
        notifyInfo("Only three cars can be compared at once. The oldest one was replaced.");
        return [...current.slice(1), carId];
      }
      notifySuccess("Car added to comparison.");
      return [...current, carId];
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <section style={styles.hero}>
          <div>
            <div style={styles.eyebrow}>Marketplace intelligence</div>
            <h1 style={styles.title}>Browse cars with pricing, condition and finance context built in</h1>
            <p style={styles.subtitle}>
              Filter by budget, shortlist up to three cars, then compare price, mileage and AI inspection readiness before you message the seller.
            </p>
          </div>
          <div style={styles.heroStats}>
            <div style={styles.heroStat}><span style={styles.heroStatLabel}>Live listings</span><strong>{total.toLocaleString()}</strong></div>
            <div style={styles.heroStat}><span style={styles.heroStatLabel}>Avg market price</span><strong>{formatPrice(averagePrice)}</strong></div>
            <div style={styles.heroStat}><span style={styles.heroStatLabel}>Avg AI score</span><strong>{avgAiScore || "Pending"}</strong></div>
          </div>
        </section>

        <SearchFilters filters={filters} onFilterChange={updateFilters} />

        {compareCars.length > 0 && (
          <CompareTray
            cars={compareCars}
            onRemove={(carId) => setCompareIds((current) => current.filter((id) => id !== carId))}
            onClear={() => setCompareIds([])}
          />
        )}

        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <div style={styles.grid}>
            {[...Array(6)].map((_, index) => <div key={index} style={styles.skeleton} />)}
          </div>
        ) : cars.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>No exact matches</div>
            <p>Try widening your price range, switching city, or removing one advanced filter.</p>
            <button onClick={() => updateFilters({ search: "", make: "", bodyType: "", fuelType: "", transmission: "", condition: "", city: "" })} style={styles.clearBtn}>
              Clear filters
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {cars.map((car) => {
              const inCompare = compareIds.includes(car._id);
              return (
                <div key={car._id} style={styles.cardWrap}>
                  <CarCard car={car} onSave={toggleSave} />
                  <div style={styles.cardActions}>
                    <button onClick={() => toggleCompare(car._id)} style={{ ...styles.compareBtn, ...(inCompare ? styles.compareBtnActive : {}) }}>
                      {inCompare ? "Shortlisted" : "Add to compare"}
                    </button>
                    <span style={styles.cardHint}>{car.negotiable ? "Negotiable" : "Fixed price"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pages > 1 && (
          <div style={styles.pagination}>
            <button onClick={() => setPage(filters.page - 1)} disabled={filters.page <= 1} style={{ ...styles.pageBtn, opacity: filters.page <= 1 ? 0.4 : 1 }}>
              Previous
            </button>
            {[...Array(Math.min(pages, 7))].map((_, index) => {
              const pageNumber = index + 1;
              return (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  style={{ ...styles.pageBtn, ...(pageNumber === filters.page ? styles.pageBtnActive : {}) }}
                >
                  {pageNumber}
                </button>
              );
            })}
            <button onClick={() => setPage(filters.page + 1)} disabled={filters.page >= pages} style={{ ...styles.pageBtn, opacity: filters.page >= pages ? 0.4 : 1 }}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "radial-gradient(circle at top, rgba(34,197,94,0.08), transparent 30%), #020617", paddingBottom: 72 },
  container: { maxWidth: 1220, margin: "0 auto", padding: "32px 24px" },
  hero: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.8fr)",
    gap: 18,
    alignItems: "stretch",
    marginBottom: 24,
    padding: 28,
    borderRadius: 24,
    border: "1px solid rgba(148,163,184,0.16)",
    background: "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(2,6,23,0.92))",
  },
  eyebrow: { fontSize: 12, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 10 },
  title: { margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 40, lineHeight: 1.05, color: "#f8fafc", maxWidth: 720 },
  subtitle: { margin: "14px 0 0", color: "#94a3b8", fontSize: 15, lineHeight: 1.7, maxWidth: 720 },
  heroStats: { display: "grid", gap: 12 },
  heroStat: { background: "rgba(15,23,42,0.68)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 18, padding: "18px 20px", color: "#f8fafc", display: "flex", flexDirection: "column", gap: 6 },
  heroStatLabel: { color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em" },
  error: { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)", color: "#fca5a5", padding: "12px 16px", borderRadius: 12, marginBottom: 16 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 },
  cardWrap: { display: "flex", flexDirection: "column", gap: 8 },
  cardActions: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  compareBtn: { flex: 1, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(148,163,184,0.18)", color: "#e2e8f0", padding: "10px 12px", borderRadius: 12, cursor: "pointer" },
  compareBtnActive: { background: "rgba(34,197,94,0.16)", borderColor: "rgba(34,197,94,0.4)", color: "#86efac" },
  cardHint: { color: "#94a3b8", fontSize: 12, whiteSpace: "nowrap" },
  skeleton: { height: 320, background: "linear-gradient(90deg, rgba(15,23,42,0.7), rgba(30,41,59,0.7), rgba(15,23,42,0.7))", borderRadius: 20, animation: "pulse 1.5s infinite" },
  empty: { textAlign: "center", padding: "80px 20px", color: "#94a3b8", border: "1px dashed rgba(148,163,184,0.24)", borderRadius: 18 },
  emptyIcon: { fontFamily: "'Syne', sans-serif", fontSize: 28, color: "#f8fafc", marginBottom: 8 },
  clearBtn: { marginTop: 16, background: "#22c55e", color: "#052e16", border: "none", padding: "10px 18px", borderRadius: 999, cursor: "pointer", fontWeight: 700 },
  pagination: { display: "flex", gap: 8, justifyContent: "center", marginTop: 40, flexWrap: "wrap" },
  pageBtn: { background: "rgba(15,23,42,0.82)", border: "1px solid rgba(148,163,184,0.18)", color: "#e2e8f0", padding: "10px 14px", borderRadius: 12, cursor: "pointer" },
  pageBtnActive: { background: "#22c55e", borderColor: "#22c55e", color: "#052e16", fontWeight: 800 },
};
