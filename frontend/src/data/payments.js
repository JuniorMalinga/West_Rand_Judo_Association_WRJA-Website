import { createRemoteCollection } from "../lib/collections";
import { api, apiUrl, notifyAdminChanged } from "../lib/api";
import { readAsDataUrl } from "../lib/images";

const ADMIN_PAYMENTS_PATH = "/api/admin/payments";

export const PAYMENT_STATUSES = ["Submitted for review", "Approved", "Rejected"];

export const paymentsStore = createRemoteCollection(ADMIN_PAYMENTS_PATH);
export const myPaymentsStore = createRemoteCollection("/api/payments/mine");

async function finishPaymentChange(request) {
  const result = await request;
  await paymentsStore.refresh();
  notifyAdminChanged(paymentsStore.path);
  return result;
}

export function pendingPayments(items = []) {
  return items.filter((item) => item.status === "Submitted for review");
}

export function paymentFileUrl(paymentId) {
  return apiUrl(`/api/payments/${encodeURIComponent(paymentId)}/file`);
}

export async function submitPayment({ file, competition }) {
  if (!file) throw new Error("Choose a proof of payment file first.");
  const dataUrl = await readAsDataUrl(file);
  const result = await api("/api/payments", {
    method: "POST",
    body: {
      fileName: file.name,
      dataUrl,
      competitionSlug: competition?.slug || "",
    },
  });
  await myPaymentsStore.refresh();
  notifyAdminChanged(paymentsStore.path);
  return result.item;
}

export function deletePayment(paymentId) {
  return finishPaymentChange(api(`${ADMIN_PAYMENTS_PATH}/${encodeURIComponent(paymentId)}`, { method: "DELETE" }));
}

export async function setPaymentStatus(paymentId, status) {
  const { item } = await finishPaymentChange(api(`${ADMIN_PAYMENTS_PATH}/${encodeURIComponent(paymentId)}`, {
    method: "PATCH",
    body: { status },
  }));
  return item;
}
