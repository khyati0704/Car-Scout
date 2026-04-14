import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import InspectionReport from "../components/InspectionReport";
import { carService } from "../services/carService";
import { chatService } from "../services/chatService";
import api from "../services/api";
import { testDriveService } from "../services/testDriveService";
import { notifyError, notifyInfo, notifySuccess } from "../utils/toastBus";
import {
  calculateMonthlyEMI,
  conditionInfo,
  formatMileage,
  formatPrice,
  getFinanceSnapshot,
  getPriceBand,
  timeAgo,
} from "../utils/helpers";

const toDateTimeInputValue = (date) => {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() - next.getTimezoneOffset());
  return next.toISOString().slice(0, 16);
};

const getDefaultScheduleValue = () => {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(11, 0, 0, 0);
  return toDateTimeInputValue(next);
};

export default function CarDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [msgText, setMsgText] = useState("Hi, I am interested in this car. Is it still available?");
  const [contacting, setContacting] = useState(false);
  const [tab, setTab] = useState("details");
  const [downPayment, setDownPayment] = useState(0);
  const [loanYears, setLoanYears] = useState(5);
  const [testDriveForm, setTestDriveForm] = useState({
    scheduledFor: getDefaultScheduleValue(),
    location: "",
    notes: "",
  });
  const [scheduling, setScheduling] = useState(false);
  const [scheduleFeedback, setScheduleFeedback] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await carService.getCar(id);
        const nextCar = response.data.car;
        setCar(nextCar);
        setDownPayment(Math.round(Number(nextCar.price || 0) * 0.2));
        setTestDriveForm((current) => ({
          ...current,
          location: [nextCar.city, nextCar.state].filter(Boolean).join(", ") || "Seller location",
        }));

        api
          .get(`/inspections/car/${id}`)
          .then((inspectionResponse) => setInspection(inspectionResponse.data.inspection))
          .catch(() => {});
      } catch {
        navigate("/cars");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, navigate]);

  const handleContact = async () => {
    if (!user) {
      notifyInfo("Please sign in to contact the seller.");
      return navigate("/login");
    }
    if (!msgText.trim()) return;

    setContacting(true);
    try {
      const response = await chatService.startConversation(car._id, msgText);
      notifySuccess("Conversation started with the seller.");
      navigate(`/messages/${response.data.conversation._id}`);
    } catch (error) {
      notifyError(error.response?.data?.error || "Failed to send message.");
    } finally {
      setContacting(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      notifyInfo("Please sign in to save this car.");
      return navigate("/login");
    }
    const response = await api.post(`/users/save/${car._id}`);
    notifySuccess(response.data.saved ? "Car saved to your shortlist." : "Car removed from your shortlist.");
  };

  const handleScheduleTestDrive = async () => {
    if (!user) {
      notifyInfo("Please sign in to request a test drive.");
      return navigate("/login");
    }

    setScheduling(true);
    setScheduleFeedback("");
    try {
      const response = await testDriveService.createTestDrive({
        carId: car._id,
        scheduledFor: testDriveForm.scheduledFor,
        location: testDriveForm.location,
        notes: testDriveForm.notes,
      });

      const nextTestDrive = response.data.testDrive;
      setScheduleFeedback(
        `Test drive requested for ${new Date(nextTestDrive.scheduledFor).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })}.`
      );
      notifySuccess("Test-drive request sent successfully.");
      setTestDriveForm((current) => ({ ...current, notes: "" }));
      setMsgText(
        `Hi, I have requested a test drive for ${new Date(nextTestDrive.scheduledFor).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })}. Please let me know if anything changes.`
      );
    } catch (error) {
      const message = error.response?.data?.error || "Could not schedule the test drive.";
      setScheduleFeedback(message);
      notifyError(message);
    } finally {
      setScheduling(false);
    }
  };

  const finance = useMemo(() => {
    if (!car) return getFinanceSnapshot(0);
    return {
      downPayment,
      monthly: calculateMonthlyEMI(car.price, downPayment, 9.5, loanYears * 12),
      annualRate: 9.5,
      termMonths: loanYears * 12,
    };
  }, [car, downPayment, loanYears]);

  if (loading) return <div style={styles.loader}>Loading car details...</div>;
  if (!car) return null;

  const condition = conditionInfo(car.condition);
  const priceBand = getPriceBand(car);
  const isSeller = user?._id === car.seller._id;

  const specs = [
    ["Year", car.year],
    ["Mileage", formatMileage(car.mileage)],
    ["Fuel type", car.fuelType],
    ["Transmission", car.transmission?.toUpperCase() || "-"],
    ["Body type", car.bodyType || "-"],
    ["Color", car.color || "-"],
    ["Condition", condition.label],
    ["Location", [car.city, car.state].filter(Boolean).join(", ") || "-"],
    ["Views", car.views || 0],
    ["Listed", timeAgo(car.createdAt)],
  ];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.breadcrumb}>
          <Link to="/cars" style={styles.breadcrumbLink}>Back to listings</Link>
        </div>

        <div style={styles.layout}>
          <div style={styles.left}>
            <div style={styles.imageWrap}>
              {car.images?.length ? (
                <img src={car.images[activeImg]} alt={`${car.make} ${car.model}`} style={styles.mainImage} />
              ) : (
                <div style={styles.placeholder}>No images uploaded</div>
              )}
              <div
                style={{
                  ...styles.flag,
                  color: condition.color,
                  borderColor: `${condition.color}44`,
                  background: `${condition.color}1a`,
                }}
              >
                {condition.label}
              </div>
              <div style={styles.scoreTag}>{car.aiScore ? `AI ${car.aiScore}/10` : "AI pending"}</div>
            </div>

            {car.images?.length > 1 && (
              <div style={styles.thumbRow}>
                {car.images.map((img, index) => (
                  <img
                    key={`${img}-${index}`}
                    src={img}
                    alt="car preview"
                    onClick={() => setActiveImg(index)}
                    style={{ ...styles.thumb, ...(activeImg === index ? styles.thumbActive : {}) }}
                  />
                ))}
              </div>
            )}

            <div style={styles.tabRow}>
              {["details", "inspection", "seller"].map((value) => (
                <button key={value} onClick={() => setTab(value)} style={{ ...styles.tab, ...(tab === value ? styles.tabActive : {}) }}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>

            {tab === "details" && (
              <section style={styles.block}>
                <div style={styles.blockHeader}>
                  <div>
                    <div style={styles.eyebrow}>Vehicle snapshot</div>
                    <h2 style={styles.blockTitle}>{car.year} {car.make} {car.model}</h2>
                  </div>
                  <div style={styles.confidence}>{priceBand.label}</div>
                </div>

                <div style={styles.specGrid}>
                  {specs.map(([label, value]) => (
                    <div key={label} style={styles.specCard}>
                      <div style={styles.specLabel}>{label}</div>
                      <div style={styles.specValue}>{value}</div>
                    </div>
                  ))}
                </div>

                {car.features?.length > 0 && (
                  <div style={styles.sectionGroup}>
                    <h3 style={styles.sectionTitle}>Highlights</h3>
                    <div style={styles.badgeRow}>
                      {car.features.map((feature) => (
                        <span key={feature} style={styles.badge}>{feature}</span>
                      ))}
                    </div>
                  </div>
                )}

                {car.description && (
                  <div style={styles.sectionGroup}>
                    <h3 style={styles.sectionTitle}>Seller notes</h3>
                    <p style={styles.description}>{car.description}</p>
                  </div>
                )}
              </section>
            )}

            {tab === "inspection" && (
              <section style={styles.block}>
                {inspection ? (
                  <InspectionReport inspection={inspection} />
                ) : (
                  <div style={styles.emptyBlock}>
                    <h3 style={styles.blockTitle}>Inspection report not available yet</h3>
                    <p style={styles.emptyText}>The listing is live, but the AI condition summary has not been generated or attached yet.</p>
                    {isSeller && <Link to="/dashboard" style={styles.primaryLink}>Manage this listing</Link>}
                  </div>
                )}
              </section>
            )}

            {tab === "seller" && (
              <section style={styles.block}>
                <div style={styles.sellerCard}>
                  {car.seller.avatar ? (
                    <img src={car.seller.avatar} alt={car.seller.name} style={styles.sellerAvatar} />
                  ) : (
                    <div style={styles.sellerFallback}>{car.seller.name?.[0]}</div>
                  )}
                  <div>
                    <h3 style={styles.blockTitle}>{car.seller.name}</h3>
                    <p style={styles.sellerMeta}>{car.seller.city || "Location not shared"}</p>
                    <p style={styles.sellerMeta}>Member since {new Date(car.seller.createdAt).getFullYear()}</p>
                    {car.seller.isVerified && <span style={styles.verified}>Verified seller</span>}
                  </div>
                </div>
                <Link to={`/profile/${car.seller._id}`} style={styles.secondaryLink}>View seller profile</Link>
              </section>
            )}
          </div>

          <aside style={styles.right}>
            <div style={styles.panel}>
              <div style={styles.price}>{formatPrice(car.price)}</div>
              <h1 style={styles.heading}>{car.year} {car.make} {car.model}</h1>
              <p style={styles.meta}>{formatMileage(car.mileage)} · {car.fuelType} · {car.transmission?.toUpperCase() || "-"}</p>
              <div style={styles.marketChip}>{priceBand.label}</div>

              <div style={styles.divider} />

              <div style={styles.financeHeader}>
                <div>
                  <div style={styles.panelLabel}>Finance estimate</div>
                  <div style={styles.financeValue}>
                    {formatPrice(finance.monthly)}
                    <span style={styles.financeSuffix}> / month</span>
                  </div>
                </div>
                <div style={styles.ratePill}>{finance.annualRate}% APR</div>
              </div>

              <div style={styles.sliderGroup}>
                <label style={styles.inputLabel}>Down payment</label>
                <input
                  type="range"
                  min="0"
                  max={car.price}
                  step="50000"
                  value={downPayment}
                  onChange={(event) => setDownPayment(Number(event.target.value))}
                />
                <div style={styles.sliderMeta}>
                  <span>{formatPrice(0)}</span>
                  <strong>{formatPrice(downPayment)}</strong>
                  <span>{formatPrice(car.price)}</span>
                </div>
              </div>

              <div style={styles.termRow}>
                {[3, 5, 7].map((years) => (
                  <button key={years} onClick={() => setLoanYears(years)} style={{ ...styles.termBtn, ...(loanYears === years ? styles.termBtnActive : {}) }}>
                    {years} years
                  </button>
                ))}
              </div>

              <div style={styles.financeGrid}>
                <FinanceStat label="Estimated EMI" value={formatPrice(finance.monthly)} />
                <FinanceStat label="Down payment" value={formatPrice(finance.downPayment)} />
                <FinanceStat label="Loan term" value={`${loanYears} years`} />
                <FinanceStat label="Seller response" value={car.negotiable ? "Negotiable" : "Fixed price"} />
              </div>

              <div style={styles.divider} />

              {isSeller ? (
                <Link to={`/list-car?edit=${car._id}`} style={styles.primaryLink}>Edit listing</Link>
              ) : (
                <div style={styles.contactArea}>
                  <textarea value={msgText} onChange={(event) => setMsgText(event.target.value)} rows={4} style={styles.textarea} />
                  <button onClick={handleContact} disabled={contacting || !msgText.trim()} style={{ ...styles.primaryButton, opacity: contacting || !msgText.trim() ? 0.55 : 1 }}>
                    {contacting ? "Sending..." : "Contact seller"}
                  </button>
                  <button
                    onClick={() => setMsgText(`Hi, I want to schedule a test drive for the ${car.year} ${car.make} ${car.model}. What time works for you?`)}
                    style={styles.secondaryButton}
                  >
                    Prepare test-drive message
                  </button>
                  <button onClick={handleSave} style={styles.secondaryButton}>Save this car</button>

                  <div style={styles.scheduleCard}>
                    <div style={styles.scheduleHeader}>
                      <div>
                        <div style={styles.panelLabel}>Test drive</div>
                        <div style={styles.scheduleTitle}>Request a visit directly from this listing</div>
                      </div>
                    </div>

                    <label style={styles.formField}>
                      <span style={styles.formLabel}>Preferred date and time</span>
                      <input
                        type="datetime-local"
                        value={testDriveForm.scheduledFor}
                        onChange={(event) => setTestDriveForm((current) => ({ ...current, scheduledFor: event.target.value }))}
                        style={styles.formInput}
                      />
                    </label>

                    <label style={styles.formField}>
                      <span style={styles.formLabel}>Meeting location</span>
                      <input
                        type="text"
                        value={testDriveForm.location}
                        onChange={(event) => setTestDriveForm((current) => ({ ...current, location: event.target.value }))}
                        style={styles.formInput}
                      />
                    </label>

                    <label style={styles.formField}>
                      <span style={styles.formLabel}>Notes</span>
                      <textarea
                        rows={3}
                        value={testDriveForm.notes}
                        onChange={(event) => setTestDriveForm((current) => ({ ...current, notes: event.target.value }))}
                        style={styles.formInput}
                      />
                    </label>

                    <button
                      onClick={handleScheduleTestDrive}
                      disabled={scheduling || !testDriveForm.scheduledFor || !testDriveForm.location.trim()}
                      style={{ ...styles.primaryButton, opacity: scheduling || !testDriveForm.scheduledFor || !testDriveForm.location.trim() ? 0.55 : 1 }}
                    >
                      {scheduling ? "Requesting..." : "Request test drive"}
                    </button>

                    {scheduleFeedback && (
                      <div style={styles.scheduleFeedback}>{scheduleFeedback}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function FinanceStat({ label, value }) {
  return (
    <div style={styles.financeStat}>
      <div style={styles.financeStatLabel}>{label}</div>
      <div style={styles.financeStatValue}>{value}</div>
    </div>
  );
}

const styles = {
  page: { background: "radial-gradient(circle at top, rgba(34,197,94,0.08), transparent 28%), #020617", minHeight: "100vh", paddingBottom: 72 },
  loader: { minHeight: "100vh", display: "grid", placeItems: "center", color: "#94a3b8", background: "#020617" },
  container: { maxWidth: 1240, margin: "0 auto", padding: "26px 24px" },
  breadcrumb: { marginBottom: 16 },
  breadcrumbLink: { color: "#94a3b8", textDecoration: "none" },
  layout: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: 24, alignItems: "start" },
  left: { display: "flex", flexDirection: "column", gap: 18 },
  imageWrap: { position: "relative", overflow: "hidden", borderRadius: 24, minHeight: 420, background: "#0f172a", border: "1px solid rgba(148,163,184,0.14)" },
  mainImage: { width: "100%", height: "100%", minHeight: 420, objectFit: "cover" },
  placeholder: { minHeight: 420, display: "grid", placeItems: "center", color: "#94a3b8", letterSpacing: "0.12em", textTransform: "uppercase" },
  flag: { position: "absolute", top: 16, left: 16, border: "1px solid transparent", borderRadius: 999, padding: "6px 12px", fontWeight: 700, fontSize: 12 },
  scoreTag: { position: "absolute", top: 16, right: 16, background: "rgba(2,6,23,0.8)", color: "#86efac", borderRadius: 999, padding: "6px 12px", fontWeight: 800, fontSize: 12 },
  thumbRow: { display: "flex", gap: 10, overflowX: "auto" },
  thumb: { width: 92, height: 72, objectFit: "cover", borderRadius: 14, cursor: "pointer", border: "2px solid transparent" },
  thumbActive: { borderColor: "#22c55e" },
  tabRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  tab: { background: "rgba(15,23,42,0.8)", color: "#cbd5e1", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 999, padding: "10px 16px", cursor: "pointer" },
  tabActive: { background: "rgba(34,197,94,0.16)", color: "#86efac", borderColor: "rgba(34,197,94,0.32)" },
  block: { background: "rgba(15,23,42,0.86)", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 22, padding: 24 },
  blockHeader: { display: "flex", justifyContent: "space-between", gap: 14, alignItems: "start", flexWrap: "wrap", marginBottom: 18 },
  eyebrow: { color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 11, marginBottom: 6 },
  blockTitle: { margin: 0, fontFamily: "'Syne', sans-serif", color: "#f8fafc", fontSize: 28 },
  confidence: { background: "rgba(148,163,184,0.12)", color: "#e2e8f0", borderRadius: 999, padding: "10px 14px", fontSize: 13, fontWeight: 700 },
  specGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 },
  specCard: { background: "rgba(2,6,23,0.42)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 16, padding: 14 },
  specLabel: { color: "#94a3b8", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 },
  specValue: { color: "#f8fafc", fontSize: 14, fontWeight: 600, textTransform: "capitalize" },
  sectionGroup: { marginTop: 22 },
  sectionTitle: { margin: "0 0 10px", color: "#f8fafc", fontFamily: "'Syne', sans-serif", fontSize: 20 },
  badgeRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  badge: { background: "rgba(34,197,94,0.12)", color: "#86efac", border: "1px solid rgba(34,197,94,0.22)", borderRadius: 999, padding: "8px 12px", fontSize: 13 },
  description: { margin: 0, color: "#cbd5e1", lineHeight: 1.8 },
  emptyBlock: { padding: 10 },
  emptyText: { color: "#94a3b8", lineHeight: 1.7 },
  sellerCard: { display: "flex", gap: 16, alignItems: "center", marginBottom: 18 },
  sellerAvatar: { width: 72, height: 72, borderRadius: "50%", objectFit: "cover" },
  sellerFallback: { width: 72, height: 72, borderRadius: "50%", background: "#22c55e", color: "#052e16", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 28 },
  sellerMeta: { color: "#94a3b8", margin: "4px 0 0" },
  verified: { display: "inline-block", marginTop: 10, background: "rgba(34,197,94,0.16)", color: "#86efac", padding: "6px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 },
  right: { position: "sticky", top: 76 },
  panel: { background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(2,6,23,0.98))", border: "1px solid rgba(148,163,184,0.16)", borderRadius: 24, padding: 24, boxShadow: "0 24px 80px rgba(2,6,23,0.28)" },
  price: { fontFamily: "'Syne', sans-serif", fontSize: 42, color: "#86efac", lineHeight: 1 },
  heading: { margin: "12px 0 8px", fontFamily: "'Syne', sans-serif", fontSize: 28, color: "#f8fafc", lineHeight: 1.1 },
  meta: { margin: 0, color: "#94a3b8", lineHeight: 1.7 },
  marketChip: { display: "inline-flex", marginTop: 14, background: "rgba(148,163,184,0.12)", borderRadius: 999, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, fontWeight: 700 },
  divider: { height: 1, background: "rgba(148,163,184,0.14)", margin: "20px 0" },
  financeHeader: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", marginBottom: 18 },
  panelLabel: { color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 6 },
  financeValue: { color: "#f8fafc", fontFamily: "'Syne', sans-serif", fontSize: 26 },
  financeSuffix: { fontSize: 14, color: "#94a3b8" },
  ratePill: { background: "rgba(34,197,94,0.14)", color: "#86efac", borderRadius: 999, padding: "7px 10px", fontSize: 12, fontWeight: 800 },
  sliderGroup: { marginBottom: 16 },
  inputLabel: { display: "block", color: "#cbd5e1", marginBottom: 8, fontSize: 13 },
  sliderMeta: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, color: "#94a3b8", fontSize: 12, marginTop: 8 },
  termRow: { display: "flex", gap: 8, marginBottom: 18 },
  termBtn: { flex: 1, background: "rgba(15,23,42,0.84)", border: "1px solid rgba(148,163,184,0.18)", color: "#e2e8f0", borderRadius: 12, padding: "10px 12px", cursor: "pointer" },
  termBtnActive: { background: "rgba(34,197,94,0.16)", color: "#86efac", borderColor: "rgba(34,197,94,0.32)" },
  financeGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 },
  financeStat: { background: "rgba(2,6,23,0.42)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 16, padding: 12 },
  financeStatLabel: { color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 },
  financeStatValue: { color: "#f8fafc", fontWeight: 700 },
  contactArea: { display: "flex", flexDirection: "column", gap: 10 },
  textarea: { background: "rgba(2,6,23,0.5)", border: "1px solid rgba(148,163,184,0.18)", color: "#f8fafc", borderRadius: 16, padding: 14, resize: "vertical", minHeight: 110 },
  primaryButton: { background: "#22c55e", color: "#052e16", border: "none", borderRadius: 14, padding: "14px 16px", fontWeight: 800, cursor: "pointer" },
  secondaryButton: { background: "transparent", color: "#e2e8f0", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 14, padding: "12px 16px", cursor: "pointer" },
  primaryLink: { display: "inline-block", background: "#22c55e", color: "#052e16", textDecoration: "none", borderRadius: 14, padding: "12px 16px", fontWeight: 800 },
  secondaryLink: { display: "inline-block", textDecoration: "none", color: "#e2e8f0", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 14, padding: "12px 16px" },
  scheduleCard: { marginTop: 8, background: "rgba(2,6,23,0.45)", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 18, padding: 16 },
  scheduleHeader: { marginBottom: 14 },
  scheduleTitle: { color: "#f8fafc", fontWeight: 700, lineHeight: 1.5 },
  formField: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 },
  formLabel: { color: "#cbd5e1", fontSize: 13 },
  formInput: { background: "rgba(15,23,42,0.8)", border: "1px solid rgba(148,163,184,0.18)", color: "#f8fafc", borderRadius: 12, padding: "11px 12px", fontFamily: "inherit" },
  scheduleFeedback: { color: "#bbf7d0", fontSize: 13, lineHeight: 1.6 },
};
