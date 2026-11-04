export function AdminActionSpinner() {
  return <span className="admin-action-spinner" aria-hidden="true" />;
}

export default function AdminLoadingButton({
  children,
  loading = false,
  loadingText,
  disabled = false,
  className,
  type = "button",
  ...props
}) {
  return (
    <button
      {...props}
      type={type}
      className={className}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <AdminActionSpinner />}
      <span>{loading ? loadingText || children : children}</span>
    </button>
  );
}
