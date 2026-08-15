"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    translate?: any;
  }
}

export default function Translator() {
  useEffect(() => {
    if (document.getElementById("cc-translate-js")) return;
    const script = document.createElement("script");
    script.id = "cc-translate-js";
    script.src = "/translate.js";
    script.async = true;
    script.onload = () => {
      const t = window.translate;
      if (!t) return;
      t.service.use("client.edge");
      t.setAutoDiscriminateLocalLanguage();
      t.listener.start();
      t.execute();
    };
    document.body.appendChild(script);
  }, []);

  return null;
}
