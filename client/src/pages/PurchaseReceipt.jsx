import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { paymentService } from "../services/paymentService";
import { formatPrice } from "../utils/helpers";
import { notifyError } from "../utils/toastBus";

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function PurchaseReceipt() {
  const { purchaseId } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentService
      .getPurchase(purchaseId)
      .then((response) => setPurchase(response.data.purchase))
      .catch((error) => notifyError(error.response?.data?.error || "Could not load the receipt."))
      .finally(() => setLoading(false));
  }, [purchaseId]);

  if (loading) {
    return <div style={styles.loader}>Loading your receipt...</div>;
  }

  if (!purchase) {
    return (
      <div style={styles.loader}>
        Receipt not found.
      </div>
    );
  }

  const handoverChecklist = purchase.handoverChecklist || [];
  const totalAmount = Number(purchase.totalAmount || purchase.amount || 0);
  const balanceDue = Number(purchase.balanceDue || Math.max(0, totalAmount - Number(purchase.amount || 0)));

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topRow}>
          <div>
            <div style={styles.eyebrow}>Secure booking receipt</div>
            <h1 style={styles.title}>Receipt {purchase.receiptNumber}</h1>
            <p style={styles.subtitle}>
              Booking confirmation verified via Razorpay and stored with the vehicle, buyer, seller, and handover details.
            </p>
          </div>
          <div style={styles.actions}>
            <button onClick={() => window.print()} style={styles.secondaryBtn}>Print receipt</button>
            <Link to="/dashboard" style={styles.primaryBtn}>Back to dashboard</Link>
          </div>
        </div>

        <section style={styles.heroCard}>
          <div>
            <div style={styles.heroLabel}>Vehicle</div>
            <h2 style={styles.heroTitle}>{purchase.carSnapshot.name}</h2>
            <div style={styles.heroMeta}>
              {purchase.carSnapshot.registrationNumber} · {purchase.carSnapshot.location || "Location pending"}
            </div>
          </div>
          <div style={styles.amountBox}>
            <div style={styles.heroLabel}>Confirmation amount</div>
            <div style={styles.amount}>{formatPrice(purchase.amount)}</div>
            <div style={styles.balanceLine}>
              Balance due {formatPrice(balanceDue)}
            </div>
            <div style={styles.paidAt}>{formatDateTime(purchase.paidAt || purchase.createdAt)}</div>
          </div>
        </section>

        <div style={styles.grid}>
          <InfoCard
            title="Confirmation details"
            rows={[
              ["Total price", formatPrice(totalAmount)],
              ["Confirmation amount", formatPrice(purchase.amount)],
              ["Balance due", formatPrice(balanceDue)],
              ["Booking plan", balanceDue > 0 ? "Partial confirmation" : "Full confirmation"],
              ["Gateway", "Razorpay"],
              ["Order id", purchase.gatewayOrderId],
              ["Transaction id", purchase.gatewayPaymentId || "Pending"],
              ["Status", purchase.balanceDue > 0 ? "confirmed" : purchase.status],
              ["Currency", purchase.currency],
              ["Receipt no.", purchase.receiptNumber],
            ]}
          />
          <InfoCard
            title="Vehicle details"
            rows={[
              ["Car", purchase.carSnapshot.name],
              ["Model", `${purchase.carSnapshot.make} ${purchase.carSnapshot.model}`],
              ["Year", `${purchase.carSnapshot.year}`],
              ["Plate no.", purchase.carSnapshot.registrationNumber],
              ["Body type", purchase.carSnapshot.bodyType || "Not shared"],
              ["Color", purchase.carSnapshot.color || "Not shared"],
            ]}
          />
          <InfoCard
            title="Seller details"
            rows={[
              ["Seller", purchase.sellerSnapshot.name],
              ["Contact", purchase.sellerSnapshot.phone || "Not shared"],
              ["Email", purchase.sellerSnapshot.email || "Not shared"],
              ["Place", purchase.carSnapshot.location || purchase.sellerSnapshot.city || "Not shared"],
            ]}
          />
          <InfoCard
            title="Buyer details"
            rows={[
              ["Buyer", purchase.buyerSnapshot.name],
              ["Phone", purchase.buyerSnapshot.phone || "Not shared"],
              ["Email", purchase.buyerSnapshot.email || "Not shared"],
              ["Date", formatDateTime(purchase.paidAt || purchase.createdAt)],
            ]}
          />
        </div>

        <section style={styles.checklistCard}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.eyebrow}>Important post-payment feature</div>
              <h2 style={styles.sectionTitle}>Ownership handover checklist</h2>
            </div>
            <div style={styles.checklistCount}>
              {handoverChecklist.filter((item) => item.done).length}/{handoverChecklist.length} complete
            </div>
          </div>

          <div style={styles.checklistGrid}>
            {handoverChecklist.map((item) => (
              <div key={item.key} style={{ ...styles.checkItem, ...(item.done ? styles.checkItemDone : {}) }}>
                <div style={styles.checkIcon}>{item.done ? "Done" : "Open"}</div>
                <div>
                  <div style={styles.checkLabel}>{item.label}</div>
                  <div style={styles.checkMeta}>
                    {item.done ? `Updated ${formatDateTime(item.updatedAt)}` : "Seller can mark this complete from the dashboard."}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={styles.footerLinks}>
          <Link to="/payments" style={styles.secondaryBtn}>
            View payments hub
          </Link>
          {purchase.conversation?._id && (
            <Link to={`/messages/${purchase.conversation._id}`} style={styles.secondaryBtn}>
              Open seller chat
            </Link>
          )}
          <Link to={`/cars/${purchase.car?._id}`} style={styles.secondaryBtn}>Open car page</Link>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, rows }) {
  return (
    <section style={styles.infoCard}>
      <h2 style={styles.infoTitle}>{title}</h2>
      <div style={styles.infoRows}>
        {rows.map(([label, value]) => (
          <div key={label} style={styles.infoRow}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "radial-gradient(circle at top, rgba(34,197,94,0.08), transparent 26%), #020617", paddingBottom: 64 },
  loader: { minHeight: "100vh", display: "grid", placeItems: "center", background: "#020617", color: "#94a3b8" },
  container: { maxWidth: 1180, margin: "0 auto", padding: "32px 24px" },
  topRow: { display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 20 },
  eyebrow: { color: "#22c55e", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 8 },
  title: { margin: 0, color: "#f8fafc", fontFamily: "'Syne', sans-serif", fontSize: 40 },
  subtitle: { margin: "10px 0 0", color: "#94a3b8", maxWidth: 720, lineHeight: 1.7 },
  actions: { display: "flex", gap: 10, flexWrap: "wrap" },
  primaryBtn: { display: "inline-block", textDecoration: "none", background: "#22c55e", color: "#052e16", borderRadius: 14, padding: "12px 18px", fontWeight: 800 },
  secondaryBtn: { display: "inline-block", textDecoration: "none", background: "rgba(15,23,42,0.85)", color: "#e2e8f0", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 14, padding: "12px 18px", cursor: "pointer" },
  heroCard: { background: "linear-gradient(135deg, rgba(34,197,94,0.16), rgba(15,23,42,0.92))", border: "1px solid rgba(34,197,94,0.22)", borderRadius: 24, padding: 24, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", flexWrap: "wrap", marginBottom: 20 },
  heroLabel: { color: "#bbf7d0", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 },
  heroTitle: { margin: 0, color: "#f8fafc", fontFamily: "'Syne', sans-serif", fontSize: 32 },
  heroMeta: { color: "#cbd5e1", marginTop: 8 },
  amountBox: { minWidth: 240, padding: 18, borderRadius: 20, background: "rgba(2,6,23,0.4)", border: "1px solid rgba(148,163,184,0.14)" },
  amount: { color: "#86efac", fontFamily: "'Syne', sans-serif", fontSize: 36 },
  balanceLine: { color: "#cbd5e1", marginTop: 6, fontSize: 13 },
  paidAt: { color: "#cbd5e1", marginTop: 8 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 20 },
  infoCard: { background: "rgba(15,23,42,0.88)", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 22, padding: 20 },
  infoTitle: { margin: "0 0 14px", color: "#f8fafc", fontFamily: "'Syne', sans-serif", fontSize: 24 },
  infoRows: { display: "flex", flexDirection: "column", gap: 12 },
  infoRow: { display: "flex", justifyContent: "space-between", gap: 14, paddingBottom: 12, borderBottom: "1px solid rgba(148,163,184,0.12)", color: "#cbd5e1" },
  checklistCard: { background: "rgba(15,23,42,0.88)", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 22, padding: 22 },
  sectionHeader: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 },
  sectionTitle: { margin: 0, color: "#f8fafc", fontFamily: "'Syne', sans-serif", fontSize: 28 },
  checklistCount: { background: "rgba(34,197,94,0.14)", color: "#86efac", borderRadius: 999, padding: "8px 12px", fontWeight: 700 },
  checklistGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 },
  checkItem: { display: "flex", gap: 12, background: "rgba(2,6,23,0.38)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 18, padding: 16, alignItems: "flex-start" },
  checkItemDone: { borderColor: "rgba(34,197,94,0.26)", background: "rgba(34,197,94,0.08)" },
  checkIcon: { minWidth: 52, textAlign: "center", padding: "6px 8px", borderRadius: 999, background: "rgba(15,23,42,0.92)", color: "#e2e8f0", fontSize: 12, fontWeight: 800 },
  checkLabel: { color: "#f8fafc", fontWeight: 700, lineHeight: 1.5 },
  checkMeta: { color: "#94a3b8", fontSize: 13, marginTop: 6, lineHeight: 1.6 },
  footerLinks: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 },
};
