import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { carService } from "../services/carService";
import { formatPrice } from "../utils/helpers";
import api from "../services/api";
import { notifyError, notifySuccess } from "../utils/toastBus";

const STEPS = ["Basic info", "Details", "Photos & description", "Preview"];

export default function ListCar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [priceHint, setPriceHint] = useState(null);

  const [form, setForm] = useState({
    make: "", model: "", year: new Date().getFullYear(), price: "",
    mileage: "", fuelType: "petrol", transmission: "manual",
    condition: "good", bodyType: "sedan", color: "", city: "",
    state: "", negotiable: true, description: "", features: [],
  });

  // Load existing car data if editing
  useEffect(() => {
    if (editId) {
      carService.getCar(editId).then((res) => {
        const c = res.data.car;
        setForm({ make: c.make, model: c.model, year: c.year, price: c.price,
          mileage: c.mileage, fuelType: c.fuelType, transmission: c.transmission,
          condition: c.condition, bodyType: c.bodyType || "sedan", color: c.color || "",
          city: c.city || "", state: c.state || "", negotiable: c.negotiable,
          description: c.description || "", features: c.features || [] });
        setImagePreviews(c.images || []);
      });
    }
  }, [editId]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleFeature = (f) => {
    setForm((p) => ({
      ...p,
      features: p.features.includes(f) ? p.features.filter((x) => x !== f) : [...p.features, f],
    }));
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews((prev) => [...prev, ev.target.result]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (i) => {
    setImagePreviews((p) => p.filter((_, idx) => idx !== i));
    setImageFiles((p) => p.filter((_, idx) => idx !== i));
  };

  const getAIPriceHint = async () => {
    if (!form.make || !form.model || !form.year) return;
    try {
      const res = await api.post("/inspections/price-hint", {
        make: form.make, model: form.model, year: form.year,
        mileage: form.mileage, condition: form.condition,
        fuelType: form.fuelType, transmission: form.transmission,
      });
      setPriceHint(res.data);
      notifySuccess("AI price hint generated.");
    } catch {
      notifyError("Could not generate an AI price hint right now.");
    }
  };

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "features") fd.append(k, JSON.stringify(v));
        else fd.append(k, v);
      });
      imageFiles.forEach((f) => fd.append("images", f));

      if (editId) await carService.updateCar(editId, fd);
      else await carService.createCar(fd);
      notifySuccess(editId ? "Listing updated successfully." : "Listing published successfully.");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save listing.");
    } finally {
      setLoading(false);
    }
  };

  const FEATURES = ["Sunroof", "Leather seats", "360° camera", "Reverse camera", "Android Auto", "Apple CarPlay", "Parking sensors", "Cruise control", "Keyless entry", "Push start", "Alloy wheels", "LED headlights", "ABS", "Airbags", "AC", "Power windows", "Touchscreen"];

  const canNext = [
    form.make && form.model && form.year,
    form.price && form.mileage && form.fuelType && form.transmission && form.condition,
    true,
    true,
  ];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>{editId ? "Edit listing" : "List your car"}</h1>

        {/* Step indicators */}
        <div style={styles.stepRow}>
          {STEPS.map((s, i) => (
            <div key={i} style={styles.stepItem}>
              <div style={{ ...styles.stepCircle, background: i <= step ? "#e8f542" : "rgba(255,255,255,0.1)", color: i <= step ? "#0e0f13" : "rgba(255,255,255,0.4)" }}>
                {i < step ? "✓" : i + 1}
              </div>
              <span style={{ ...styles.stepLabel, color: i === step ? "#f0f0ee" : "rgba(255,255,255,0.35)" }}>{s}</span>
              {i < STEPS.length - 1 && <div style={{ ...styles.stepLine, background: i < step ? "#e8f542" : "rgba(255,255,255,0.1)" }} />}
            </div>
          ))}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.formCard}>
          {/* Step 0: Basic info */}
          {step === 0 && (
            <div style={styles.grid2}>
              <div style={styles.field}><label style={styles.label}>Make *</label>
                <input value={form.make} onChange={(e) => set("make", e.target.value)} placeholder="e.g. Toyota" required style={styles.input} /></div>
              <div style={styles.field}><label style={styles.label}>Model *</label>
                <input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="e.g. Camry" required style={styles.input} /></div>
              <div style={styles.field}><label style={styles.label}>Year *</label>
                <input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} min={1980} max={2026} style={styles.input} /></div>
              <div style={styles.field}><label style={styles.label}>Body type</label>
                <select value={form.bodyType} onChange={(e) => set("bodyType", e.target.value)} style={styles.input}>
                  {["sedan","suv","hatchback","coupe","convertible","pickup","van","wagon"].map((b) => <option key={b} value={b}>{b.charAt(0).toUpperCase()+b.slice(1)}</option>)}
                </select></div>
              <div style={styles.field}><label style={styles.label}>Color</label>
                <input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="e.g. Pearl White" style={styles.input} /></div>
              <div style={styles.field}><label style={styles.label}>City</label>
                <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Surat" style={styles.input} /></div>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div style={styles.grid2}>
              <div style={styles.field}><label style={styles.label}>Price (₹) *</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="e.g. 850000" style={{ ...styles.input, flex: 1 }} />
                  <button type="button" onClick={getAIPriceHint} style={styles.aiBtn} title="Get AI price suggestion">🤖 AI hint</button>
                </div>
                {priceHint && (
                  <div style={styles.priceHint}>
                    Suggested: {formatPrice(priceHint.suggestedPrice)} (Range: {formatPrice(priceHint.minPrice)} – {formatPrice(priceHint.maxPrice)})
                    <div style={{ fontSize: 11, marginTop: 3 }}>{priceHint.reasoning}</div>
                  </div>
                )}
              </div>
              <div style={styles.field}><label style={styles.label}>Mileage (km) *</label>
                <input type="number" value={form.mileage} onChange={(e) => set("mileage", e.target.value)} placeholder="e.g. 45000" style={styles.input} /></div>
              <div style={styles.field}><label style={styles.label}>Fuel type *</label>
                <select value={form.fuelType} onChange={(e) => set("fuelType", e.target.value)} style={styles.input}>
                  {["petrol","diesel","electric","hybrid","cng"].map((f) => <option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>)}
                </select></div>
              <div style={styles.field}><label style={styles.label}>Transmission *</label>
                <select value={form.transmission} onChange={(e) => set("transmission", e.target.value)} style={styles.input}>
                  {["manual","automatic","cvt","amt"].map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                </select></div>
              <div style={styles.field}><label style={styles.label}>Condition *</label>
                <select value={form.condition} onChange={(e) => set("condition", e.target.value)} style={styles.input}>
                  {["new","like-new","good","fair","poor"].map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select></div>
              <div style={styles.field}><label style={styles.label}>Negotiable?</label>
                <select value={form.negotiable} onChange={(e) => set("negotiable", e.target.value === "true")} style={styles.input}>
                  <option value="true">Yes</option><option value="false">No</option>
                </select></div>
            </div>
          )}

          {/* Step 2: Photos + description */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={styles.field}>
                <label style={styles.label}>Photos (up to 10)</label>
                <label style={styles.uploadZone}>
                  <input type="file" multiple accept="image/*" onChange={handleImages} style={{ display: "none" }} />
                  <div style={styles.uploadInner}>📷 Click to upload images</div>
                </label>
                {imagePreviews.length > 0 && (
                  <div style={styles.previewGrid}>
                    {imagePreviews.map((src, i) => (
                      <div key={i} style={styles.previewItem}>
                        <img src={src} alt="" style={styles.previewImg} />
                        <button onClick={() => removeImage(i)} style={styles.removeBtn}>×</button>
                        {i === 0 && <span style={styles.mainTag}>Main</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Description</label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe your car — history, condition, any extras..." rows={5} style={{ ...styles.input, resize: "vertical" }} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Features</label>
                <div style={styles.featuresGrid}>
                  {FEATURES.map((f) => (
                    <label key={f} style={{ ...styles.featCheck, ...(form.features.includes(f) ? styles.featActive : {}) }}>
                      <input type="checkbox" checked={form.features.includes(f)} onChange={() => toggleFeature(f)} style={{ display: "none" }} />
                      {f}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div style={styles.preview}>
              <h3 style={styles.previewTitle}>{form.year} {form.make} {form.model}</h3>
              <div style={styles.previewGrid2}>
                {[["Price", formatPrice(Number(form.price))],["Mileage",`${Number(form.mileage).toLocaleString()} km`],["Fuel",form.fuelType],["Transmission",form.transmission.toUpperCase()],["Condition",form.condition],["City",form.city||"—"]].map(([k,v]) => (
                  <div key={k} style={styles.previewSpec}>
                    <span style={styles.previewKey}>{k}</span>
                    <span style={styles.previewVal}>{v}</span>
                  </div>
                ))}
              </div>
              {imagePreviews.length > 0 && (
                <img src={imagePreviews[0]} alt="Main" style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 10, marginTop: 16 }} />
              )}
              {form.description && <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 16, lineHeight: 1.7 }}>{form.description}</p>}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={styles.navRow}>
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)} style={styles.backBtn}>← Back</button>
          )}
          {step < STEPS.length - 1
            ? <button onClick={() => setStep((s) => s + 1)} disabled={!canNext[step]} style={{ ...styles.nextBtn, opacity: canNext[step] ? 1 : 0.4 }}>Next →</button>
            : <button onClick={submit} disabled={loading} style={{ ...styles.nextBtn, opacity: loading ? 0.6 : 1 }}>{loading ? "Saving..." : editId ? "Update listing" : "Publish listing"}</button>
          }
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { background: "#0e0f13", minHeight: "100vh", paddingBottom: 60 },
  container: { maxWidth: 760, margin: "0 auto", padding: "32px 24px" },
  title: { fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#f0f0ee", margin: "0 0 32px" },
  stepRow: { display: "flex", alignItems: "center", marginBottom: 32, gap: 0 },
  stepItem: { display: "flex", alignItems: "center", gap: 8 },
  stepCircle: { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 },
  stepLabel: { fontSize: 12, whiteSpace: "nowrap" },
  stepLine: { height: 2, width: 32, flexShrink: 0, margin: "0 8px" },
  error: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "10px 14px", borderRadius: 8, fontSize: 14, marginBottom: 20 },
  formCard: { background: "#1c1f2a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "28px 24px", marginBottom: 24 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 },
  field: { display: "flex", flexDirection: "column", gap: 7 },
  label: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 },
  input: { background: "#16181f", border: "1px solid rgba(255,255,255,0.1)", color: "#f0f0ee", padding: "11px 14px", borderRadius: 8, fontSize: 14, fontFamily: "inherit" },
  aiBtn: { background: "rgba(232,245,66,0.1)", border: "1px solid rgba(232,245,66,0.3)", color: "#e8f542", padding: "10px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" },
  priceHint: { background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", padding: "8px 12px", borderRadius: 6, fontSize: 12, marginTop: 4 },
  uploadZone: { border: "2px dashed rgba(255,255,255,0.15)", borderRadius: 10, padding: "28px", textAlign: "center", cursor: "pointer" },
  uploadInner: { color: "rgba(255,255,255,0.4)", fontSize: 14 },
  previewGrid: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 },
  previewItem: { position: "relative", width: 100, height: 75 },
  previewImg: { width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 },
  removeBtn: { position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff", border: "none", width: 20, height: 20, borderRadius: "50%", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  mainTag: { position: "absolute", bottom: 4, left: 4, background: "#e8f542", color: "#0e0f13", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3 },
  featuresGrid: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 },
  featCheck: { background: "#16181f", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", padding: "6px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer" },
  featActive: { background: "rgba(232,245,66,0.08)", border: "1px solid rgba(232,245,66,0.4)", color: "#e8f542" },
  preview: {},
  previewTitle: { fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "#f0f0ee", margin: "0 0 16px" },
  previewGrid2: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  previewSpec: { background: "#16181f", borderRadius: 8, padding: "10px 12px" },
  previewKey: { display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 3 },
  previewVal: { fontSize: 14, fontWeight: 600, color: "#f0f0ee", textTransform: "capitalize" },
  navRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  backBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", padding: "12px 24px", borderRadius: 8, fontSize: 14, cursor: "pointer" },
  nextBtn: { background: "#e8f542", color: "#0e0f13", border: "none", padding: "12px 28px", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne', sans-serif", marginLeft: "auto" },
};
