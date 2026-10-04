import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { getDashboardPath } from "../utils/helpers";

function AuthPage({ register = false }) {
  const nav = useNavigate(),
    [searchParams] = useSearchParams(),
    { login } = useAuth(),
    [form, setForm] = useState({
      name: "",
      email: "",
      password: "",
      role: searchParams.get("role") === "vendor" ? "vendor" : "buyer",
      company: "",
    }),
    [state, setState] = useState({ loading: false, error: "", message: "" }),
    [showPassword, setShowPassword] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setState({ loading: true, error: "", message: "" });
    try {
      const r = await api.post("/auth/" + (register ? "register" : "login"), form);
      if (register && form.role === "vendor") { setState({ loading: false, error: "", message: r.data.message }); return; }
      login(r.data.data);
      const role = r.data.data.user.role;
      const redirect = searchParams.get("redirect");
      if (redirect && redirect.startsWith("/")) { nav(redirect); }
      else { nav(role === "admin" ? "/admin" : role === "vendor" ? "/vendor" : "/dashboard/buyer"); }
    } catch (err) {
      setState({ loading: false, error: err.response?.data?.message || "Unable to connect to the server.", message: "" });
    }
  };
  const vendorFeatures = [["bi-patch-check-fill","OEM Verified Listings","List machinery with direct factory pricing"],["bi-bar-chart-line","SpecMatrix Intelligence","Real-time telemetry comparison and analytics"],["bi-shield-lock","Escrow Payments","Milestone-based fund release on gate inspection"],["bi-lightning-charge-fill","AI-Powered Matching","Automated buyer-equipment pairing with 91% accuracy"]];
  const buyerFeatures = [["bi-search","12,000+ Industrial SKUs","CNC machines, motors, pumps, VFDs, switchgear"],["bi-bar-chart-line","Side-by-Side SpecMatrix","Compare OEM specs, scores, and pricing in one view"],["bi-heart","Wishlist and RFQ Queue","Save and track machinery for procurement approvals"],["bi-truck","Pan-India Freight","Heavy equipment logistics with real-time tracking"]];
  const features = form.role === "vendor" ? vendorFeatures : buyerFeatures;
  const brandTitle = register ? (form.role === "vendor" ? "Start selling to verified industrial buyers." : "Source machinery directly from OEMs.") : "India's precision industrial marketplace.";
  return (
    <main className="db-auth-wrap">
      <div className="db-auth-brand">
        <div className="db-auth-brand-logo">
          <div className="db-auth-brand-logo-icon"><i className="bi bi-gear-wide-connected" /></div>
          <div>
            <div style={{ fontFamily: "var(--font-headline)", fontWeight: 800, fontSize: "1.1rem", color: "#fff", letterSpacing: "-0.02em" }}>INDUSTRY MANDI</div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.7)" }}>Industrial Exchange</div>
          </div>
        </div>
        <h2 style={{ color: "#fff", fontFamily: "var(--font-headline)", fontSize: "1.6rem", fontWeight: 800, marginBottom: 12, letterSpacing: "-0.03em", position: "relative" }}>{brandTitle}</h2>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.92rem", maxWidth: 360, lineHeight: 1.6, position: "relative" }}>{register ? "Join 348 verified OEM partners and 4,800+ validated machinery SKUs." : "Access real-time telemetry, SpecMatrix comparisons, and direct OEM pricing."}</p>
        <div className="db-auth-features">
          {features.map(([icon, title, desc]) => (<div className="db-auth-feature" key={title}><div className="db-auth-feature-icon"><i className={"bi " + icon} /></div><div><strong>{title}</strong><span>{desc}</span></div></div>))}
        </div>
        <div style={{ display: "flex", gap: 24, marginTop: 40, position: "relative" }}>
          {[["348","OEM Partners"],["4,892","Validated SKUs"],["48.2L+","Monthly GTV"]].map(([val, lbl]) => (<div key={lbl} style={{ textAlign: "center" }}><div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>{val}</div><div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.65)", marginTop: 2 }}>{lbl}</div></div>))}
        </div>
      </div>
      <div className="db-auth-form-side">
        <div className="db-auth-form-inner">
          <div className="db-auth-form-logo"><div className="db-auth-form-logo-icon"><i className="bi bi-gear-wide-connected" /></div></div>
          <h1 className="db-auth-heading">{register ? "Create account" : "Log in to your account"}</h1>
          <p className="db-auth-subheading">{register ? "Join the industrial procurement network." : "Welcome back! Please enter your details."}</p>
          {state.error && <div className="db-auth-alert error"><i className="bi bi-exclamation-triangle-fill" style={{ flexShrink: 0 }} /> {state.error}</div>}
          {state.message && <div className="db-auth-alert success"><i className="bi bi-check-circle-fill" style={{ flexShrink: 0 }} /> {state.message}</div>}
          <form onSubmit={submit} noValidate>
            {register && (<div className="db-auth-field"><label htmlFor="auth-name">Full name</label><div className="db-auth-input-wrap"><i className="bi bi-person" /><input id="auth-name" required placeholder="Rajesh Kumar" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div></div>)}
            <div className="db-auth-field"><label htmlFor="auth-email">Email</label><div className="db-auth-input-wrap"><i className="bi bi-envelope" /><input id="auth-email" required type="email" placeholder="Enter your email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div></div>
            <div className="db-auth-field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label htmlFor="auth-password" style={{ margin: 0 }}>Password</label>
                {!register && <Link to="#" className="db-auth-forgot">Forgot password?</Link>}
              </div>
              <div className="db-auth-input-wrap"><i className="bi bi-lock" /><input id="auth-password" required minLength="8" type={showPassword ? "text" : "password"} placeholder={register ? "Min. 8 characters" : "........"} autoComplete={register ? "new-password" : "current-password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><button type="button" className="db-auth-eye" aria-label="Toggle password visibility" onClick={() => setShowPassword((v) => !v)}><i className={"bi bi-eye" + (showPassword ? "-slash" : "")} /></button></div>
            </div>
            {register && form.role === "vendor" && (<div className="db-auth-field"><label htmlFor="auth-company">Company / Organisation name</label><div className="db-auth-input-wrap"><i className="bi bi-buildings" /><input id="auth-company" required placeholder="Siemens India Ltd." value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div></div>)}
            {!register && (<div className="db-auth-row"><label className="db-auth-remember"><input type="checkbox" style={{ accentColor: "var(--db-primary)" }} /> Remember for 30 days</label></div>)}
            <button type="submit" disabled={state.loading} className="db-auth-submit">{state.loading ? <><span className="spinner-border spinner-border-sm me-2" />Processing...</> : register ? (form.role === "vendor" ? "Submit Vendor Application" : "Create Buyer Account") : "Sign in"}</button>
            <p className="db-auth-switch">{register ? "Already have an account?" : "Don't have an account?"} <Link to={register ? "/login" : "/register"}>{register ? "Sign in" : "Sign up"}</Link></p>
            {!register && <p className="db-auth-switch" style={{ marginTop: 4 }}>Want to sell? <Link to="/register?role=vendor">Become a Vendor</Link></p>}
          </form>
        </div>
      </div>
    </main>
  );
}

export default AuthPage;
