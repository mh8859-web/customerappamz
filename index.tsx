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
    console.error("Rendering Failure:", error);
    rootEl.innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: 'Inter', sans-serif; background: #F7F9FA; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <h1 style="color: #0F1419; font-size: 24px; margin-bottom: 12px;">App Failed to Start</h1>
        <p style="color: #536471; max-width: 400px; line-height: 1.5;">The system encountered a version conflict or initialization error. Please clear your cache and try again.</p>
        <div style="margin-top: 30px; text-align: left; background: #FFF; padding: 20px; border-radius: 12px; border: 1px solid #CFD9DE; max-width: 90%; overflow: auto;">
          <code style="font-size: 12px; color: #E0245E;">${error instanceof Error ? error.message : String(error)}</code>
          <pre style="font-size: 10px; color: #536471; margin-top: 10px;">${error instanceof Error ? error.stack : ''}</pre>
        </div>
      </div>
    `;
  }
}