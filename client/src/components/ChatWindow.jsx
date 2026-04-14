import { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { chatService } from "../services/chatService";
import { useAuth } from "../context/AuthContext";
import { formatPrice, timeAgo } from "../utils/helpers";
import { notifyError, notifySuccess } from "../utils/toastBus";

export default function ChatWindow({ conversation }) {
  const { user } = useAuth();
  const { joinConversation, leaveConversation, sendSocketMessage, onMessage, emitTypingStart, emitTypingStop, onTyping } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [offerMode, setOfferMode] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const typingTimer = useRef(null);
  const bottomRef = useRef(null);
  const convId = conversation._id;

  useEffect(() => {
    // Load messages
    chatService.getMessages(convId).then((res) => {
      setMessages(res.data.messages);
      setLoading(false);
    });
    // Join socket room
    joinConversation(convId);
    // Listen for new messages
    const offMsg = onMessage(({ conversationId, message }) => {
      if (conversationId === convId) setMessages((prev) => [...prev, message]);
    });
    // Typing listeners
    const offTyping = onTyping(
      ({ userId }) => { if (userId !== user._id) setTyping(true); },
      ({ userId }) => { if (userId !== user._id) setTyping(false); }
    );
    return () => {
      leaveConversation(convId);
      offMsg?.();
      offTyping?.();
    };
  }, [convId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInput = (e) => {
    setInput(e.target.value);
    emitTypingStart(convId);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTypingStop(convId), 1500);
  };

  const sendMessage = async (type = "text") => {
    const content = type === "offer" ? `Offer: ${formatPrice(Number(offerAmount))}` : input.trim();
    if (!content && type !== "offer") return;
    if (type === "offer" && !offerAmount) return;

    try {
      const payload = { content, type, offerAmount: type === "offer" ? Number(offerAmount) : undefined };
      const res = await chatService.sendMessage(convId, payload);
      const newMsg = res.data.message;
      setMessages((prev) => [...prev, newMsg]);
      sendSocketMessage(convId, newMsg);
      setInput("");
      setOfferAmount("");
      setOfferMode(false);
      if (type === "offer") notifySuccess("Offer sent successfully.");
    } catch (err) {
      notifyError(err.response?.data?.error || "Failed to send message.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const car = conversation.car;
  const other = user._id === conversation.buyer._id ? conversation.seller : conversation.buyer;

  return (
    <div style={styles.wrap}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          {other.avatar
            ? <img src={other.avatar} alt={other.name} style={styles.avatar} />
            : <div style={styles.avatarInit}>{other.name?.[0]}</div>
          }
          <div>
            <div style={styles.otherName}>{other.name}</div>
            <div style={styles.carLabel}>re: {car.year} {car.make} {car.model}</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.carPrice}>{formatPrice(car.price)}</span>
          {conversation.lastOffer && (
            <span style={styles.offerTag}>Last offer: {formatPrice(conversation.lastOffer)}</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={styles.msgArea}>
        {loading ? (
          <div style={styles.loader}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={styles.empty}>Start the conversation</div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender._id === user._id;
            const isOffer = msg.type === "offer" || msg.type === "counter-offer";
            return (  
              <div key={msg._id} style={{ ...styles.msgRow, justifyContent: isMine ? "flex-end" : "flex-start" }}>
                <div style={{
                  ...styles.bubble,
                  background: isMine ? "#20213b" : (isOffer ? "rgba(74,222,128,0.15)" : "#1c1f2a"),
                  color: isMine ? "#e4e4e4" : "#f0f0ee",
                  border: isOffer ? "1px solid rgba(74,222,128,0.4)" : "none",
                }}>
                  {isOffer && <div style={styles.offerLabel}>{msg.type === "offer" ? "💰 Offer" : "↩️ Counter-offer"}</div>}
                  <div>{msg.content}</div>
                  <div style={{ ...styles.msgTime, color: isMine ? "rgba(255, 254, 254, 0.57)" : "rgba(255,255,255,0.3)" }}>
                    {timeAgo(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {typing && <div style={styles.typingIndicator}>{other.name} is typing...</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={styles.inputArea}>
        {offerMode ? (
          <div style={styles.offerRow}>
            <span style={styles.rupee}>₹</span>
            <input
              type="number"
              placeholder="Enter offer amount"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              style={styles.offerInput}
              autoFocus
            />
            <button onClick={() => sendMessage("offer")} style={styles.sendBtn}>Send offer</button>
            <button onClick={() => setOfferMode(false)} style={styles.cancelBtn}>Cancel</button>
          </div>
        ) : (
          <div style={styles.textRow}>
            <button onClick={() => setOfferMode(true)} style={styles.offerBtn} title="Make an offer">💰</button>
            <textarea
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              style={styles.textarea}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim()} style={{ ...styles.sendBtn, opacity: input.trim() ? 1 : 0.4 }}>
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: "flex", flexDirection: "column", height: "100%", background: "#0e0f13" },
  header: { padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#16181f" },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  avatar: { width: 38, height: 38, borderRadius: "50%", objectFit: "cover" },
  avatarInit: { width: 38, height: 38, borderRadius: "50%", background: "#174872", color: "#0e0f13", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 },
  otherName: { fontWeight: 600, fontSize: 15, color: "#f0f0ee" },
  carLabel: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  headerRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 },
  carPrice: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: "#2a7dbd" },
  offerTag: { fontSize: 11, background: "rgba(74,222,128,0.12)", color: "#4ade80", padding: "2px 8px", borderRadius: 4 },
  msgArea: { flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 },
  loader: { color: "rgba(255,255,255,0.4)", textAlign: "center", margin: "auto" },
  empty: { color: "rgba(255,255,255,0.3)", textAlign: "center", margin: "auto", fontSize: 14 },
  msgRow: { display: "flex" },
  bubble: { maxWidth: "70%", padding: "10px 14px", borderRadius: 12, fontSize: 14, lineHeight: 1.5 },
  offerLabel: { fontSize: 11, fontWeight: 700, marginBottom: 4, opacity: 0.7 },
  msgTime: { fontSize: 10, marginTop: 4 },
  typingIndicator: { fontSize: 12, color: "rgba(255,255,255,0.35)", fontStyle: "italic" },
  inputArea: { padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", background: "#16181f" },
  textRow: { display: "flex", gap: 8, alignItems: "flex-end" },
  offerRow: { display: "flex", gap: 8, alignItems: "center" },
  offerBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 16 },
  textarea: { flex: 1, background: "#1c1f2a", border: "1px solid rgba(255,255,255,0.1)", color: "#f0f0ee", padding: "10px 14px", borderRadius: 8, fontSize: 14, fontFamily: "inherit", resize: "none", lineHeight: 1.5 },
  rupee: { color: "#2faab0", fontWeight: 700, fontSize: 18 },
  offerInput: { flex: 1, background: "#1c1f2a", border: "1px solid rgba(74,222,128,0.4)", color: "#f0f0ee", padding: "10px 14px", borderRadius: 8, fontSize: 14, fontFamily: "inherit" },
  sendBtn: { background: "#42d7f5", color: "#0e0f13", border: "none", padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne', sans-serif" },
  cancelBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", padding: "10px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer" },
};
