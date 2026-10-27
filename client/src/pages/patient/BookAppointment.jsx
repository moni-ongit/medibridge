import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../../components/Spinner.jsx";

const DAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function nextDatesForDay(dayCode, count = 4) {
  const dayIndex = DAY_ORDER.indexOf(dayCode);
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 28 && dates.length < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === dayIndex) dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export default function BookAppointment() {
  const { doctorId } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || "en");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get(`/doctors/${doctorId}`).then((res) => setDoctor(res.data.doctor)).finally(() => setLoading(false));
  }, [doctorId]);

  const availableDates = (doctor?.availability || []).flatMap((slot) =>
    nextDatesForDay(slot.day).map((date) => ({ date, day: slot.day, slots: slot.slots }))
  );

  const slotsForSelectedDate = availableDates.find((d) => d.date === selectedDate)?.slots || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post("/appointments", {
        doctor: doctor.user._id,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        reason,
        preferredLanguage,
      });
      setSuccess(true);
      setTimeout(() => navigate("/patient/appointments"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || t("common.somethingWrong"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;
  if (!doctor) return <p className="text-signal-500">Doctor not found.</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink-900">{t("common.bookAppointment")}</h1>
      <p className="mt-1 text-ink-500">with {doctor.user?.name} · {doctor.specialization}</p>

      {success && <p className="mt-4 rounded-lg bg-teal-50 px-4 py-3 text-sm text-teal-700">{t("appointments.bookingSuccess")}</p>}
      {error && <p className="mt-4 rounded-lg bg-signal-500/10 px-4 py-3 text-sm text-signal-600">{error}</p>}

      <form onSubmit={handleSubmit} className="card mt-6 space-y-5">
        <div>
          <label className="label-field">{t("appointments.selectDate")}</label>
          {availableDates.length === 0 ? (
            <p className="text-sm text-ink-400">This doctor hasn't listed availability yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableDates.map((d) => (
                <button
                  type="button"
                  key={d.date}
                  onClick={() => { setSelectedDate(d.date); setSelectedTime(""); }}
                  className={`rounded-xl border-2 px-3 py-2 text-sm transition ${
                    selectedDate === d.date ? "border-teal-600 bg-teal-50 text-teal-700" : "border-ink-100 text-ink-600 hover:border-ink-200"
                  }`}
                >
                  {d.date}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedDate && (
          <div>
            <label className="label-field">{t("appointments.selectTime")}</label>
            <div className="flex flex-wrap gap-2">
              {slotsForSelectedDate.map((slot) => (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={`rounded-xl border-2 px-3 py-2 text-sm transition ${
                    selectedTime === slot ? "border-teal-600 bg-teal-50 text-teal-700" : "border-ink-100 text-ink-600 hover:border-ink-200"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="label-field" htmlFor="reason">{t("appointments.reason")}</label>
          <textarea id="reason" rows={3} className="input-field" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>

        <div>
          <label className="label-field" htmlFor="lang">{t("dashboard.patient.preferredLanguage")}</label>
          <select id="lang" className="input-field" value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>
        </div>

        <button type="submit" disabled={!selectedDate || !selectedTime || submitting} className="btn-primary w-full">
          {submitting ? t("common.loading") : t("appointments.confirmBooking")}
        </button>
      </form>
    </div>
  );
}
