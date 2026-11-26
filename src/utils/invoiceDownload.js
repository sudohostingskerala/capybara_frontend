export const canDownloadInvoice = (order) => (
  order?.payment_status === 'PAID'
  && order?.status !== 'CANCELLED'
  && order?.invoice_pdf_status === 'READY'
);

export const invoiceRequestConfig = (guestToken) => (
  guestToken ? { guestBearerToken: guestToken } : {}
);

export const invoiceDownloadMessage = (status) => {
  if (status === 202) return 'Your invoice is being prepared. Please check back shortly.';
  if (status === 404) return 'The invoice is not available. Please try again later or contact support.';
  if (status === 503) return 'The invoice PDF is temporarily unavailable. Please try again later or contact support.';
  if (status === 401 || status === 403) return 'We could not verify access to this invoice. Sign in or use your guest order link.';
  return 'We could not download the invoice. Please try again later.';
};
