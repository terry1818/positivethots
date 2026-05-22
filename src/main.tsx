import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { reportError } from "./lib/errorReporting";
import { initCapacitor, applySafeAreaInsets } from "./lib/capacitor";

// Apply safe area insets synchronously before render
applySafeAreaInsets();

window.addEventListener("error", (event) => {
  if (event.error instanceof Error) {
    reportError(event.error);
  }
});

window.addEventListener("unhandledrejection", (event) => {
  const error = event.reason instanceof Error
    ? event.reason
    : new Error(String(event.reason));
  reportError(error);
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// Initialize native plugins after first render
initCapacitor();

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "activated" && navigator.serviceWorker.controller) {
              // New version available — reload on next navigation
              console.log("New version available");
            }
          });
        }
      });
    });
  });
}
