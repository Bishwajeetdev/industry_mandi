import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { fmt } from "../../utils/helpers";
import DashboardShell from "../../components/dashboard/DashboardShell";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import ApprovalQueues from "../admin/ApprovalQueues";

function Dashboard() {
  const { user } = useAuth(),
    [state, setState] = useState({ loading: true, data: null, error: "" }),
    [details, setDetails] = useState({ products: [], pairings: [], orders: [] }),
    [period, setPeriod] = useState("Weekly");

  const endpoint =
    user?.role === "admin"
      ? "/admin/dashboard"
      : user?.role === "vendor"
        ? "/vendor/dashboard"
        : "/buyer/dashboard";

  const load = () => {
    setState({ loading: true, data: null, error: "" });
    api
      .get(endpoint)
      .then((r) => setState({ loading: false, data: r.data.data, error: "" }))
      .catch((e) =>
        setState({
          loading: false,
          data: null,
          error: e.response?.data?.message || e.message,
        }),
      );
  };

  useEffect(() => {
    if (!user) return;

    if (user.role === "vendor") {
      Promise.all([
        api.get("/vendor/products"),
        api.get("/vendor/pairings"),
        api.get("/account"),
      ])
        .then(([productsRes, pairingsRes, accountRes]) => {
          setDetails({
            products: productsRes.data.data || [],
            pairings: pairingsRes.data.data || [],
            orders: accountRes.data.data.orders || [],
          });
        })
        .catch(() => setDetails({ products: [], pairings: [], orders: [] }));
      return;
    }

    if (user.role === "admin") {
      Promise.all([
        api.get("/admin/resources/products"),
        api.get("/admin/resources/pairings"),
        api.get("/admin/resources/orders"),
      ])
        .then(([productsRes, pairingsRes, ordersRes]) => {
          setDetails({
            products: productsRes.data.data || [],
            pairings: pairingsRes.data.data || [],
            orders: ordersRes.data.data || [],
          });
        })
        .catch(() => setDetails({ products: [], pairings: [], orders: [] }));
      return;
    }

    if (user.role === "buyer") {
      api.get("/account")
        .then((accountRes) => {
          setDetails((d) => ({
            ...d,
            orders: accountRes.data.data.orders || [],
          }));
        })
        .catch(() => {});
    }
  }, [user?.role]);

  useEffect(() => {
    load();
  }, [endpoint]);

  if (state.loading) return (
    <DashboardShell role={user?.role}>
      <Loading label="Loading your workspace…" />
    </DashboardShell>
  );

  if (state.error) return (
    <DashboardShell role={user?.role}>
      <ErrorState message={state.error} onRetry={load} />
    </DashboardShell>
  );

  const d = state.data || {};
  const isVendor = user?.role === "vendor";
  const isAdmin = user?.role === "admin";
  const isBuyer = user?.role === "buyer";
  const vendorRevenue = details.orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const buyerSpend = details.orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const buyerItemCount = details.orders.reduce((sum, order) => sum + (order.items || []).reduce((quantity, item) => quantity + (Number(item.quantity) || 0), 0), 0);
  const buyerOpenOrders = details.orders.filter((order) => !["Delivered", "Cancelled"].includes(order.status));
  const buyerOpenItems = buyerOpenOrders.reduce((sum, order) => sum + (order.items || []).reduce((quantity, item) => quantity + (Number(item.quantity) || 0), 0), 0);
  const buyerDeliveredOrders = details.orders.filter((order) => order.status === "Delivered").length;
  const buyerCancelledOrders = details.orders.filter((order) => order.status === "Cancelled").length;
  const buyerReturns = details.orders.filter((order) => ["Requested", "Approved", "Refunded"].includes(order.returnStatus)).length;
  const vendorStockUnits = details.products.reduce((sum, product) => sum + (Number(product.stock) || 0), 0);
  const vendorPendingProducts = details.products.filter((product) => ["pending", "in_review"].includes(String(product.status || "").toLowerCase())).length;
  const vendorCompletedOrders = details.orders.filter((order) => order.status === "Delivered").length;
  const vendorOpenOrders = details.orders.filter((order) => !["Delivered", "Cancelled"].includes(order.status)).length;
  const vendorCancelledOrders = details.orders.filter((order) => order.status === "Cancelled").length;
  const vendorReturns = details.orders.filter((order) => ["Requested", "Approved", "Refunded"].includes(order.returnStatus)).length;
  const vendorCategoryCount = new Set(details.products.map((product) => product.category).filter(Boolean)).size;

  const topProducts = details.products.slice(0, 5);
  const lowStockItems = details.products.filter((product) => {
    if (product.stock === null || product.stock === undefined || product.stock === "") return false;
    const stock = Number(product.stock);
    return Number.isFinite(stock) && stock < 15;
  }).slice(0, 4);

  const adminLinks = {
    users: "/admin/users",
    vendors: "/admin/vendors",
    pendingVendors: "/admin/vendors?status=pending",
    products: "/admin/products",
    pendingProducts: "/admin/products?status=pending",
    offers: "/admin/offers",
    reviews: "/admin/reviews?status=pending",
    pairings: "/admin/pairings?status=pending",
    orders: "/admin/orders",
  };

  return (
    <DashboardShell role={user?.role} activeNav={isAdmin ? "/admin" : isVendor ? "/vendor" : "/dashboard/buyer"}>
      {/* ── ROW 1: Sales Overview + Inventory Summary ── */}
      <div className="db-overview-grid">
        <div className="db-card" style={{ marginBottom: 0 }}>
          <div className="db-card-header">
            <h3 className="db-card-title">{isAdmin ? "Platform Overview" : isVendor ? "Sales Overview" : "Procurement Overview"}</h3>
          </div>
          <div className="db-overview-cols">
            <div className="db-overview-item">
              <div className="db-overview-icon blue">
                <i className="bi bi-percent" />
              </div>
              <div className="db-overview-data">
                <strong>{isAdmin ? (d.orders ?? 0) : details.orders.length}</strong>
                <span>{isAdmin ? "Total Orders" : isVendor ? "Sales orders" : "Total Orders"}</span>
              </div>
            </div>

            <div className="db-overview-item">
              <div className="db-overview-icon purple">
                <i className="bi bi-currency-rupee" />
              </div>
              <div className="db-overview-data">
                <strong>{fmt(isVendor ? vendorRevenue : isBuyer ? buyerSpend : 0)}</strong>
                <span>{isBuyer ? "Total spent" : "Revenue"}</span>
              </div>
            </div>

            <div className="db-overview-item">
              <div className="db-overview-icon orange">
                <i className="bi bi-graph-up-arrow" />
              </div>
              <div className="db-overview-data">
                <strong>{isVendor ? vendorCompletedOrders : isBuyer ? buyerDeliveredOrders : (d.offers ?? 0)}</strong>
                <span>{isVendor || isBuyer ? "Delivered orders" : "Active offers"}</span>
              </div>
            </div>

            <div className="db-overview-item">
              <div className="db-overview-icon green">
                <i className="bi bi-house-door" />
              </div>
              <div className="db-overview-data">
                <strong>{isVendor ? vendorOpenOrders : isBuyer ? buyerOpenOrders.length : (d.products ?? 0)}</strong>
                <span>{isVendor || isBuyer ? "Open orders" : "Products"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="db-card" style={{ marginBottom: 0 }}>
          <div className="db-card-header">
            <h3 className="db-card-title">{isAdmin ? "Catalog Status" : isVendor ? "Inventory Summary" : "Order Tracking"}</h3>
          </div>
          <div className="db-overview-cols" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="db-overview-item">
              <div className="db-overview-icon orange">
                <i className="bi bi-box-seam" />
              </div>
              <div className="db-overview-data">
                <strong>{isVendor ? vendorStockUnits : isBuyer ? buyerItemCount : (d.products ?? 0)}</strong>
                <span>{isVendor ? "Stock units" : isBuyer ? "Items purchased" : "Products"}</span>
              </div>
            </div>

            <div className="db-overview-item">
              <div className="db-overview-icon purple">
                <i className="bi bi-geo-alt" />
              </div>
              <div className="db-overview-data">
                <strong>{isVendor ? vendorPendingProducts : isBuyer ? buyerOpenItems : (d.pendingProducts ?? 0)}</strong>
                <span>{isVendor ? "Products awaiting approval" : isBuyer ? "Items to be received" : "Pending products"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 2: Purchase Overview + Product Summary ── */}
      <div className="db-overview-grid">
        <div className="db-card" style={{ marginBottom: 0 }}>
          <div className="db-card-header">
            <h3 className="db-card-title">Purchase Overview</h3>
          </div>
          <div className="db-overview-cols">
            <div className="db-overview-item">
              <div className="db-overview-icon blue">
                <i className="bi bi-bag-check" />
              </div>
              <div className="db-overview-data">
                <strong>{isVendor || isBuyer ? details.orders.length : (d.orders ?? 0)}</strong>
                <span>{isVendor ? "Sales orders" : "Purchase orders"}</span>
              </div>
            </div>

            <div className="db-overview-item">
              <div className="db-overview-icon green">
                <i className="bi bi-cash-stack" />
              </div>
              <div className="db-overview-data">
                <strong>{fmt(isVendor ? vendorRevenue : isBuyer ? buyerSpend : 0)}</strong>
                <span>{isVendor ? "Order value" : "Purchase value"}</span>
              </div>
            </div>

            <div className="db-overview-item">
              <div className="db-overview-icon purple">
                <i className="bi bi-x-circle" />
              </div>
              <div className="db-overview-data">
                <strong>{isVendor ? vendorCancelledOrders : isBuyer ? buyerCancelledOrders : (d.pendingProducts ?? 0)}</strong>
                <span>{isVendor || isBuyer ? "Cancelled orders" : "Pending products"}</span>
              </div>
            </div>

            <div className="db-overview-item">
              <div className="db-overview-icon orange">
                <i className="bi bi-arrow-return-left" />
              </div>
              <div className="db-overview-data">
                <strong>{isVendor ? vendorReturns : isBuyer ? buyerReturns : 0}</strong>
                <span>Returns</span>
              </div>
            </div>
          </div>
        </div>

        <div className="db-card" style={{ marginBottom: 0 }}>
          <div className="db-card-header">
            <h3 className="db-card-title">Product Summary</h3>
          </div>
          <div className="db-overview-cols" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="db-overview-item">
              <div className="db-overview-icon blue">
                <i className="bi bi-person-badge" />
              </div>
              <div className="db-overview-data">
                <strong>{isVendor ? (d.offers ?? 0) : isBuyer ? (d.wishlist ?? 0) : (d.vendors ?? 0)}</strong>
                <span>{isVendor ? "Submitted offers" : isBuyer ? "Wishlist items" : "Vendors"}</span>
              </div>
            </div>

            <div className="db-overview-item">
              <div className="db-overview-icon purple">
                <i className="bi bi-tags" />
              </div>
              <div className="db-overview-data">
                <strong>{isVendor ? vendorCategoryCount : isBuyer ? (d.comparisons ?? 0) : (d.offers ?? 0)}</strong>
                <span>{isVendor ? "Product categories" : isBuyer ? "Saved comparisons" : "Active offers"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Sales & Purchase Chart + Order Summary Chart ── */}
      {isAdmin && <div className="db-charts-grid" style={{ marginTop: 20 }}>
        {/* Sales & Purchase Bar Chart */}
        <div className="db-card" style={{ marginBottom: 0 }}>
          <div className="db-card-header">
            <h3 className="db-card-title">Sales &amp; Purchase</h3>
            <div className="dropdown">
              <button
                type="button"
                className="db-btn db-btn-outline db-btn-sm"
                onClick={() => setPeriod(period === "Weekly" ? "Monthly" : "Weekly")}
              >
                <i className="bi bi-calendar3 me-1" /> {period}
              </button>
            </div>
          </div>

          <div className="db-chart-box">
            <svg viewBox="0 0 540 180" style={{ width: "100%", height: "100%", overflow: "visible" }}>
              {/* Horizontal grid lines */}
              <line x1="45" y1="20" x2="520" y2="20" stroke="#f1f3f5" strokeWidth="1" />
              <text x="35" y="24" fontSize="10" fill="#98a2b3" textAnchor="end">60,000</text>

              <line x1="45" y1="50" x2="520" y2="50" stroke="#f1f3f5" strokeWidth="1" />
              <text x="35" y="54" fontSize="10" fill="#98a2b3" textAnchor="end">50,000</text>

              <line x1="45" y1="80" x2="520" y2="80" stroke="#f1f3f5" strokeWidth="1" />
              <text x="35" y="84" fontSize="10" fill="#98a2b3" textAnchor="end">40,000</text>

              <line x1="45" y1="110" x2="520" y2="110" stroke="#f1f3f5" strokeWidth="1" />
              <text x="35" y="114" fontSize="10" fill="#98a2b3" textAnchor="end">30,000</text>

              <line x1="45" y1="140" x2="520" y2="140" stroke="#f1f3f5" strokeWidth="1" />
              <text x="35" y="144" fontSize="10" fill="#98a2b3" textAnchor="end">20,000</text>

              {/* Bar columns: [Month, purchaseHeight, salesHeight, x] */}
              {[
                { m: "Jan", p: 105, s: 95, x: 65 },
                { m: "Feb", p: 125, s: 90, x: 115 },
                { m: "Mar", p: 80, s: 105, x: 165 },
                { m: "Apr", p: 85, s: 98, x: 215 },
                { m: "May", p: 55, s: 88, x: 265 },
                { m: "Jun", p: 110, s: 98, x: 315 },
                { m: "Jul", p: 92, s: 88, x: 365 },
                { m: "Aug", p: 90, s: 86, x: 415 },
                { m: "Sep", p: 75, s: 90, x: 465 },
              ].map((bar, i) => (
                <g key={i}>
                  {/* Purchase bar (blue) */}
                  <rect
                    x={bar.x}
                    y={160 - bar.p}
                    width="8"
                    height={bar.p}
                    rx="4"
                    fill="url(#blueGrad)"
                  />
                  {/* Sales bar (green) */}
                  <rect
                    x={bar.x + 11}
                    y={160 - bar.s}
                    width="8"
                    height={bar.s}
                    rx="4"
                    fill="#22c55e"
                  />
                  {/* Month label */}
                  <text x={bar.x + 9} y="174" fontSize="11" fill="#667085" textAnchor="middle">
                    {bar.m}
                  </text>
                </g>
              ))}

              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="db-chart-legend">
            <span className="db-chart-legend-item">
              <span className="db-chart-dot blue" /> Purchase
            </span>
            <span className="db-chart-legend-item">
              <span className="db-chart-dot green" /> Sales
            </span>
          </div>
        </div>

        {/* Order Summary Line Chart */}
        <div className="db-card" style={{ marginBottom: 0 }}>
          <div className="db-card-header">
            <h3 className="db-card-title">Order Summary</h3>
          </div>

          <div className="db-chart-box">
            <svg viewBox="0 0 360 180" style={{ width: "100%", height: "100%", overflow: "visible" }}>
              <line x1="30" y1="30" x2="340" y2="30" stroke="#f1f3f5" strokeWidth="1" />
              <text x="25" y="34" fontSize="10" fill="#98a2b3" textAnchor="end">4000</text>

              <line x1="30" y1="65" x2="340" y2="65" stroke="#f1f3f5" strokeWidth="1" />
              <text x="25" y="69" fontSize="10" fill="#98a2b3" textAnchor="end">3000</text>

              <line x1="30" y1="100" x2="340" y2="100" stroke="#f1f3f5" strokeWidth="1" />
              <text x="25" y="104" fontSize="10" fill="#98a2b3" textAnchor="end">2000</text>

              <line x1="30" y1="135" x2="340" y2="135" stroke="#f1f3f5" strokeWidth="1" />
              <text x="25" y="139" fontSize="10" fill="#98a2b3" textAnchor="end">0</text>

              {/* Delivered curve (Blue) */}
              <path
                d="M 40 55 Q 85 105, 120 40 T 195 48 T 265 42 T 330 35"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2.5"
              />

              {/* Ordered curve (Orange) */}
              <path
                d="M 40 40 Q 65 98, 105 70 T 175 60 T 245 95 T 330 65"
                fill="none"
                stroke="#f97316"
                strokeWidth="2.5"
              />

              {/* Labels */}
              {["Jan", "Feb", "Mar", "Apr", "May"].map((m, i) => (
                <text key={m} x={45 + i * 68} y="156" fontSize="10" fill="#667085" textAnchor="middle">
                  {m}
                </text>
              ))}
            </svg>
          </div>

          <div className="db-chart-legend">
            <span className="db-chart-legend-item">
              <span className="db-chart-dot orange" /> Ordered
            </span>
            <span className="db-chart-legend-item">
              <span className="db-chart-dot blue" /> Delivered
            </span>
          </div>
        </div>
      </div>}

      {/* ── ROW 4: Top Selling Stock Table + Low Quantity Stock List ── */}
      {(isAdmin || isVendor) && <div className="db-charts-grid" style={{ marginTop: 20 }}>
        {/* Top Selling Stock */}
        <div className="db-card" style={{ marginBottom: 0 }}>
          <div className="db-card-header">
            <h3 className="db-card-title">Top Selling Stock</h3>
            <Link to={isAdmin ? "/admin/products" : isVendor ? "/vendor/products" : "/products"} className="db-see-all">
              See All
            </Link>
          </div>

          <div className="db-table-wrap">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Sold Quantity</th>
                  <th>Remaining Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p._id}>
                    <td className="db-cell-bold">{p.name}</td>
                    <td>{p.sku || "—"}</td>
                    <td>{p.sold ?? "—"}</td>
                    <td>{p.stock ?? "—"}</td>
                    <td>{p.price !== null && p.price !== undefined && p.price !== "" ? fmt(p.price) : "—"}</td>
                  </tr>
                ))}
                {!topProducts.length && <tr><td colSpan={5} className="text-center py-3 text-muted">No products available.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Quantity Stock */}
        <div className="db-card" style={{ marginBottom: 0 }}>
          <div className="db-card-header">
            <h3 className="db-card-title">Low Quantity Stock</h3>
            <Link to={isAdmin ? "/admin/products" : isVendor ? "/vendor/products" : "/products"} className="db-see-all">
              See All
            </Link>
          </div>

          <div className="db-stock-list">
            {lowStockItems.map((item) => (
              <div className="db-stock-item" key={item._id}>
                <div className="db-stock-thumb">
                  {item.images?.[0]?.url ? (
                    <img src={item.images[0].url} alt={item.name} />
                  ) : (
                    <i className="bi bi-box-seam" />
                  )}
                </div>
                <div className="db-stock-meta">
                  <strong>{item.name}</strong>
                  <small>SKU: {item.sku || "—"}</small>
                  <small>Remaining Quantity: {item.stock ?? "—"}</small>
                </div>
                <span className="db-stock-badge-low">Low</span>
              </div>
            ))}
            {!lowStockItems.length && <div className="text-muted py-3">No low-stock products.</div>}
          </div>
        </div>
      </div>}

      {/* Admin Operations Section (Work queue & approvals if admin) */}
      {isAdmin && (
        <div style={{ marginTop: 24 }}>
          <ApprovalQueues />
        </div>
      )}
    </DashboardShell>
  );
}


export default Dashboard;
