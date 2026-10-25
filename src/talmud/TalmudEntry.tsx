import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import App from "./App";
import "./talmud.css";

export default function TalmudEntry() {
  useEffect(() => {
    if ("serviceWorker" in navigator && !import.meta.env.DEV && !window.location.hostname.includes("preview")) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
  }, []);
  return <MotionConfig reducedMotion="user"><App /></MotionConfig>;
}
