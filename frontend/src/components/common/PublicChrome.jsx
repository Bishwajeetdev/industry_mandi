import React from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import CartDrawer from "./CartDrawer";
import CompareQueue from "./CompareQueue";

function PublicChrome() {
  const location = useLocation();
  const dashboardRoute = [
    "/admin",
    "/vendor",
    "/account",
    "/buyer/account",
    "/dashboard/buyer",
  ].some((prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`));

  if (dashboardRoute) return null;

  return (
    <>
      <Header />
      <CartDrawer />
      <CompareQueue />
      <a className="whatsapp-float" href="https://wa.me/917903553221" target="_blank" rel="noreferrer" aria-label="Chat with us on WhatsApp"><i className="bi bi-whatsapp" /></a>
    </>
  );
}

export default PublicChrome;
