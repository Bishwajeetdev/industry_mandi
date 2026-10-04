import React from "react";
import { Link } from "react-router-dom";

function MarketFooter() {
  return <footer className="market-footer"><div className="container"><div className="footer-top"><div><Link className="navbar-brand" to="/"><span className="brand-dot" /><span className="d-flex flex-column text-start"><span className="brand-name">INDUSTRY MANDI</span><span className="brand-subtext">Industrial Exchange</span></span></Link><p>Direct OEM procurement, verified manufacturer pricing, and benchmark telemetry across industrial equipment.</p></div><div className="footer-links"><div><strong>Catalog</strong><Link to="/products">All Machinery</Link><Link to="/compare">SpecMatrix Compare</Link><Link to="/price-finder">Price Finder</Link></div><div><strong>Enterprise</strong><Link to="/about">About Us</Link><Link to="/contact">Contact Support</Link><Link to="/register?role=vendor">Sell with us</Link></div><div><strong>Contact</strong><a href="mailto:hello@industrymandi.local">Email support</a><a href="tel:+917903553221">+91 7903553221</a><Link to="/contact">Talk to our team</Link></div></div></div><div className="footer-bottom"><span>© 2026 Industry Mandi. Built for precision industrial procurement.</span><span><i className="bi bi-linkedin" /> <i className="bi bi-twitter-x" /> <i className="bi bi-shield-check" /></span></div></div></footer>;
}


export default MarketFooter;
