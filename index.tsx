import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import App from "./App.tsx";

const rootEl = document.getElementById("root");

if (!rootEl) {
  console.error("Critical: Root element '#root' not found in index.html");
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
    console.error("Failed to render the application:", error);
    rootEl.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h1 style="color: #0F1419;">Application Loading Error</h1>
        <p style="color: #536471;">Something went wrong while starting the app. Please check the console for details.</p>
        <pre style="text-align: left; background: #eee; padding: 10px; border-radius: 8px; margin-top: 20px; overflow: auto;">${error instanceof Error ? error.stack : String(error)}</pre>
      </div>
    `;
  }
}