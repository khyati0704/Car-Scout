import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { paymentService } from "../services/paymentService";
import { formatPrice } from "../utils/helpers";
import { notifyError, notifySuccess } from "../utils/toastBus";

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function PaymentsPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingPurchaseId, setUpdatingPurchaseId] = useState("");

  useEffect(() => {
    paymentService
      .getMyPurchases()
      .then((response) => setPurchases(response.data.purchases || []))
      .catch((error) => notifyError(error.response?.data?.error || "Could not load your payment history."))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const totalPaid = purchases.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0);
    const totalOutstanding = purchases.reduce(
      (sum, purchase) =>
        sum +
        Number(
          purchase.balanceDue ||
            Math.max(0, Number(purchase.totalAmount || purchase.amount || 0) - Number(purchase.amount || 0))
        ),
      0
    );
    const openChecklistItems = purchases.reduce(
      (sum, purchase) => sum + (purchase.handoverChecklist || []).filter((item) => !item.done).length,
      0
    );

    return {
      deals: purchases.length,
      totalPaid,
      totalOutstanding,
      openChecklistItems,
    };
  }, [purchases]);

  const handleChecklistToggle = async (purchaseId, itemKey) => {
    const purchase = purchases.find((entry) => entry._id === purchaseId);
    if (!purchase) return;
    if (user?._id !== purchase.seller._id && user?.role !== "admin") {
      notifyError("Only the seller can update the handover checklist.");
      return;
    }

    const nextChecklist = (purchase.handoverChecklist || []).map((item) =>
      item.key === itemKey ? { ...item, done: !item.done } : item
    );

    setUpdatingPurchaseId(purchaseId);
    try {
      const response = await paymentService.updateChecklist(purchaseId, nextChecklist);
      setPurchases((current) =>
        current.map((entry) => (entry._id === purchaseId ? response.data.purchase : entry))
      );
      notifySuccess("Handover checklist updated.");
    } catch (error) {
      notifyError(error.response?.data?.error || "Could not update the handover checklist.");
    } finally {
      setUpdatingPurchaseId("");
    }
  };

  if (loading) {
    return <div style={styles.loader}>Loading your payments...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <section style={styles.hero}>
          <div>
            <div style={styles.eyebrow}>Payments hub</div>
            <h1 style={styles.title}>Completed bookings and receipts</h1>
            <p style={styles.subtitle}>
              Confirm a booking from a car page, then keep every receipt, seller contact, and handover step in one place.
            </p>
          </div>
          <div style={styles.heroActions}>
            <Link to="/cars" style={styles.primaryBtn}>Browse cars</Link>
            <Link to="/dashboard" style={styles.secondaryBtn}>Open dashboard</Link>
          </div>
        </section>

        <div style={styles.statsGrid}>
          <StatCard label="Completed deals" value={stats.deals} />
          <StatCard label="Total confirmation amount" value={formatPrice(stats.totalPaid)} />
          <StatCard label="Outstanding balance" value={formatPrice(stats.totalOutstanding)} />
          <StatCard label="Open handover steps" value={stats.openChecklistItems} />
        </div>

        {purchases.length === 0 ? (
          <section style={styles.emptyState}>
            <h2 style={styles.sectionTitle}>No payments yet</h2>
            <p style={styles.emptyText}>
              Once you finish checkout on a car detail page, the verified receipt and handover checklist will appear here.
            </p>
            <Link to="/cars" style={styles.primaryBtn}>Find a car to buy</Link>
          </section>
        ) : (
          <div style={styles.grid}>
            {purchases.map((purchase) => {
              const isSellerView = user?._id === purchase.seller._id || user?.role === "admin";
              const counterparty = isSellerView ? purchase.buyerSnapshot : purchase.sellerSnapshot;
              const checklist = purchase.handoverChecklist || [];
              const completedCount = checklist.filter((item) => item.done).length;
              const balanceDue = Number(
                purchase.balanceDue ||
                  Math.max(0, Number(purchase.totalAmount || purchase.amount || 0) - Number(purchase.amount || 0))
              );
              const paymentPlan = balanceDue > 0 ? "booking confirmation" : "full confirmation";

              return (
                <article key={purchase._id} style={styles.card}>
                  <div style={styles.cardTop}>
                    <div>
                      <div style={styles.cardLabel}>Receipt {purchase.receiptNumber}</div>
                      <h2 style={styles.cardTitle}>{purchase.carSnapshot.name}</h2>
                      <div style={styles.cardMeta}>
                        {purchase.carSnapshot.registrationNumber} {"·"} {purchase.carSnapshot.location || "Location pending"}
                      </div>
                    </div>
                    <div style={styles.amountBox}>
                      <div style={styles.amountLabel}>Confirmation amount</div>
                      <div style={styles.amount}>{formatPrice(purchase.amount)}</div>
                      <div style={styles.amountMeta}>{`Balance due ${formatPrice(balanceDue)}`}</div>
                      <div style={styles.amountMeta}>{formatDateTime(purchase.paidAt || purchase.createdAt)}</div>
                    </div>
                  </div>

                  <div style={styles.detailGrid}>
                    <DetailRow label={isSellerView ? "Buyer" : "Seller"} value={counterparty.name} />
                    <DetailRow
                      label="Contact"
                      value={counterparty.phone || counterparty.email || "Not shared"}
                    />
                    <DetailRow label="Confirmation" value={`Razorpay · ${paymentPlan}`} />
                    <DetailRow label="Total price" value={formatPrice(purchase.totalAmount || purchase.amount)} />
                    <DetailRow label="Receipt date" value={formatDateTime(purchase.paidAt || purchase.createdAt)} />
                  </div>

                  <div style={styles.checklistCard}>
                    <div style={styles.checklistHeader}>
                      <span>Ownership handover checklist</span>
                      <strong>{completedCount}/{checklist.length} complete</strong>
                    </div>
                    <div style={styles.checklistStack}>
                      {checklist.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          disabled={!isSellerView || updatingPurchaseId === purchase._id}
                          onClick={() => handleChecklistToggle(purchase._id, item.key)}
                          style={{
                            ...styles.checklistItem,
                            ...(item.done ? styles.checklistItemDone : {}),
                            opacity: isSellerView ? 1 : 0.92,
                          }}
                        >
                          <span>{item.label}</span>
                          <strong>{item.done ? "Done" : isSellerView ? "Mark done" : "Open"}</strong>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={styles.actions}>
                    <Link to={`/purchases/${purchase._id}`} style={styles.secondaryBtn}>View receipt</Link>
                    {purchase.conversation?._id && (
                      <Link to={`/messages/${purchase.conversation._id}`} style={styles.secondaryBtn}>Open chat</Link>
                    )}
                    <Link to={`/cars/${purchase.car?._id}`} style={styles.secondaryBtn}>Open car page</Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={styles.detailRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "radial-gradient(circle at top, rgba(34,197,94,0.08), transparent 28%), #020617", paddingBottom: 72 },
  loader: { minHeight: "100vh", display: "grid", placeItems: "center", background: "#020617", color: "#94a3b8" },
  container: { maxWidth: 1180, margin: "0 auto", padding: "32px 24px" },
  hero: { display: "flex", justifyContent: "space-between", alignItems: "start", gap: 18, flexWrap: "wrap", marginBottom: 20 },
  eyebrow: { color: "#22c55e", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 8 },
  title: { margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 42, color: "#f8fafc" },
  subtitle: { margin: "12px 0 0", color: "#94a3b8", maxWidth: 720, lineHeight: 1.7 },
  heroActions: { display: "flex", gap: 10, flexWrap: "wrap" },
  primaryBtn: { display: "inline-block", textDecoration: "none", background: "#22c55e", color: "#052e16", padding: "12px 18px", borderRadius: 14, fontWeight: 800, border: "none", cursor: "pointer" },
  secondaryBtn: { display: "inline-block", textDecoration: "none", background: "rgba(15,23,42,0.82)", color: "#e2e8f0", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 14, padding: "12px 18px", cursor: "pointer" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 },
  statCard: { background: "rgba(15,23,42,0.86)", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 18, padding: 18 },
  statLabel: { color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 },
  statValue: { color: "#f8fafc", fontFamily: "'Syne', sans-serif", fontSize: 28 },
  emptyState: { background: "rgba(15,23,42,0.86)", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 22, padding: 32, textAlign: "center" },
  sectionTitle: { margin: 0, color: "#f8fafc", fontFamily: "'Syne', sans-serif", fontSize: 26 },
  emptyText: { color: "#94a3b8", lineHeight: 1.7, maxWidth: 520, margin: "12px auto 18px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 },
  card: { background: "rgba(15,23,42,0.88)", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 22, padding: 20 },
  cardTop: { display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 16 },
  cardLabel: { color: "#22c55e", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 8 },
  cardTitle: { margin: 0, color: "#f8fafc", fontFamily: "'Syne', sans-serif", fontSize: 28, lineHeight: 1.15 },
  cardMeta: { color: "#94a3b8", marginTop: 8, lineHeight: 1.6 },
  amountBox: { minWidth: 220, padding: 16, borderRadius: 18, background: "rgba(2,6,23,0.4)", border: "1px solid rgba(148,163,184,0.14)" },
  amountLabel: { color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 },
  amount: { color: "#86efac", fontFamily: "'Syne', sans-serif", fontSize: 30, lineHeight: 1 },
  amountMeta: { color: "#cbd5e1", marginTop: 8, fontSize: 13 },
  detailGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 },
  detailRow: { display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 10, borderBottom: "1px solid rgba(148,163,184,0.12)", color: "#cbd5e1" },
  checklistCard: { padding: 16, borderRadius: 18, background: "rgba(2,6,23,0.38)", border: "1px solid rgba(148,163,184,0.12)" },
  checklistHeader: { display: "flex", justifyContent: "space-between", gap: 10, color: "#cbd5e1", marginBottom: 12, flexWrap: "wrap" },
  checklistStack: { display: "flex", flexDirection: "column", gap: 8 },
  checklistItem: { width: "100%", display: "flex", justifyContent: "space-between", gap: 12, background: "rgba(2,6,23,0.38)", border: "1px solid rgba(148,163,184,0.12)", color: "#cbd5e1", borderRadius: 14, padding: "12px 14px", textAlign: "left", cursor: "pointer" },
  checklistItemDone: { borderColor: "rgba(34,197,94,0.28)", background: "rgba(34,197,94,0.08)", color: "#bbf7d0" },
  actions: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 },
};
