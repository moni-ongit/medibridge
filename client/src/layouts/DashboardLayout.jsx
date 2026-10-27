import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import LanguageSelector from "../components/LanguageSelector.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const NAV_ITEMS = {
  patient: [
    { to: "/patient/dashboard", label: "dashboard", icon: "🏠" },
    { to: "/patient/appointments", label: "myAppointments", icon: "📅" },
    { to: "/doctors", label: "findDoctors", icon: "🔍" },
    { to: "/patient/profile", label: "profile", icon: "👤" },
  ],
  doctor: [
    { to: "/doctor/dashboard", label: "dashboard", icon: "🏠" },
    { to: "/doctor/appointments", label: "myAppointments", icon: "📅" },
    { to: "/doctor/availability", label: "availability", icon: "🗓️" },
    { to: "/doctor/profile", label: "profile", icon: "👤" },
  ],
  interpreter: [
    { to: "/interpreter/dashboard", label: "dashboard", icon: "🏠" },
    { to: "/interpreter/requests", label: "requests", icon: "🔔" },
    { to: "/interpreter/profile", label: "profile", icon: "👤" },
  ],
};

const LABELS = {
  dashboard: { en: "Dashboard", ta: "டாஷ்போர்டு", hi: "डैशबोर्ड" },
  myAppointments: { en: "My Appointments", ta: "எனது சந்திப்புகள்", hi: "मेरे अपॉइंटमेंट" },
  findDoctors: { en: "Find Doctors", ta: "மருத்துவர்களைத் தேடுங்கள்", hi: "डॉक्टर खोजें" },
  profile: { en: "Profile", ta: "சுயவிவரம்", hi: "प्रोफ़ाइल" },
  availability: { en: "Availability", ta: "கிடைக்கும் நிலை", hi: "उपलब्धता" },
  requests: { en: "Requests", ta: "கோரிக்கைகள்", hi: "अनुरोध" },
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const items = NAV_ITEMS[user?.role] || [];
  const lang = i18n.language;

  return (
    <div className="flex min-h-screen bg-mist-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-ink-100 bg-white transition-transform md:static md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center gap-2 border-b border-ink-100 px-5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-600 text-white">🩺</span>
          <span className="font-display text-lg font-semibold text-ink-900">MediBridge</span>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-teal-50 text-teal-700" : "text-ink-600 hover:bg-mist-100"
                }`
              }
            >
              <span aria-hidden="true">{item.icon}</span>
              {LABELS[item.label]?.[lang] || LABELS[item.label]?.en}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-ink-100 p-4">
          <div className="mb-3 flex items-center gap-2 px-1">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-ink-900 text-xs font-semibold text-white">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
              <p className="truncate text-xs capitalize text-ink-400">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="btn-secondary w-full !py-2 text-xs"
          >
            {t("nav.logout")}
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-ink-900/40 md:hidden" onClick={() => setOpen(false)} />}

      {/* Content */}
      <div className="flex-1 md:pl-0">
        <header className="flex h-16 items-center justify-between border-b border-ink-100 bg-white px-4 md:px-8">
          <button className="rounded-lg border border-ink-100 p-2 md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            ☰
          </button>
          <Link to="/" className="hidden text-sm font-medium text-ink-400 hover:text-teal-700 md:block">
            ← Back to site
          </Link>
          <LanguageSelector />
        </header>
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
