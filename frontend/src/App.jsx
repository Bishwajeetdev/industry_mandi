import React, { useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Protected from "./components/common/Protected";
import RouteBoundary from "./components/common/RouteBoundary";
import PublicChrome from "./components/common/PublicChrome";
import PublicFooter from "./components/common/PublicFooter";
import SmoothScrollEffects from "./components/common/SmoothScrollEffects";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Products from "./pages/Products";
import Product from "./pages/ProductDetail";
import Compare from "./pages/Compare";
import PriceFinder from "./pages/PriceFinder";
import AuthPage from "./pages/AuthPage";
import CartPage from "./pages/CartPage";
import Wishlist from "./pages/Wishlist";

// Account Pages
import Account from "./pages/account/Account";
import BuyerAccountDashboard from "./pages/account/BuyerAccountDashboard";

// Admin Pages
import Dashboard from "./pages/vendor/Dashboard";
import AdminProductCreate from "./pages/admin/AdminProductCreate";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminAIPage from "./pages/admin/AdminAIPage";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminVendorRecords from "./pages/admin/AdminVendorRecords";
import AdminList from "./pages/admin/AdminList";

// Vendor Pages
import VendorSettingsPage from "./pages/vendor/VendorSettingsPage";
import ProductSubmission from "./pages/vendor/ProductSubmission";
import VendorTools from "./pages/vendor/VendorTools";
import PairExistingProduct from "./pages/vendor/PairExistingProduct";
import VendorWorkspacePage from "./pages/vendor/VendorWorkspacePage";

export function App() {
  const pageRef = useRef(null);

  return (
    <AuthProvider>
      <BrowserRouter>
        <SmoothScrollEffects pageRef={pageRef} />
        <PublicChrome />
        <div ref={pageRef}>
          <RouteBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:slug" element={<Product />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/price-finder" element={<PriceFinder />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage register />} />
              <Route path="/cart" element={<CartPage />} />
              <Route
                path="/buyer/account"
                element={
                  <Protected roles={["buyer"]}>
                    <BuyerAccountDashboard />
                  </Protected>
                }
              />
              <Route
                path="/account"
                element={
                  <Protected roles={["buyer", "vendor"]}>
                    <Account />
                  </Protected>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <Protected roles={["buyer"]}>
                    <Wishlist />
                  </Protected>
                }
              />
              <Route
                path="/admin"
                element={
                  <Protected roles={["admin"]}>
                    <Dashboard />
                  </Protected>
                }
              />
              <Route
                path="/admin/products/add"
                element={
                  <Protected roles={["admin"]}>
                    <AdminProductCreate />
                  </Protected>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <Protected roles={["admin"]}>
                    <AdminAnalyticsPage />
                  </Protected>
                }
              />
              <Route
                path="/admin/ai"
                element={
                  <Protected roles={["admin"]}>
                    <AdminAIPage />
                  </Protected>
                }
              />
              <Route
                path="/admin/notifications"
                element={
                  <Protected roles={["admin"]}>
                    <AdminNotificationsPage />
                  </Protected>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <Protected roles={["admin"]}>
                    <AdminSettingsPage />
                  </Protected>
                }
              />
              <Route
                path="/admin/vendors"
                element={
                  <Protected roles={["admin"]}>
                    <AdminVendorRecords />
                  </Protected>
                }
              />
              <Route
                path="/admin/:resource"
                element={
                  <Protected roles={["admin"]}>
                    <AdminList />
                  </Protected>
                }
              />
              <Route
                path="/vendor"
                element={
                  <Protected roles={["vendor"]}>
                    <Dashboard />
                  </Protected>
                }
              />
              <Route
                path="/vendor/settings"
                element={
                  <Protected roles={["vendor"]}>
                    <VendorSettingsPage />
                  </Protected>
                }
              />
              <Route
                path="/vendor/products"
                element={
                  <Protected roles={["vendor"]}>
                    <ProductSubmission />
                  </Protected>
                }
              />
              <Route
                path="/vendor/products/add"
                element={
                  <Protected roles={["vendor"]}>
                    <ProductSubmission />
                  </Protected>
                }
              />
              <Route
                path="/vendor/offers"
                element={
                  <Protected roles={["vendor"]}>
                    <VendorTools mode="offers" />
                  </Protected>
                }
              />
              <Route
                path="/vendor/pairing"
                element={
                  <Protected roles={["vendor"]}>
                    <PairExistingProduct />
                  </Protected>
                }
              />
              <Route
                path="/vendor/orders"
                element={
                  <Protected roles={["vendor"]}>
                    <VendorWorkspacePage section="orders" />
                  </Protected>
                }
              />
              <Route
                path="/vendor/store"
                element={
                  <Protected roles={["vendor"]}>
                    <VendorWorkspacePage section="store" />
                  </Protected>
                }
              />
              <Route
                path="/dashboard/buyer"
                element={
                  <Protected roles={["buyer"]}>
                    <Dashboard />
                  </Protected>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </RouteBoundary>
        </div>
        <PublicFooter />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
