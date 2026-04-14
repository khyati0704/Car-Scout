import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const token = localStorage.getItem("token");
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("user:online", ({ userId }) =>
      setOnlineUsers((prev) => new Set([...prev, userId]))
    );
    socket.on("user:offline", ({ userId }) =>
      setOnlineUsers((prev) => { const s = new Set(prev); s.delete(userId); return s; })
    );

    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user]);

  const joinConversation = (id) => socketRef.current?.emit("conversation:join", id);
  const leaveConversation = (id) => socketRef.current?.emit("conversation:leave", id);
  const sendSocketMessage = (conversationId, message) =>
    socketRef.current?.emit("message:send", { conversationId, message });
  const emitTypingStart = (conversationId) =>
    socketRef.current?.emit("typing:start", { conversationId });
  const emitTypingStop = (conversationId) =>
    socketRef.current?.emit("typing:stop", { conversationId });
  const onMessage = (cb) => {
    socketRef.current?.on("message:receive", cb);
    return () => socketRef.current?.off("message:receive", cb);
  };
  const onTyping = (startCb, stopCb) => {
    socketRef.current?.on("typing:start", startCb);
    socketRef.current?.on("typing:stop", stopCb);
    return () => {
      socketRef.current?.off("typing:start", startCb);
      socketRef.current?.off("typing:stop", stopCb);
    };
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current, connected, onlineUsers,
      joinConversation, leaveConversation, sendSocketMessage,
      emitTypingStart, emitTypingStop, onMessage, onTyping,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
