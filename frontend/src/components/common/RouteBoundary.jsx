import React from "react";
import { Link, useLocation } from "react-router-dom";

class RouteErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Route render failed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="container py-5">
          <div className="empty-state">
            <i className="bi bi-arrow-clockwise" />
            <h2>This page needs to be reloaded</h2>
            <p>Something went wrong while changing pages.</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
function RouteBoundary({ children }) {
  const location = useLocation();
  return <RouteErrorBoundary key={location.key}>{children}</RouteErrorBoundary>;
}

export { RouteErrorBoundary, RouteBoundary };
export default RouteBoundary;
