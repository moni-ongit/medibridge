const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-600",
  confirmed: "bg-teal-50 text-teal-700",
  completed: "bg-mist-100 text-ink-600",
  cancelled: "bg-signal-500/10 text-signal-600",
  waiting: "bg-amber-50 text-amber-600",
  accepted: "bg-teal-50 text-teal-700",
  declined: "bg-signal-500/10 text-signal-600",
};

export default function StatusBadge({ status, label }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] || "bg-mist-100 text-ink-600"} capitalize`}>
      {label || status}
    </span>
  );
}
