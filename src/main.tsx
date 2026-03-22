import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { reportError } from "./lib/errorReporting";

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

createRoot(document.getElementById("root")!).render(<App />);
