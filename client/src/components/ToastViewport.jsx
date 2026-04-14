import { useEffect, useState } from "react";
import { toastEventName } from "../utils/toastBus";

const TYPE_STYLES = {
  success: {
    borderColor: "rgba(34,197,94,0.35)",
    background: "rgba(6,78,59,0.95)",
    title: "Success",
  },
  error: {
    borderColor: "rgba(239,68,68,0.35)",
    background: "rgba(127,29,29,0.95)",
    title: "Action needed",
  },
  info: {
    borderColor: "rgba(59,130,246,0.35)",
    background: "rgba(30,64,175,0.95)",
    title: "Update",
  },
};

export default function ToastViewport() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (event) => {
      const nextToast = event.detail;
      setToasts((current) => [...current, nextToast]);

      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== nextToast.id));
      }, 3200);
    };

    window.addEventListener(toastEventName, handleToast);
    return () => window.removeEventListener(toastEventName, handleToast);
  }, []);

  if (!toasts.length) return null;

  return (
    <div style={styles.wrap}>
      {toasts.map((toast) => {
        const typeStyle = TYPE_STYLES[toast.type] || TYPE_STYLES.info;
        return (
          <div
            key={toast.id}
            style={{
              ...styles.toast,
              borderColor: typeStyle.borderColor,
              background: typeStyle.background,
            }}
          >
            <div style={styles.title}>{typeStyle.title}</div>
            <div style={styles.message}>{toast.message}</div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    top: 78,
    right: 18,
    zIndex: 2000,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    width: "min(360px, calc(100vw - 24px))",
  },
  toast: {
    border: "1px solid",
    color: "#f8fafc",
    borderRadius: 16,
    padding: "14px 16px",
    boxShadow: "0 20px 40px rgba(2,6,23,0.35)",
    backdropFilter: "blur(10px)",
  },
  title: {
    fontSize: 12,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    opacity: 0.75,
    marginBottom: 6,
    fontWeight: 700,
  },
  message: {
    fontSize: 14,
    lineHeight: 1.5,
  },
};
