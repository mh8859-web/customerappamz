import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";

console.log("[AMAZ] Booting system with React version:", React.version);

const rootEl = document.getElementById("root");

if (!rootEl) {
  console.error("Critical Failure: Root element missing.");
} else {
  try {
    const root = createRoot(rootEl);
    root.render(
      <React.StrictMode>
        <HashRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </HashRouter>
      </React.StrictMode>
    );
  } catch (error) {
    console.error("React Mounting Failure:", error);
    rootEl.innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #F7F9FA;">
        <div style="background: white; padding: 32px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); max-width: 450px; width: 90%;">
          <h1 style="color: #0F1419; font-size: 22px; margin-bottom: 16px; font-weight: 700;">Connection Error</h1>
          <p style="color: #536471; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            A module conflict was detected. Please force refresh your browser to clear old cached files.
          </p>
          <button onclick="window.location.reload(true)" style="background: #1D9BF0; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; width: 100%; font-size: 16px;">
            Force Refresh Page
          </button>
        </div>
      </div>
    `;
  }
}