import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const LANG_NAMES = { en: "English", ta: "Tamil", hi: "Hindi" };

export default function DoctorCard({ doctor }) {
  const { t } = useTranslation();
  if (!doctor?.user) return null;

  return (
    <div className="card flex flex-col gap-4 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-teal-50 text-xl font-semibold text-teal-700">
          {doctor.user.name?.[0]?.toUpperCase() || "D"}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-semibold text-ink-900">{doctor.user.name}</h3>
          <p className="text-sm text-teal-700">{doctor.specialization}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-ink-400">
        <span className="badge bg-mist-100 text-ink-600">{doctor.experience || 0}+ {t("doctors.yearsExperience")}</span>
        {doctor.consultationFee ? (
          <span className="badge bg-amber-50 text-amber-600">₹{doctor.consultationFee}</span>
        ) : null}
      </div>

      <div className="text-sm text-ink-600">
        <span className="font-medium text-ink-800">{t("doctors.speaks")}: </span>
        {(doctor.languages || []).map((l) => LANG_NAMES[l] || l).join(", ") || "English"}
      </div>

      {doctor.bio && <p className="line-clamp-2 text-sm text-ink-400">{doctor.bio}</p>}

      <Link to={`/doctors/${doctor._id}`} className="btn-primary mt-auto w-full">
        {t("doctors.viewProfile")}
      </Link>
    </div>
  );
}
