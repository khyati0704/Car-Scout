import { useEffect, useState } from "react";
import { notifyInfo, notifySuccess } from "../utils/toastBus";

const MAKES = ["Toyota", "Honda", "Hyundai", "Maruti Suzuki", "Tata", "Mahindra", "BMW", "Mercedes-Benz", "Audi", "Ford", "Volkswagen", "Kia", "MG", "Jeep"];
const BODY_TYPES = ["sedan", "suv", "hatchback", "coupe", "pickup", "van"];
const FUEL_TYPES = ["petrol", "diesel", "electric", "hybrid", "cng"];
const TRANSMISSIONS = ["manual", "automatic", "cvt", "amt"];
const CONDITIONS = ["new", "like-new", "good", "fair", "poor"];
const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "year_desc", label: "Newest year" },
  { value: "mileage_asc", label: "Lowest mileage" },
  { value: "aiScore_desc", label: "Best AI score" },
];

const DEFAULT_FILTERS = {
  search: "",
  make: "",
  bodyType: "",
  fuelType: "",
  transmission: "",
  condition: "",
  minPrice: "",
  maxPrice: "",
  minYear: "",
  maxYear: "",
  city: "",
  sortBy: "createdAt",
  order: "desc",
};

export default function SearchFilters({ filters, onFilterChange }) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState({ ...DEFAULT_FILTERS, ...filters });

  useEffect(() => {
    setDraft((current) => ({ ...current, ...filters }));
  }, [filters]);

  const setDraftValue = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const handleSort = (value) => {
    const [sortBy, order] = value.split("_");
    setDraft((current) => ({ ...current, sortBy, order }));
  };

  const applyFilters = () => {
    onFilterChange(draft);
    notifySuccess("Filters applied.");
  };

  const clearFilters = () => {
    setDraft(DEFAULT_FILTERS);
    onFilterChange(DEFAULT_FILTERS);
    notifyInfo("Filters reset.");
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyFilters();
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.searchRow}>
        <input
          type="text"
          placeholder="Search make, model, body type, feature, city or keyword"
          value={draft.search || ""}
          onChange={(event) => setDraftValue("search", event.target.value)}
          onKeyDown={handleSearchKeyDown}
          style={styles.searchInput}
        />

        <select
          value={`${draft.sortBy || "createdAt"}_${draft.order || "desc"}`}
          onChange={(event) => handleSort(event.target.value)}
          style={styles.select}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <button onClick={applyFilters} style={styles.applyBtn}>Search</button>
        <button onClick={() => setExpanded((value) => !value)} style={styles.filterBtn}>
          {expanded ? "Hide filters" : "More filters"}
        </button>
      </div>

      {expanded && (
        <div style={styles.filtersGrid}>
          <Field label="Make">
            <select value={draft.make || ""} onChange={(event) => setDraftValue("make", event.target.value)} style={styles.select}>
              <option value="">Any make</option>
              {MAKES.map((make) => <option key={make} value={make}>{make}</option>)}
            </select>
          </Field>

          <Field label="Body type">
            <select value={draft.bodyType || ""} onChange={(event) => setDraftValue("bodyType", event.target.value)} style={styles.select}>
              <option value="">Any body type</option>
              {BODY_TYPES.map((bodyType) => <option key={bodyType} value={bodyType}>{bodyType.toUpperCase()}</option>)}
            </select>
          </Field>

          <Field label="Fuel type">
            <select value={draft.fuelType || ""} onChange={(event) => setDraftValue("fuelType", event.target.value)} style={styles.select}>
              <option value="">Any fuel</option>
              {FUEL_TYPES.map((fuel) => <option key={fuel} value={fuel}>{fuel.charAt(0).toUpperCase() + fuel.slice(1)}</option>)}
            </select>
          </Field>

          <Field label="Transmission">
            <select value={draft.transmission || ""} onChange={(event) => setDraftValue("transmission", event.target.value)} style={styles.select}>
              <option value="">Any gearbox</option>
              {TRANSMISSIONS.map((transmission) => <option key={transmission} value={transmission}>{transmission.toUpperCase()}</option>)}
            </select>
          </Field>

          <Field label="Condition">
            <select value={draft.condition || ""} onChange={(event) => setDraftValue("condition", event.target.value)} style={styles.select}>
              <option value="">Any condition</option>
              {CONDITIONS.map((condition) => <option key={condition} value={condition}>{condition}</option>)}
            </select>
          </Field>

          <Field label="Min price (₹)">
            <input type="number" placeholder="300000" value={draft.minPrice || ""} onChange={(event) => setDraftValue("minPrice", event.target.value)} style={styles.input} />
          </Field>

          <Field label="Max price (₹)">
            <input type="number" placeholder="2500000" value={draft.maxPrice || ""} onChange={(event) => setDraftValue("maxPrice", event.target.value)} style={styles.input} />
          </Field>

          <Field label="Min year">
            <input type="number" placeholder="2019" value={draft.minYear || ""} onChange={(event) => setDraftValue("minYear", event.target.value)} style={styles.input} />
          </Field>

          <Field label="Max year">
            <input type="number" placeholder="2026" value={draft.maxYear || ""} onChange={(event) => setDraftValue("maxYear", event.target.value)} style={styles.input} />
          </Field>

          <Field label="City">
            <input type="text" placeholder="Mumbai" value={draft.city || ""} onChange={(event) => setDraftValue("city", event.target.value)} style={styles.input} />
          </Field>

          <div style={styles.actionsRow}>
            <button onClick={clearFilters} style={styles.clearBtn}>Reset filters</button>
            <button onClick={applyFilters} style={styles.applyBtn}>Apply filters</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

const controlStyles = {
  background: "#09111f",
  border: "1px solid rgba(148,163,184,0.18)",
  color: "#e2e8f0",
  padding: "11px 12px",
  borderRadius: 12,
  fontSize: 13,
  fontFamily: "inherit",
};

const styles = {
  wrap: {
    background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(17,24,39,0.92))",
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    boxShadow: "0 24px 60px rgba(15,23,42,0.2)",
  },
  searchRow: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 220px auto auto", gap: 10, alignItems: "center" },
  searchInput: { ...controlStyles },
  select: { ...controlStyles },
  input: { ...controlStyles },
  applyBtn: { background: "#22c55e", border: "1px solid #22c55e", color: "#052e16", padding: "11px 16px", borderRadius: 12, cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" },
  filterBtn: { background: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.18)", color: "#e2e8f0", padding: "11px 16px", borderRadius: 12, cursor: "pointer", whiteSpace: "nowrap" },
  filtersGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(148,163,184,0.14)" },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em" },
  actionsRow: { gridColumn: "1/-1", display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 },
  clearBtn: { background: "transparent", border: "1px solid rgba(148,163,184,0.18)", color: "#f8fafc", padding: "11px 16px", borderRadius: 12, cursor: "pointer" },
};
