import { useEffect } from "react";
import App from "./App";
import "./talmud.css";

export default function TalmudEntry() {
  useEffect(() => {
    if ("serviceWorker" in navigator && !window.location.hostname.includes("preview")) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
  }, []);
  return <App />;
}
