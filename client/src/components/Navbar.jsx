import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition hover:text-teal-700 ${isActive ? "text-teal-700" : "text-ink-600"}`;

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardPath = user ? `/${user.role}/dashboard` : "/login";

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-600 text-lg text-white">🩺</span>
          <span className="font-display text-xl font-semibold text-ink-900">MediBridge</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          <NavLink to="/" end className={navLinkClass}>{t("nav.home")}</NavLink>
          <NavLink to="/about" className={navLinkClass}>{t("nav.about")}</NavLink>
          <NavLink to="/how-it-works" className={navLinkClass}>{t("nav.howItWorks")}</NavLink>
          <NavLink to="/doctors" className={navLinkClass}>{t("nav.findDoctors")}</NavLink>
          <NavLink to="/contact" className={navLinkClass}>{t("nav.contact")}</NavLink>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSelector />
          {user ? (
            <>
              <Link to={dashboardPath} className="text-sm font-semibold text-ink-800 hover:text-teal-700">
                {t("nav.dashboard")}
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="btn-secondary !px-4 !py-2 text-xs"
              >
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-ink-800 hover:text-teal-700">
                {t("nav.login")}
              </Link>
              <Link to="/register" className="btn-primary !px-5 !py-2.5 text-xs">
                {t("nav.register")}
              </Link>
            </>
          )}
        </div>

        <button
          className="grid h-9 w-9 place-items-center rounded-lg border border-ink-100 md:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className="text-lg">{menuOpen ? "✕" : "☰"}</span>
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-ink-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <NavLink to="/" end className={navLinkClass} onClick={() => setMenuOpen(false)}>{t("nav.home")}</NavLink>
            <NavLink to="/about" className={navLinkClass} onClick={() => setMenuOpen(false)}>{t("nav.about")}</NavLink>
            <NavLink to="/how-it-works" className={navLinkClass} onClick={() => setMenuOpen(false)}>{t("nav.howItWorks")}</NavLink>
            <NavLink to="/doctors" className={navLinkClass} onClick={() => setMenuOpen(false)}>{t("nav.findDoctors")}</NavLink>
            <NavLink to="/contact" className={navLinkClass} onClick={() => setMenuOpen(false)}>{t("nav.contact")}</NavLink>
            <div className="mt-2 flex items-center justify-between">
              <LanguageSelector />
              {user ? (
                <Link to={dashboardPath} className="text-sm font-semibold text-teal-700" onClick={() => setMenuOpen(false)}>
                  {t("nav.dashboard")}
                </Link>
              ) : (
                <div className="flex gap-3">
                  <Link to="/login" className="text-sm font-semibold text-ink-800" onClick={() => setMenuOpen(false)}>{t("nav.login")}</Link>
                  <Link to="/register" className="text-sm font-semibold text-teal-700" onClick={() => setMenuOpen(false)}>{t("nav.register")}</Link>
                </div>
              )}
            </div>
            {user && (
              <button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                  navigate("/");
                }}
                className="btn-secondary mt-2 w-full !py-2 text-xs"
              >
                {t("nav.logout")}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
