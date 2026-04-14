const TOAST_EVENT = "car-scout:toast";

const emitToast = (type, message) => {
  if (typeof window === "undefined" || !message) return;

  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type,
        message,
      },
    })
  );
};

export const notifySuccess = (message) => emitToast("success", message);
export const notifyError = (message) => emitToast("error", message);
export const notifyInfo = (message) => emitToast("info", message);
export const toastEventName = TOAST_EVENT;
