import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import Spinner from "../components/Spinner.jsx";

const LANG_NAMES = { en: "English", ta: "Tamil", hi: "Hindi" };
const DAY_NAMES = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };

export default function DoctorDetails() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get(`/doctors/${id}`)
      .then((res) => setDoctor(res.data.doctor))
      .catch(() => setError(t("common.somethingWrong")))
      .finally(() => setLoading(false));
  }, [id, t]);

  const handleBook = () => {
    if (!user) return navigate("/login", { state: { from: `/doctors/${id}` } });
    if (user.role !== "patient") return;
    navigate(`/patient/book/${doctor.user._id}`);
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size={32} /></div>;
  if (error || !doctor) return <p className="py-24 text-center text-signal-500">{error || "Doctor not found"}</p>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="card flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-teal-50 text-3xl font-semibold text-teal-700">
          {doctor.user?.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-semibold text-ink-900">{doctor.user?.name}</h1>
          <p className="mt-1 text-teal-700">{doctor.specialization}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-500">
            <span className="badge bg-mist-100">{doctor.experience || 0}+ {t("doctors.yearsExperience")}</span>
            <span className="badge bg-amber-50 text-amber-600">₹{doctor.consultationFee} {t("doctors.consultationFee")}</span>
            <span className="badge bg-mist-100">⭐ {doctor.rating || 4.8}</span>
          </div>
        </div>
        <button onClick={handleBook} className="btn-primary shrink-0">{t("common.bookAppointment")}</button>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="card md:col-span-2">
          <h3 className="font-display text-lg font-semibold text-ink-900">About</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">{doctor.bio || "No bio provided yet."}</p>
          <h3 className="mt-6 font-display text-lg font-semibold text-ink-900">Qualifications</h3>
          <p className="mt-2 text-sm text-ink-600">{doctor.qualifications || "—"}</p>
        </div>

        <div className="card">
          <h3 className="font-display text-lg font-semibold text-ink-900">{t("doctors.speaks")}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {(doctor.languages || []).map((l) => (
              <span key={l} className="badge bg-teal-50 text-teal-700">{LANG_NAMES[l] || l}</span>
            ))}
          </div>

          <h3 className="mt-6 font-display text-lg font-semibold text-ink-900">{t("dashboard.doctor.availability")}</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-600">
            {(doctor.availability || []).length === 0 && <li className="text-ink-400">Not specified</li>}
            {(doctor.availability || []).map((slot) => (
              <li key={slot.day} className="flex justify-between">
                <span>{DAY_NAMES[slot.day] || slot.day}</span>
                <span className="text-ink-400">{slot.slots?.length || 0} slots</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
