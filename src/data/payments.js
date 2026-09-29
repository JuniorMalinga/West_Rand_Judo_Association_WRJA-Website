// Proof-of-payment uploads. Files are stored privately on the server: only the
// member who uploaded one and the admins can open it.

import { api, apiUrl, notifyAdminChanged } from "../lib/api";
import { createRemoteCollection } from "../lib/collections";
import { processImageFile, readAsDataUrl } from "../lib/images";

export const paymentsStore = createRemoteCollection("/api/admin/payments");
export const myPaymentsStore = createRemoteCollection("/api/payments/mine");

export const PAYMENT_STATUSES = ["Submitted for review", "Approved", "Rejected"];
export const pendingPayments = (list) => list.filter((item) => item.status === "Submitted for review").length;
export const paymentFileUrl = (id) => apiUrl(`/api/payments/${id}/file`);

const MAX_PDF_BYTES = 4 * 1024 * 1024;

async function prepareFile(file) {
  if (!file) throw new Error("Please choose your EFT payment confirmation first.");

  if (file.type === "application/pdf") {
    if (file.size > MAX_PDF_BYTES) throw new Error("That PDF is over 4 MB. Please upload a smaller PDF or a JPG/PNG screenshot.");
    return readAsDataUrl(file);
  }
  if (file.type === "image/jpeg" || file.type === "image/png") {
    return processImageFile(file, { maxSize: 1600, type: "image/jpeg", quality: 0.8 });
  }
  throw new Error("Please upload a PDF, JPG or PNG file.");
}

export async function submitPayment({ file, competition }) {
  const dataUrl = await prepareFile(file);
  const result = await api("/api/payments", {
    method: "POST",
    body: { dataUrl, fileName: file.name, competitionSlug: competition?.slug || "" },
  });
  myPaymentsStore.refresh();
  return result.item;
}

const changed = async (result) => {
  await paymentsStore.refresh();
  notifyAdminChanged();
  return result;
};

export const setPaymentStatus = (id, status) => api(`/api/admin/payments/${id}`, { method: "PATCH", body: { status } }).then(changed);
export const deletePayment = (id) => api(`/api/admin/payments/${id}`, { method: "DELETE" }).then(changed);
