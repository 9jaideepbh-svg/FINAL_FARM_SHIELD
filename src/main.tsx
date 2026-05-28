import { createRoot } from "react-dom/client";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App.tsx";
import "./index.css";

console.log("App initializing with Firebase Auth...");

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Root element not found");

  createRoot(rootElement).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  console.log("App rendered successfully");
} catch (error) {
  console.error("App initialization failed:", error);
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `<div style="padding: 20px; color: red;"><h1>Initialization Error</h1><pre>${(error as Error).message}</pre></div>`;
  }
}
