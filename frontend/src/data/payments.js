import { createRemoteCollection } from "../lib/collections";

export const PAYMENT_STATUSES = ["pending", "approved", "rejected"];

export const payments = [
  {
    id: 1,
    memberName: "Sample member",
    competitionSlug: "spring-open",
    competitionName: "Spring Open",
    fileName: "proof.pdf",
    fileUrl: "/src/assets/images/Logo/wrja-logo.png",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

export const paymentsStore = createRemoteCollection("/api/payments");
paymentsStore.setItems(payments);
export const myPaymentsStore = createRemoteCollection("/api/payments/mine");
myPaymentsStore.setItems(payments);

export function pendingPayments(items = []) {
  return items.filter((item) => item.status === "pending");
}

export function paymentFileUrl(file) {
  return file || "/src/assets/images/Logo/wrja-logo.png";
}

export async function submitPayment(payload) {
  const next = [...paymentsStore.getSnapshot().items, { id: Date.now(), status: "pending", createdAt: new Date().toISOString(), ...payload }];
  paymentsStore.setItems(next);
  myPaymentsStore.setItems(next);
  return { ok: true, item: next[next.length - 1] };
}

export function deletePayment(paymentId) {
  const next = paymentsStore.getSnapshot().items.filter((item) => item.id !== paymentId);
  paymentsStore.setItems(next);
  myPaymentsStore.setItems(next);
  return Promise.resolve({ ok: true });
}

export function setPaymentStatus(paymentId, status) {
  const next = paymentsStore.getSnapshot().items.map((item) => (item.id === paymentId ? { ...item, status } : item));
  paymentsStore.setItems(next);
  myPaymentsStore.setItems(next);
  return Promise.resolve(next.find((item) => item.id === paymentId));
}

export default payments;
