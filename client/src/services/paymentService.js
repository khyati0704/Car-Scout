import api from "./api";

let razorpayLoader;

export const loadRazorpayCheckout = () => {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  if (!razorpayLoader) {
    razorpayLoader = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  return razorpayLoader;
};

export const paymentService = {
  createCheckoutOrder: (carId, payload) => api.post(`/payments/checkout/${carId}`, payload),
  verifyCheckoutPayment: (payload) => api.post("/payments/verify", payload),
  getMyPurchases: () => api.get("/payments/my"),
  getPurchase: (purchaseId) => api.get(`/payments/${purchaseId}`),
  updateChecklist: (purchaseId, checklist) => api.patch(`/payments/${purchaseId}/checklist`, { checklist }),
};
