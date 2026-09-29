export default function FormStatus({ status }) {
  if (!status) return null;
  return <p className={`form-status form-status-${status.type}`} role={status.type === "error" ? "alert" : "status"}>{status.text}</p>;
}
