import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api.js";
import Spinner from "../../components/Spinner.jsx";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00", "15:30", "16:00"];

export default function Availability() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [availability, setAvailability] = useState({}); // { Mon: Set(['09:00', ...]) }
  const [isAccepting, setIsAccepting] = useState(true);

  useEffect(() => {
    api.get("/doctors/me/profile").then((res) => {
      const p = res.data.doctor;
      setProfile(p);
      setIsAccepting(p?.isAcceptingPatients ?? true);
      const map = {};
      (p?.availability || []).forEach((slot) => {
        map[slot.day] = new Set(slot.slots || []);
      });
      setAvailability(map);
    }).finally(() => setLoading(false));
  }, []);

  const toggleSlot = (day, slot) => {
    setAvailability((prev) => {
      const daySet = new Set(prev[day] || []);
      daySet.has(slot) ? daySet.delete(slot) : daySet.add(slot);
      return { ...prev, [day]: daySet };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const availabilityPayload = Object.entries(availability)
        .filter(([, set]) => set.size > 0)
        .map(([day, set]) => ({ day, slots: Array.from(set).sort() }));

      const res = await api.post("/doctors/profile", { availability: availabilityPayload, isAcceptingPatients: isAccepting });
      setProfile(res.data.doctor);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink-900">{t("dashboard.doctor.availability")}</h1>
        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input type="checkbox" checked={isAccepting} onChange={(e) => setIsAccepting(e.target.checked)} className="h-4 w-4 rounded accent-teal-600" />
          Accepting new patients
        </label>
      </div>

      {saved && <p className="mt-4 rounded-lg bg-teal-50 px-4 py-2 text-sm text-teal-700">{t("common.saved")}</p>}

      <div className="mt-6 space-y-4">
        {DAYS.map((day) => (
          <div key={day} className="card">
            <p className="font-display text-base font-semibold text-ink-900">{day}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEFAULT_SLOTS.map((slot) => {
                const active = availability[day]?.has(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleSlot(day, slot)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      active ? "border-teal-600 bg-teal-600 text-white" : "border-ink-100 text-ink-500 hover:border-ink-200"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary mt-6">
        {saving ? t("common.loading") : t("common.save")}
      </button>
    </div>
  );
}
