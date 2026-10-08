import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("The Journey runtime error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="runtime-error-page">
          <div className="runtime-error-glow" />
          <div className="runtime-error-card">
            <div className="brand-mark large">✝</div>
            <div className="eyebrow">THE JOURNEY</div>
            <h1>We hit a bump starting the Journey.</h1>
            <p>The site loaded, but one part of the app could not start. Refreshing will retry the app.</p>
            <div className="runtime-error-actions">
              <button className="primary-btn" onClick={() => location.reload()}>Reload The Journey</button>
              <button className="ghost-btn" onClick={() => localStorage.clear()}>Reset local app data</button>
            </div>
            <details>
              <summary>Technical details</summary>
              <pre>{this.state.error?.message || "Unknown runtime error"}</pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

window.dispatchEvent(new Event("journey-react-started"));
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
