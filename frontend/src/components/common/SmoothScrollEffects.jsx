import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollToPlugin, useGSAP);

function SmoothScrollEffects({ pageRef }) {
  const location = useLocation();

  useGSAP(() => {
    const page = pageRef.current;
    if (!page) return undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, 0);
      return undefined;
    }

    gsap.fromTo(
      page,
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.55, ease: "power2.out", clearProps: "transform" },
    );
    gsap.to(window, { scrollTo: { y: 0, autoKill: true }, duration: 0.6, ease: "power2.out" });
    return undefined;
  }, { dependencies: [location.key], scope: pageRef, revertOnUpdate: true });

  return null;
}


export default SmoothScrollEffects;
