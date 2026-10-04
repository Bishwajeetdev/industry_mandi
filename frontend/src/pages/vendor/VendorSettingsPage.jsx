import React, { useEffect, useState } from "react";
import { api } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import DashboardShell from "../../components/dashboard/DashboardShell";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import ConfirmationModal from "../../components/common/ConfirmationModal";

function VendorSettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [state, setState] = useState({ loading: true, saving: false, message: "", error: "" });
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const load = () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    api.get("/account").then((response) => {
      const next = response.data.data.profile || {};
      setProfile(next);
      setForm(next);
      setState((s) => ({ ...s, loading: false }));
    }).catch((error) => setState((s) => ({ ...s, loading: false, error: error.response?.data?.message || "Unable to load settings." })));
  };

  useEffect(() => { load(); }, []);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateAddress = (key, field, value) => update(key, { ...(form[key] || {}), [field]: value });
  const uploadAsset = async (file, assetType, documentName = "") => {
    if (!file) return;
    const data = new FormData();
    data.append("asset", file);
    data.append("assetType", assetType);
    if (documentName) data.append("documentName", documentName);
    setState((s) => ({ ...s, saving: true, message: "", error: "" }));
    try {
      const response = await api.post("/vendor/settings/upload", data);
      const next = response.data.data;
      setProfile(next);
      setForm(next);
      updateUser({ profile: { logo: next.logo || "" } });
      setState((s) => ({ ...s, saving: false, message: response.data.message || "File uploaded successfully." }));
    } catch (error) {
      setState((s) => ({ ...s, saving: false, error: error.response?.data?.message || "Unable to upload file." }));
    }
  };
  const save = async (payload = form) => {
    setState((s) => ({ ...s, saving: true, message: "", error: "" }));
    try {
      const response = await api.patch("/vendor/settings", payload);
      const next = response.data.data;
      setProfile(next);
      setForm(next);
      setState((s) => ({ ...s, saving: false, message: "Settings saved successfully." }));
    } catch (error) {
      setState((s) => ({ ...s, saving: false, error: error.response?.data?.message || "Unable to save settings." }));
    }
  };
  const saveBank = async () => {
    setState((s) => ({ ...s, saving: true, message: "", error: "" }));
    try {
      const response = await api.patch("/account/bank", form.bankAccount || {});
      setProfile((current) => ({ ...current, bankAccount: response.data.data.bankAccount }));
      setForm((current) => ({ ...current, bankAccount: response.data.data.bankAccount }));
      setState((s) => ({ ...s, saving: false, message: "Payment details saved securely." }));
    } catch (error) {
      setState((s) => ({ ...s, saving: false, error: error.response?.data?.message || "Unable to save payment details." }));
    }
  };
  const deactivate = async () => {
    try {
      await api.post("/account/deactivate");
      setConfirmDeactivate(false);
      logout();
    } catch (error) {
      setState((s) => ({ ...s, error: error.response?.data?.message || "Unable to deactivate account." }));
    }
  };
  const tabs = [
    ["profile", "Vendor Profile", "bi-person-badge"],
    ["store", "Store Settings", "bi-shop"],
    ["contact", "Contact & Address", "bi-geo-alt"],
    ["payment", "Payment & Bank", "bi-bank"],
    ["verification", "Vendor Verification", "bi-patch-check"],
    ["account", "Account", "bi-shield-lock"],
  ];
  const addressFields = (key) => ["line1", "line2", "city", "state", "postalCode", "country"].map((field) => (
    <div className="col-md-6" key={`${key}-${field}`}>
      <label className="vendor-settings-label">{field === "line1" ? "Address line 1" : field === "line2" ? "Address line 2" : field[0].toUpperCase() + field.slice(1)}</label>
      <input className="form-control" value={form[key]?.[field] || ""} onChange={(event) => updateAddress(key, field, event.target.value)} />
    </div>
  ));

  return (
    <DashboardShell role="vendor" activeNav="/vendor/settings" title="Vendor settings">
      <ConfirmationModal
        isOpen={confirmDeactivate}
        title="Deactivate vendor account"
        message="This will deactivate your vendor account and sign you out immediately. Continue?"
        confirmText="Deactivate account"
        onCancel={() => setConfirmDeactivate(false)}
        onConfirm={deactivate}
        isLoading={state.saving}
      />
      <ConfirmationModal
        isOpen={confirmLogout}
        title="Confirm logout"
        message="Are you sure you want to sign out of this device?"
        confirmText="Log out"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => { setConfirmLogout(false); logout(); }}
      />
      <div className="vendor-settings-layout">
        <aside className="vendor-settings-tabs">
          <div className="vendor-settings-intro"><span className="vendor-settings-avatar">{form.logo ? <img src={form.logo} alt={`${user?.name || "Vendor"} logo`} /> : (user?.name || "V").slice(0, 1).toUpperCase()}</span><div><strong>{user?.name || "Vendor"}</strong><small>{form.company || "Manage your workspace"}</small></div></div>
          {tabs.map(([id, label, icon]) => <button type="button" key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><i className={`bi ${icon}`} />{label}<i className="bi bi-chevron-right ms-auto" /></button>)}
        </aside>
        <section className="vendor-settings-content">
          {state.message && <div className="alert alert-success">{state.message}</div>}
          {state.error && <div className="alert alert-danger">{state.error}</div>}
          {state.loading ? <Loading label="Loading settings…" /> : (
            <>
              {tab === "profile" && <SettingsCard title="Vendor profile" description="Tell buyers who you are and what your business supplies."><div className="row g-3">
                <div className="col-md-6"><label className="vendor-settings-label">Business name</label><input className="form-control" value={form.company || ""} onChange={(e) => update("company", e.target.value)} /></div>
                <div className="col-md-6"><label className="vendor-settings-label">Owner name</label><input className="form-control" value={form.ownerName || ""} onChange={(e) => update("ownerName", e.target.value)} /></div>
                <div className="col-md-6"><label className="vendor-settings-label">Category</label><input className="form-control" value={form.category || ""} onChange={(e) => update("category", e.target.value)} /></div>
                <div className="col-md-6"><label className="vendor-settings-label">GSTIN / Tax ID</label><input className="form-control" value={form.gstNumber || ""} onChange={(e) => update("gstNumber", e.target.value.toUpperCase())} /></div>
                <div className="col-12"><label className="vendor-settings-label">Business description</label><textarea className="form-control" rows="4" value={form.description || ""} onChange={(e) => update("description", e.target.value)} /></div>
                <div className="col-md-6"><label className="vendor-settings-label">Email</label><input className="form-control" value={form.email || ""} disabled /></div>
                <div className="col-md-6"><label className="vendor-settings-label">Phone</label><input className="form-control" value={form.phone || ""} onChange={(e) => update("phone", e.target.value)} /></div>
                <div className="col-md-6"><label className="vendor-settings-label">Website</label><input className="form-control" placeholder="https://example.com" value={form.website || ""} onChange={(e) => update("website", e.target.value)} /></div>
                <div className="col-md-6"><label className="vendor-settings-label">Logo</label><input className="form-control" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadAsset(e.target.files?.[0], "logo")} /><small className="text-muted">{form.logo ? "Logo uploaded" : "JPG, PNG, or WebP · max 10 MB"}</small></div>
              </div><SettingsSave saving={state.saving} onSave={() => save()} /></SettingsCard>}
              {tab === "store" && <SettingsCard title="Store settings" description="Control how your storefront appears to buyers."><div className="row g-3">
                <div className="col-md-6"><label className="vendor-settings-label">Store name</label><input className="form-control" value={form.company || ""} onChange={(e) => update("company", e.target.value)} /></div>
                <div className="col-md-6"><label className="vendor-settings-label">Store URL / slug</label><input className="form-control" value={form.slug || ""} onChange={(e) => update("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))} /></div>
                <div className="col-md-6"><label className="vendor-settings-label">Store banner</label><input className="form-control" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadAsset(e.target.files?.[0], "banner")} /><small className="text-muted">{form.banner ? "Banner uploaded" : "JPG, PNG, or WebP · max 10 MB"}</small></div>
                <div className="col-md-6"><label className="vendor-settings-label">Store status</label><select className="form-select" value={form.storeStatus || "open"} onChange={(e) => update("storeStatus", e.target.value)}><option value="open">Open for orders</option><option value="closed">Temporarily closed</option></select></div>
                <div className="col-12"><label className="vendor-settings-label">Store description</label><textarea className="form-control" rows="3" value={form.description || ""} onChange={(e) => update("description", e.target.value)} /></div>
                <div className="col-12"><label className="vendor-settings-label">Business hours</label><div className="row g-2">{["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => <div className="col-md-6" key={day}><input className="form-control" placeholder={`${day[0].toUpperCase()}${day.slice(1)} (e.g. 09:00 - 18:00)`} value={form.businessHours?.[day] || ""} onChange={(e) => update("businessHours", { ...(form.businessHours || {}), [day]: e.target.value })} /></div>)}</div></div>
              </div><SettingsSave saving={state.saving} onSave={() => save({ company: form.company, description: form.description, slug: form.slug, banner: form.banner, storeStatus: form.storeStatus, businessHours: form.businessHours })} /></SettingsCard>}
              {tab === "contact" && <SettingsCard title="Contact & address" description="Keep fulfilment and support details accurate."><div className="row g-3">
                <div className="col-md-6"><label className="vendor-settings-label">Primary phone</label><input className="form-control" value={form.phone || ""} onChange={(e) => update("phone", e.target.value)} /></div><div className="col-md-6"><label className="vendor-settings-label">Support email</label><input className="form-control" value={form.email || ""} disabled /></div>
                <h6 className="vendor-settings-subtitle">Business address</h6>{addressFields("businessAddress")}<h6 className="vendor-settings-subtitle">Billing address</h6>{addressFields("billingAddress")}<h6 className="vendor-settings-subtitle">Shipping address</h6>{addressFields("shippingAddress")}
                <h6 className="vendor-settings-subtitle">Primary warehouse address</h6>{["line1", "city", "state", "postalCode", "country"].map((field) => <div className="col-md-6" key={`warehouse-${field}`}><label className="vendor-settings-label">{field === "line1" ? "Address line 1" : field[0].toUpperCase() + field.slice(1)}</label><input className="form-control" value={form.warehouseAddresses?.[0]?.[field] || ""} onChange={(e) => update("warehouseAddresses", [{ ...(form.warehouseAddresses?.[0] || {}), [field]: e.target.value }])} /></div>)}
              </div><SettingsSave saving={state.saving} onSave={() => save({ phone: form.phone, businessAddress: form.businessAddress, billingAddress: form.billingAddress, shippingAddress: form.shippingAddress, warehouseAddresses: form.warehouseAddresses })} /></SettingsCard>}
              {tab === "payment" && <SettingsCard title="Payment & bank" description="Bank numbers are masked after saving and are never returned in full."><div className="row g-3">
                <div className="col-md-6"><label className="vendor-settings-label">Account holder</label><input className="form-control" value={form.bankAccount?.accountName || ""} onChange={(e) => update("bankAccount", { ...(form.bankAccount || {}), accountName: e.target.value })} /></div><div className="col-md-6"><label className="vendor-settings-label">Bank name</label><input className="form-control" value={form.bankAccount?.bankName || ""} onChange={(e) => update("bankAccount", { ...(form.bankAccount || {}), bankName: e.target.value })} /></div><div className="col-md-6"><label className="vendor-settings-label">Account number</label><input className="form-control" type="password" placeholder={form.bankAccount?.accountNumberMasked || "Enter account number"} value={form.bankAccount?.accountNumber || ""} onChange={(e) => update("bankAccount", { ...(form.bankAccount || {}), accountNumber: e.target.value })} /></div><div className="col-md-6"><label className="vendor-settings-label">IFSC</label><input className="form-control" value={form.bankAccount?.ifsc || ""} onChange={(e) => update("bankAccount", { ...(form.bankAccount || {}), ifsc: e.target.value.toUpperCase() })} /></div><div className="col-md-6"><label className="vendor-settings-label">UPI ID</label><input className="form-control" value={form.payoutPreference || ""} onChange={(e) => update("payoutPreference", e.target.value)} /></div>
              </div><SettingsSave saving={state.saving} onSave={saveBank} /></SettingsCard>}
              {tab === "verification" && <SettingsCard title="Vendor verification" description="Upload your verification documents securely."><div className="vendor-verification-list">{["GST certificate", "Business registration", "PAN card", "Bank verification"].map((name) => { const doc = (form.documents || []).find((item) => item.name === name) || {}; return <div className="vendor-verification-row" key={name}><div><strong>{name}</strong><small>{doc.status || "Not submitted"}</small></div><div><input className="form-control" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => uploadAsset(e.target.files?.[0], "document", name)} /><small className="text-muted">JPG, PNG, WebP, or PDF · max 10 MB</small>{doc.url && <a className="vendor-verification-preview" href={doc.url} target="_blank" rel="noopener noreferrer" aria-label={`Preview ${name}`}><i className="bi bi-eye" /> Preview</a>}</div></div>; })}</div></SettingsCard>}
              {tab === "account" && <SettingsCard title="Account preferences" description="Personalize your workspace and manage access."><div className="row g-3"><div className="col-md-4"><label className="vendor-settings-label">Language</label><select className="form-select" value={form.language || "English"} onChange={(e) => update("language", e.target.value)}><option>English</option><option>Hindi</option></select></div><div className="col-md-4"><label className="vendor-settings-label">Currency</label><select className="form-select" value={form.currency || "INR"} onChange={(e) => update("currency", e.target.value)}><option>INR</option><option>USD</option></select></div><div className="col-md-4"><label className="vendor-settings-label">Timezone</label><input className="form-control" value={form.timezone || "Asia/Kolkata"} onChange={(e) => update("timezone", e.target.value)} /></div></div><SettingsSave saving={state.saving} onSave={() => save({ language: form.language, currency: form.currency, timezone: form.timezone })} /><div className="vendor-danger-zone"><strong>Danger zone</strong><p>Deactivation suspends the vendor account and signs you out.</p><button type="button" className="btn btn-outline-danger" onClick={() => setConfirmDeactivate(true)}>Deactivate account</button><button type="button" className="btn btn-outline-secondary ms-2"               onClick={() => setConfirmLogout(true)}>Log out all devices</button></div></SettingsCard>}
            </>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function SettingsCard({ title, description, children }) {
  return <div className="vendor-settings-card"><div className="vendor-settings-card-header"><div><h2>{title}</h2><p>{description}</p></div></div>{children}</div>;
}
function SettingsSave({ saving, onSave }) {
  return <div className="vendor-settings-save"><button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div>;
}


export default VendorSettingsPage;
