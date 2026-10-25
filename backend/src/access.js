export function canReadPaymentFile(payment, user) {
  return Boolean(payment && user && (user.role === "admin" || payment.userId === user.id));
}