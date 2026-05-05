import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import Navbar from "./components/Navbar";
import ToastViewport from "./components/ToastViewport";
import Home from "./pages/Home";
import Listings from "./pages/Listings";
import CarDetail from "./pages/CarDetail";
import ListCar from "./pages/ListCar";
import Messages from "./pages/Messages";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import PaymentsPage from "./pages/PaymentsPage";
import PurchaseReceipt from "./pages/PurchaseReceipt";

// Route guard for authenticated pages
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader">Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

// Route guard for seller-only pages
const SellerRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "buyer") return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <ToastViewport />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cars" element={<Listings />} />
      <Route path="/cars/:id" element={<CarDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile/:id" element={<Profile />} />
      <Route path="/list-car" element={<SellerRoute><ListCar /></SellerRoute>} />
      <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
      <Route path="/messages/:conversationId" element={<PrivateRoute><Messages /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/payments" element={<PrivateRoute><PaymentsPage /></PrivateRoute>} />
      <Route path="/purchases/:purchaseId" element={<PrivateRoute><PurchaseReceipt /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
