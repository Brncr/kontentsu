import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

try {
  createRoot(document.getElementById("root")!).render(<App />);
} catch (err) {
  // Show error on screen if React fails to mount
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#020817;color:#fff;font-family:monospace;padding:2rem;">
        <div style="max-width:600px;text-align:center;">
          <h1 style="color:#ff4444;font-size:1.5rem;margin-bottom:1rem;">⚠️ Erro de Inicialização</h1>
          <pre style="background:#111;padding:1rem;border-radius:8px;text-align:left;overflow-x:auto;font-size:0.8rem;color:#ff8888;">${err instanceof Error ? err.message + '\n\n' + err.stack : String(err)}</pre>
        </div>
      </div>
    `;
  }
  console.error("Fatal initialization error:", err);
}
