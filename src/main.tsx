import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// If someone reaches the old Lovable-hosted copy (any *.lovable.app
// subdomain), send them straight to the real production domain instead
// of rendering the stale app here. Runs before React mounts.
const PRODUCTION_HOST = "bikepark.meitallehavi.com";
if (window.location.hostname.endsWith(".lovable.app")) {
  window.location.replace(
    `https://${PRODUCTION_HOST}${window.location.pathname}${window.location.search}`
  );
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
