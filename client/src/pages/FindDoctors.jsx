import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api.js";
import DoctorCard from "../components/DoctorCard.jsx";
import Spinner from "../components/Spinner.jsx";

export default function FindDoctors() {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get("/doctors")
      .then((res) => setDoctors(res.data.doctors))
      .catch(() => setError(t("common.somethingWrong")))
      .finally(() => setLoading(false));
  }, [t]);

  const specializations = useMemo(
    () => [...new Set(doctors.map((d) => d.specialization).filter(Boolean))],
    [doctors]
  );

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      const matchesSearch =
        !search ||
        d.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.specialization?.toLowerCase().includes(search.toLowerCase());
      const matchesSpec = !specialization || d.specialization === specialization;
      return matchesSearch && matchesSpec;
    });
  }, [doctors, search, specialization]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <span className="badge bg-teal-50 text-teal-700">{t("nav.findDoctors")}</span>
      <h1 className="mt-4 font-display text-4xl font-semibold text-ink-900">{t("doctors.title")}</h1>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("doctors.searchPlaceholder")}
          className="input-field sm:max-w-sm"
        />
        <select
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          className="input-field sm:max-w-xs"
        >
          <option value="">{t("doctors.allSpecializations")}</option>
          {specializations.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="mt-16 flex justify-center"><Spinner size={32} /></div>
      )}
      {error && <p className="mt-8 text-signal-500">{error}</p>}

      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <p className="mt-16 text-center text-ink-400">{t("doctors.noResults")}</p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((doc) => (
                <DoctorCard key={doc._id} doctor={doc} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
