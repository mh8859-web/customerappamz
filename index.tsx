import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import App from "./App.tsx";

const rootEl = document.getElementById("root");

if (!rootEl) {
  console.error("Critical Error: Root element '#root' not found.");
} else {
  try {
    // Only use createRoot once to avoid mounting conflicts
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
    console.error("Initialization Error:", error);
    rootEl.innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: 'Inter', sans-serif; background: #F7F9FA; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="background: white; padding: 32px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); max-width: 500px; width: 100%;">
          <h1 style="color: #0F1419; font-size: 24px; margin-bottom: 12px; font-weight: 700;">System Failed to Load</h1>
          <p style="color: #536471; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            This is likely due to a cached version conflict in your browser. 
            Please clear your browser cache or open in Incognito.
          </p>
          <div style="text-align: left; background: #FFF5F5; padding: 16px; border-radius: 12px; border: 1px solid #FFD1D1; overflow: auto; max-height: 200px;">
            <code style="font-size: 12px; color: #E0245E; white-space: pre-wrap;">${error instanceof Error ? error.stack : String(error)}</code>
          </div>
          <button onclick="window.location.reload()" style="margin-top: 24px; background: #1D9BF0; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
            Retry Connection
          </button>
        </div>
      </div>
    `;
  }
}