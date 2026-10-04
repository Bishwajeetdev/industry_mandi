import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/api";
import { fmt } from "../../utils/helpers";
import DashboardShell from "../../components/dashboard/DashboardShell";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import ConfirmationModal from "../../components/common/ConfirmationModal";

function ApprovalQueues() {
  const [kind, setKind] = useState("vendors"),
    [state, setState] = useState({ loading: true, items: [], error: "" });
  const load = () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    api
      .get(`/admin/queue/${kind}`)
      .then((r) => setState({ loading: false, items: r.data.data, error: "" }))
      .catch((e) =>
        setState({
          loading: false,
          items: [],
          error: e.response?.data?.message || e.message,
        }),
      );
  };
  useEffect(() => {
    load();
  }, [kind]);
  const decide = (item, status) => {
    const resource = {
      vendors: "vendors",
      products: "products",
      offers: "offers",
      pairings: "pairing",
      reviews: "reviews",
    }[kind];
    const reason =
      kind === "pairings" && status !== "approved"
        ? window.prompt("Reason for the vendor (optional):")
        : "";
    if (reason === null) return;
    api
      .patch(`/admin/${resource}/${item._id}`, { status, reason })
      .then(load)
      .catch((e) =>
        setState((s) => ({
          ...s,
          error: e.response?.data?.message || e.message,
        })),
      );
  };
  return (
    <section className="dashboard-panel mt-4 approval-queues">
      <div className="approval-queues-header">
        <div className="approval-queues-title">
          <span className="approval-queues-kicker"><i className="bi bi-shield-check" /> ADMIN WORKSPACE</span>
          <h3 className="mb-0">Approval queues</h3>
          <small className="text-secondary">
            Every public record requires this review.
          </small>
        </div>
        <select
          className="form-select approval-queues-select"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          {["vendors", "products", "offers", "pairings", "reviews"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      {state.loading ? (
        <div className="approval-queues-loading"><span className="spinner-border spinner-border-sm" /> Loading queue…</div>
      ) : state.error ? (
        <div className="alert alert-danger approval-queues-alert"><i className="bi bi-exclamation-circle me-2" />{state.error}</div>
      ) : !state.items.length ? (
        <div className="approval-queues-empty"><i className="bi bi-check2-circle" /><div><strong>All caught up</strong><span>No pending {kind} are waiting for review.</span></div></div>
      ) : (
        <div className="table-responsive approval-queues-table-wrap">
          <table className="table align-middle approval-queues-table">
            <thead>
              <tr>
                <th>Submission</th>
                <th>Details</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((x) => (
                <tr key={x._id}>
                  <td>
                    <b>
                      {x.name ||
                        x.submittedName ||
                        x.title ||
                        x.product?.name ||
                        "Offer"}
                    </b>
                    <br />
                    <small>
                      {x.email || x.vendor?.email || x.buyer?.name || ""}
                    </small>
                    {kind === "pairings" && x.product && (
                      <small className="d-block text-primary">
                        Master product: {x.product.name}
                      </small>
                    )}
                  </td>
                  <td>
                    {x.offer?.price ? (
                      <>
                        <b>{fmt(x.offer.price)}</b>
                        <br />
                        <small>
                          {x.offer.sku || "No SKU"} ·{" "}
                          {x.offer.warranty || "No warranty stated"}
                        </small>
                      </>
                    ) : x.price ? (
                      fmt(x.price)
                    ) : x.matchConfidence ? (
                      `${x.matchConfidence}% match`
                    ) : x.category || x.rating ? (
                      `Rating: ${x.rating || "—"}`
                    ) : (
                      "Awaiting review"
                    )}
                  </td>
                  <td className="approval-queues-actions">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => decide(x, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => decide(x, "rejected")}
                    >
                      Reject
                    </button>
                    {kind === "pairings" && (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => decide(x, "changes_requested")}
                      >
                        Request changes
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}


export default ApprovalQueues;
