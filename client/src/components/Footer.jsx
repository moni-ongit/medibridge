import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-ink-100 bg-ink-900 text-ink-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-500 text-lg">🩺</span>
              <span className="font-display text-xl font-semibold text-white">MediBridge</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-ink-100/80">{t("footer.tagline")}</p>
          </div>

          <div>
            <h4 className="font-display text-base font-semibold text-white">{t("footer.quickLinks")}</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-100/80">
              <li><Link to="/about" className="hover:text-teal-300">{t("nav.about")}</Link></li>
              <li><Link to="/how-it-works" className="hover:text-teal-300">{t("nav.howItWorks")}</Link></li>
              <li><Link to="/doctors" className="hover:text-teal-300">{t("nav.findDoctors")}</Link></li>
              <li><Link to="/contact" className="hover:text-teal-300">{t("nav.contact")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-base font-semibold text-white">{t("footer.contactUs")}</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-100/80">
              <li>support@medibridge.demo</li>
              <li>+91 98765 43210</li>
              <li>Chennai, Tamil Nadu, India</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-ink-100/60">
          © {new Date().getFullYear()} MediBridge. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
