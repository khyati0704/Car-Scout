import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { chatService } from "../services/chatService";
import { useAuth } from "../context/AuthContext";
import ChatWindow from "../components/ChatWindow";
import { formatPrice, timeAgo } from "../utils/helpers";

export default function Messages() {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chatService.getConversations().then((res) => {
      setConversations(res.data.conversations);
      if (conversationId) {
        const found = res.data.conversations.find((c) => c._id === conversationId);
        if (found) setActive(found);
      }
      setLoading(false);
    });
  }, []);

  const selectConv = (conv) => {
    setActive(conv);
    navigate(`/messages/${conv._id}`, { replace: true });
  };

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.sidebarTitle}>Messages</h2>
          </div>
          {loading ? (
            <div style={styles.loading}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={styles.empty}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <p>No conversations yet.</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Start by contacting a seller on any listing.</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = user._id === conv.buyer._id ? conv.seller : conv.buyer;
              const unread = user._id === conv.buyer._id ? conv.unreadBuyer : conv.unreadSeller;
              const isActive = active?._id === conv._id;
              return (
                <div
                  key={conv._id}
                  onClick={() => selectConv(conv)}
                  style={{ ...styles.convItem, ...(isActive ? styles.convActive : {}) }}
                >
                
                  {other.avatar
                    ? <img src={other.avatar} alt={other.name} style={styles.convAvatar} />
                    : <div style={styles.convAvatarInit}>{other.name?.[0]}</div>
                  }
                  <div style={styles.convInfo}>
                    <div style={styles.convTop}>
                      <span style={styles.convName}>{other.name}</span>
                      {unread > 0 && <span style={styles.unreadBadge}>{unread}</span>}
                    </div>
                    <div style={styles.convCar}>
                      {conv.car.year} {conv.car.make} {conv.car.model}
                    </div>
                    {conv.lastMessage && (
                      <div style={styles.convPreview}>{conv.lastMessage.slice(0, 40)}...</div>
                    )}
                    {conv.lastOffer && (
                      <div style={styles.convOffer}>Last offer: {formatPrice(conv.lastOffer)}</div>
                    )}
                  </div>
                  <div style={styles.convTime}>{timeAgo(conv.updatedAt)}</div>
                </div>
              );
            })
          )}
        </div>
      
        
        <div style={styles.chatArea}>
          {active
            ? <ChatWindow key={active._id} conversation={active} />
            : (
              <div style={styles.noChat}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>Select a conversation to start chatting</p>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { background: "#121b1d", height: "calc(100vh - 60px)", overflow: "hidden" , gradient: "radial-gradient(circle at 20% 20%, rgba(34,197,94,0.15), transparent 80%)" },
  layout: { display: "grid", gridTemplateColumns: "320px 1fr", height: "100%" },
  sidebar: { borderRight: "1px solid rgba(255,255,255,0.07)", overflowY: "auto", display: "flex", flexDirection: "column" },
  sidebarHeader: { padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" },
  sidebarTitle: { fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: "#f0f0ee", margin: 0 },
  loading: { padding: 24, color: "rgba(255,255,255,0.4)", fontSize: 14 },
  empty: { padding: 40, textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 14 },
  convItem: { display: "flex", gap: 12, padding: "14px 16px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background .15s", alignItems: "flex-start" },
  convActive: { background: "rgba(232,245,66,0.06)", borderLeft: "3px solid #03747e" },
  convAvatar: { width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 },
  convAvatarInit: { width: 40, height: 40, borderRadius: "50%", background: "#025675", color: "#0e0f13", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0 },
  convInfo: { flex: 1, overflow: "hidden" },
  convTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  convName: { fontWeight: 600, fontSize: 14, color: "#f0f0ee" },
  unreadBadge: { background: "#088183", color: "#0e0f13", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 },
  convCar: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 2 },
  convPreview: { fontSize: 12, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  convOffer: { fontSize: 11, color: "#4ade80", marginTop: 2 },
  convTime: { fontSize: 11, color: "rgba(255,255,255,0.3)", flexShrink: 0 },
  chatArea: { overflow: "hidden" },
  noChat: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
};
