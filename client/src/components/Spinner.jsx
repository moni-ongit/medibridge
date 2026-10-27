export default function Spinner({ size = 24, className = "" }) {
  return (
    <div
      className={`inline-block animate-spin rounded-full border-2 border-teal-200 border-t-teal-600 ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner size={36} />
    </div>
  );
}
