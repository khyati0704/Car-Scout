import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CarCard from "../components/CarCard";
import { carService } from "../services/carService";
import { chatService } from "../services/chatService";
import api from "../services/api";
import { testDriveService } from "../services/testDriveService";
import { formatPrice, timeAgo } from "../utils/helpers";
import { notifyError, notifySuccess } from "../utils/toastBus";

const formatSchedule = (value) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(user?.role === "seller" ? "listings" : "saved");
  const [myCars, setMyCars] = useState([]);
  const [savedCars, setSavedCars] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [testDrives, setTestDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    city: user?.city || "",
    bio: user?.bio || "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const tasks = [
          chatService.getConversations().then((response) => setConversations(response.data.conversations)),
          api.get("/users/saved/cars").then((response) => setSavedCars(response.data.cars)),
          testDriveService.getMyTestDrives().then((response) => setTestDrives(response.data.testDrives)),
        ];
        if (user?.role !== "buyer") {
          tasks.push(carService.getMyCars().then((response) => setMyCars(response.data.cars)));
        }
        await Promise.all(tasks);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.role]);

  const handleDeleteCar = async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    await carService.deleteCar(id);
    setMyCars((current) => current.filter((car) => car._id !== id));
    notifySuccess("Listing deleted successfully.");
  };

  const handleSaveProfile = async () => {
    const response = await api.patch("/users/profile", profileForm);
    updateUser(response.data.user);
    setEditProfile(false);
    notifySuccess("Profile updated successfully.");
  };

  const handleTestDriveUpdate = async (id, payload) => {
    try {
      const response = await testDriveService.updateTestDrive(id, payload);
      setTestDrives((current) =>
        current.map((testDrive) => (testDrive._id === id ? response.data.testDrive : testDrive))
      );
      notifySuccess("Test-drive status updated.");
    } catch (error) {
      notifyError(error.response?.data?.error || "Could not update the test drive.");
    }
  };

  const sellerStats = useMemo(() => {
    const totalValue = myCars.reduce((sum, car) => sum + Number(car.price || 0), 0);
    const totalViews = myCars.reduce((sum, car) => sum + Number(car.views || 0), 0);
    return {
      totalValue,
      totalViews,
      averageAsking: myCars.length ? Math.round(totalValue / myCars.length) : 0,
    };
  }, [myCars]);

  const buyerStats = useMemo(() => {
    const totalSavedValue = savedCars.reduce((sum, car) => sum + Number(car.price || 0), 0);
    return {
      totalSavedValue,
      averageSavedPrice: savedCars.length ? Math.round(totalSavedValue / savedCars.length) : 0,
    };
  }, [savedCars]);

  const upcomingTestDrives = useMemo(
    () => testDrives.filter((testDrive) => ["requested", "confirmed"].includes(testDrive.status)).length,
    [testDrives]
  );

  const pendingTestDrives = useMemo(
    () => testDrives.filter((testDrive) => testDrive.status === "requested").length,
    [testDrives]
  );

  const tabs =
    user?.role === "seller"
      ? ["listings", "test-drives", "messages", "saved"]
      : ["saved", "test-drives", "messages"];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <section style={styles.hero}>
          <div>
            <div style={styles.eyebrow}>{user?.role === "seller" ? "Seller workspace" : "Buyer workspace"}</div>
            <h1 style={styles.title}>Welcome back, {user?.name}</h1>
            <p style={styles.subtitle}>
              {user?.role === "seller"
                ? "Track active inventory, manage test-drive requests and keep conversations moving toward a decision."
                : "Review your saved cars, scheduled visits and seller conversations from a single workspace."}
            </p>
          </div>
          <div style={styles.heroActions}>
            <button onClick={() => setEditProfile((value) => !value)} style={styles.ghostBtn}>
              {editProfile ? "Close editor" : "Edit profile"}
            </button>
            {user?.role === "seller" ? (
              <Link to="/list-car" style={styles.primaryBtn}>Create listing</Link>
            ) : (
              <Link to="/cars" style={styles.primaryBtn}>Browse cars</Link>
            )}
          </div>
        </section>

        <div style={styles.profileCard}>
          <div style={styles.profileIdentity}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} style={styles.avatar} />
            ) : (
              <div style={styles.avatarFallback}>{user?.name?.[0]}</div>
            )}
            <div>
              <div style={styles.name}>{user?.name}</div>
              <div style={styles.metaRow}>
                <span style={styles.roleBadge}>{user?.role}</span>
                {user?.city && <span style={styles.metaText}>{user.city}</span>}
                <span style={styles.metaText}>Joined {new Date(user?.createdAt).getFullYear()}</span>
              </div>
              {user?.bio && <p style={styles.bio}>{user.bio}</p>}
            </div>
          </div>
        </div>

        {editProfile && (
          <section style={styles.editor}>
            <div style={styles.editorGrid}>
              {[
                ["name", "Name"],
                ["phone", "Phone"],
                ["city", "City"],
              ].map(([key, label]) => (
                <label key={key} style={styles.field}>
                  <span style={styles.fieldLabel}>{label}</span>
                  <input
                    value={profileForm[key]}
                    onChange={(event) => setProfileForm((current) => ({ ...current, [key]: event.target.value }))}
                    style={styles.input}
                  />
                </label>
              ))}
              <label style={{ ...styles.field, gridColumn: "1/-1" }}>
                <span style={styles.fieldLabel}>Bio</span>
                <textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={(event) => setProfileForm((current) => ({ ...current, bio: event.target.value }))}
                  style={styles.input}
                />
              </label>
            </div>
            <button onClick={handleSaveProfile} style={styles.primaryBtn}>Save profile</button>
          </section>
        )}

        <div style={styles.statsGrid}>
          {user?.role === "seller" && <StatCard label="Active listings" value={myCars.length} />}
          <StatCard label="Saved cars" value={savedCars.length} />
          <StatCard label="Upcoming test drives" value={upcomingTestDrives} />
          <StatCard label={user?.role === "seller" ? "Pending approvals" : "Open conversations"} value={user?.role === "seller" ? pendingTestDrives : conversations.length} />
        </div>

        <div style={styles.analyticsGrid}>
          <article style={styles.panel}>
            <div style={styles.panelLabel}>{user?.role === "seller" ? "Seller insight" : "Buyer insight"}</div>
            <h2 style={styles.panelTitle}>{user?.role === "seller" ? "How your inventory is performing" : "How your shortlist is shaping up"}</h2>
            {user?.role === "seller" ? (
              <div style={styles.metricList}>
                <MetricRow label="Average asking price" value={formatPrice(sellerStats.averageAsking)} />
                <MetricRow label="Total listing views" value={`${sellerStats.totalViews}`} />
                <MetricRow label="Inventory value" value={formatPrice(sellerStats.totalValue)} />
              </div>
            ) : (
              <div style={styles.metricList}>
                <MetricRow label="Saved inventory value" value={formatPrice(buyerStats.totalSavedValue)} />
                <MetricRow label="Average shortlist price" value={formatPrice(buyerStats.averageSavedPrice)} />
                <MetricRow label="Upcoming visits" value={`${upcomingTestDrives}`} />
              </div>
            )}
          </article>

          <article style={styles.panel}>
            <div style={styles.panelLabel}>Next best actions</div>
            <h2 style={styles.panelTitle}>Keep momentum moving</h2>
            <div style={styles.actionList}>
              {user?.role === "seller" ? (
                <>
                  <ActionItem text="Confirm pending test-drive requests quickly so buyers stay engaged." />
                  <ActionItem text="Refresh lower-performing listings with stronger descriptions or updated photos." />
                  <ActionItem text="Reply to active buyer conversations while the listing is still top-of-mind." />
                </>
              ) : (
                <>
                  <ActionItem text="Use your saved list and finance estimates together before you book another visit." />
                  <ActionItem text="Keep seller chats active after a test drive so negotiation momentum does not drop." />
                  <ActionItem text="Cancel weaker options early and focus on the cars with the strongest AI and pricing signals." />
                </>
              )}
            </div>
          </article>
        </div>

        <div style={styles.tabRow}>
          {tabs.map((value) => (
            <button key={value} onClick={() => setTab(value)} style={{ ...styles.tab, ...(tab === value ? styles.tabActive : {}) }}>
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={styles.loading}>Loading dashboard data...</div>
        ) : (
          <>
            {tab === "listings" &&
              (myCars.length === 0 ? (
                <EmptyState title="No listings yet" body="Create your first listing to start receiving buyer inquiries." actionLabel="List your first car" actionTo="/list-car" />
              ) : (
                <div style={styles.grid}>
                  {myCars.map((car) => (
                    <div key={car._id} style={styles.cardWrap}>
                      <CarCard car={car} />
                      <div style={styles.cardActions}>
                        <Link to={`/list-car?edit=${car._id}`} style={styles.inlineBtn}>Edit</Link>
                        <Link to={`/cars/${car._id}`} style={styles.inlineBtn}>View</Link>
                        <button onClick={() => handleDeleteCar(car._id)} style={{ ...styles.inlineBtn, ...styles.dangerBtn }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {tab === "saved" &&
              (savedCars.length === 0 ? (
                <EmptyState title="No saved cars yet" body="Save interesting cars while browsing to build your shortlist here." actionLabel="Browse listings" actionTo="/cars" />
              ) : (
                <div style={styles.grid}>
                  {savedCars.map((car) => <CarCard key={car._id} car={car} />)}
                </div>
              ))}

            {tab === "test-drives" &&
              (testDrives.length === 0 ? (
                <EmptyState title="No test drives yet" body="Schedule a visit from a car detail page and it will show up here for tracking and follow-up." actionLabel="Explore cars" actionTo="/cars" />
              ) : (
                <div style={styles.testDriveGrid}>
                  {testDrives.map((testDrive) => {
                    const otherParty = user._id === testDrive.buyer._id ? testDrive.seller : testDrive.buyer;
                    const canConfirm = user?.role === "seller" && testDrive.status === "requested";
                    const canComplete = user?.role === "seller" && testDrive.status === "confirmed";
                    const canCancel = ["requested", "confirmed"].includes(testDrive.status);

                    return (
                      <article key={testDrive._id} style={styles.testDriveCard}>
                        <div style={styles.testDriveTop}>
                          <div>
                            <div style={styles.testDriveTitle}>{testDrive.car.year} {testDrive.car.make} {testDrive.car.model}</div>
                            <div style={styles.testDriveMeta}>With {otherParty.name}</div>
                          </div>
                          <span style={{ ...styles.statusBadge, ...statusStyles[testDrive.status] }}>{testDrive.status}</span>
                        </div>

                        <div style={styles.testDriveDetails}>
                          <DetailRow label="When" value={formatSchedule(testDrive.scheduledFor)} />
                          <DetailRow label="Where" value={testDrive.location} />
                          <DetailRow label="Price" value={formatPrice(testDrive.car.price)} />
                          {testDrive.notes ? <DetailRow label="Notes" value={testDrive.notes} /> : null}
                        </div>

                        <div style={styles.testDriveActions}>
                          {testDrive.conversation?._id && (
                            <Link to={`/messages/${testDrive.conversation._id}`} style={styles.inlineBtn}>Open chat</Link>
                          )}
                          {canConfirm && (
                            <button onClick={() => handleTestDriveUpdate(testDrive._id, { status: "confirmed" })} style={styles.inlineBtn}>
                              Confirm
                            </button>
                          )}
                          {canComplete && (
                            <button onClick={() => handleTestDriveUpdate(testDrive._id, { status: "completed" })} style={styles.inlineBtn}>
                              Mark complete
                            </button>
                          )}
                          {canCancel && (
                            <button onClick={() => handleTestDriveUpdate(testDrive._id, { status: "cancelled" })} style={{ ...styles.inlineBtn, ...styles.dangerBtn }}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ))}

            {tab === "messages" &&
              (conversations.length === 0 ? (
                <EmptyState title="No conversations yet" body="Start a conversation from any listing to manage buyer-seller discussions here." />
              ) : (
                <div style={styles.conversationList}>
                  {conversations.map((conversation) => {
                    const otherUser = user._id === conversation.buyer._id ? conversation.seller : conversation.buyer;
                    return (
                      <button key={conversation._id} onClick={() => navigate(`/messages/${conversation._id}`)} style={styles.conversationItem}>
                        <div style={styles.conversationAvatar}>{otherUser.name?.[0]}</div>
                        <div style={styles.conversationBody}>
                          <div style={styles.conversationName}>{otherUser.name}</div>
                          <div style={styles.conversationMeta}>
                            {conversation.car.year} {conversation.car.make} {conversation.car.model} · {formatPrice(conversation.car.price)}
                          </div>
                          {conversation.lastMessage && <div style={styles.preview}>{conversation.lastMessage.slice(0, 80)}</div>}
                        </div>
                        <div style={styles.conversationSide}>
                          <span style={styles.status}>{conversation.status}</span>
                          <span style={styles.time}>{timeAgo(conversation.updatedAt)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
          </>
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

function MetricRow({ label, value }) {
  return (
    <div style={styles.metricRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ActionItem({ text }) {
  return <div style={styles.actionItem}>{text}</div>;
}

function EmptyState({ title, body, actionLabel, actionTo }) {
  return (
    <div style={styles.emptyState}>
      <h3 style={styles.panelTitle}>{title}</h3>
      <p style={styles.emptyText}>{body}</p>
      {actionLabel && actionTo && <Link to={actionTo} style={styles.primaryBtn}>{actionLabel}</Link>}
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

const statusStyles = {
  requested: { background: "rgba(250,204,21,0.14)", color: "#fde68a" },
  confirmed: { background: "rgba(34,197,94,0.14)", color: "#86efac" },
  completed: { background: "rgba(59,130,246,0.14)", color: "#93c5fd" },
  cancelled: { background: "rgba(239,68,68,0.14)", color: "#fca5a5" },
};

const styles = {
  page: { minHeight: "100vh", background: "radial-gradient(circle at top, rgba(34,197,94,0.08), transparent 28%), #020617", paddingBottom: 72 },
  container: { maxWidth: 1220, margin: "0 auto", padding: "32px 24px" },
  hero: { display: "flex", justifyContent: "space-between", alignItems: "start", gap: 18, flexWrap: "wrap", marginBottom: 20 },
  eyebrow: { color: "#22c55e", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 },
  title: { margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 42, color: "#f8fafc" },
  subtitle: { margin: "12px 0 0", color: "#94a3b8", maxWidth: 760, lineHeight: 1.7 },
  heroActions: { display: "flex", gap: 10, flexWrap: "wrap" },
  primaryBtn: { display: "inline-block", textDecoration: "none", border: "none", background: "#22c55e", color: "#052e16", padding: "12px 18px", borderRadius: 14, fontWeight: 800, cursor: "pointer" },
  ghostBtn: { border: "1px solid rgba(148,163,184,0.18)", background: "rgba(15,23,42,0.82)", color: "#e2e8f0", padding: "12px 18px", borderRadius: 14, cursor: "pointer" },
  profileCard: { background: "rgba(15,23,42,0.86)", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 22, padding: 22, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", marginBottom: 18, flexWrap: "wrap" },
  profileIdentity: { display: "flex", gap: 16, alignItems: "center" },
  avatar: { width: 72, height: 72, borderRadius: "50%", objectFit: "cover" },
  avatarFallback: { width: 72, height: 72, borderRadius: "50%", display: "grid", placeItems: "center", background: "#22c55e", color: "#052e16", fontWeight: 800, fontSize: 28 },
  name: { color: "#f8fafc", fontFamily: "'Syne', sans-serif", fontSize: 24 },
  metaRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 },
  roleBadge: { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.26)", color: "#86efac", borderRadius: 999, padding: "4px 10px", fontSize: 12, textTransform: "capitalize", fontWeight: 700 },
  metaText: { color: "#94a3b8", fontSize: 13 },
  bio: { color: "#cbd5e1", margin: "10px 0 0", lineHeight: 1.7 },
  editor: { background: "rgba(15,23,42,0.86)", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 22, padding: 22, marginBottom: 20 },
  editorGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: { color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" },
  input: { background: "rgba(2,6,23,0.5)", border: "1px solid rgba(148,163,184,0.18)", color: "#f8fafc", borderRadius: 14, padding: "12px 14px", fontFamily: "inherit" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 18 },
  statCard: { background: "rgba(15,23,42,0.86)", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 18, padding: 18 },
  statLabel: { color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 },
  statValue: { color: "#f8fafc", fontFamily: "'Syne', sans-serif", fontSize: 28 },
  analyticsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 20 },
  panel: { background: "rgba(15,23,42,0.86)", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 20, padding: 20 },
  panelLabel: { color: "#22c55e", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 8 },
  panelTitle: { margin: 0, color: "#f8fafc", fontFamily: "'Syne', sans-serif", fontSize: 24 },
  metricList: { marginTop: 16, display: "flex", flexDirection: "column", gap: 12 },
  metricRow: { display: "flex", justifyContent: "space-between", gap: 12, color: "#cbd5e1", paddingBottom: 12, borderBottom: "1px solid rgba(148,163,184,0.12)" },
  actionList: { marginTop: 16, display: "flex", flexDirection: "column", gap: 10 },
  actionItem: { color: "#cbd5e1", lineHeight: 1.7, padding: 14, background: "rgba(2,6,23,0.4)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 16 },
  tabRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 },
  tab: { background: "rgba(15,23,42,0.8)", color: "#cbd5e1", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 999, padding: "10px 16px", cursor: "pointer" },
  tabActive: { background: "rgba(34,197,94,0.16)", color: "#86efac", borderColor: "rgba(34,197,94,0.32)" },
  loading: { color: "#94a3b8", padding: "40px 0" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 },
  cardWrap: { display: "flex", flexDirection: "column", gap: 8 },
  cardActions: { display: "flex", gap: 8 },
  inlineBtn: { flex: 1, background: "rgba(15,23,42,0.82)", border: "1px solid rgba(148,163,184,0.18)", color: "#e2e8f0", borderRadius: 12, padding: "10px 12px", textAlign: "center", textDecoration: "none", cursor: "pointer" },
  dangerBtn: { color: "#fca5a5", borderColor: "rgba(239,68,68,0.3)" },
  emptyState: { background: "rgba(15,23,42,0.86)", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 22, padding: 32, textAlign: "center" },
  emptyText: { color: "#94a3b8", lineHeight: 1.7, maxWidth: 520, margin: "12px auto 18px" },
  conversationList: { display: "flex", flexDirection: "column", gap: 10 },
  conversationItem: { background: "rgba(15,23,42,0.86)", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 18, padding: 16, display: "flex", gap: 14, alignItems: "center", width: "100%", cursor: "pointer", textAlign: "left" },
  conversationAvatar: { width: 44, height: 44, borderRadius: "50%", display: "grid", placeItems: "center", background: "#22c55e", color: "#052e16", fontWeight: 800 },
  conversationBody: { flex: 1 },
  conversationName: { color: "#f8fafc", fontWeight: 700 },
  conversationMeta: { color: "#94a3b8", fontSize: 13, marginTop: 4 },
  preview: { color: "#cbd5e1", fontSize: 13, marginTop: 8 },
  conversationSide: { display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" },
  status: { background: "rgba(34,197,94,0.12)", color: "#86efac", borderRadius: 999, padding: "4px 8px", fontSize: 11, textTransform: "capitalize", fontWeight: 700 },
  time: { color: "#94a3b8", fontSize: 12 },
  testDriveGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 },
  testDriveCard: { background: "rgba(15,23,42,0.86)", border: "1px solid rgba(148,163,184,0.14)", borderRadius: 20, padding: 18 },
  testDriveTop: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", marginBottom: 16 },
  testDriveTitle: { color: "#f8fafc", fontFamily: "'Syne', sans-serif", fontSize: 22, lineHeight: 1.2 },
  testDriveMeta: { color: "#94a3b8", marginTop: 4 },
  statusBadge: { borderRadius: 999, padding: "6px 10px", fontSize: 12, textTransform: "capitalize", fontWeight: 800 },
  testDriveDetails: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 },
  detailRow: { display: "flex", justifyContent: "space-between", gap: 14, paddingBottom: 10, borderBottom: "1px solid rgba(148,163,184,0.12)", color: "#cbd5e1" },
  testDriveActions: { display: "flex", flexWrap: "wrap", gap: 8 },
};
