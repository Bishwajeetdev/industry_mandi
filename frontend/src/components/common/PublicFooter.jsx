import React from "react";
import { useLocation } from "react-router-dom";
import MarketFooter from "./MarketFooter";

function PublicFooter() {
  const { pathname } = useLocation();
  return ["/about", "/contact"].includes(pathname) ? <MarketFooter /> : null;
}


export default PublicFooter;
