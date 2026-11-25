export const decimalToPaise = (value) => {
  const [whole = "0", fraction = ""] = String(value ?? "0").split(".");
  return Number(whole) * 100 + Number((fraction + "00").slice(0, 2));
};

export const deliveryAddressUpdateRequest = (orderId, address, guestToken) => ({
  url: `/orders/${orderId}/delivery-address/`,
  payload: address,
  config: guestToken ? { guestBearerToken: guestToken } : {},
});

export const isCompleteOrderSummary = (order) => Boolean(
  order && order.id && order.state && order.pincode && order.items?.length &&
  ["subtotal", "shipping_charge", "discount", "gst_total", "total_amount"].every((field) => order[field] !== undefined && order[field] !== null)
);

export const verifyUpdatedOrderSummary = (existing, updated) => {
  if (!isCompleteOrderSummary(updated) || String(updated.id) !== String(existing.id)) {
    throw new Error("The server returned an incomplete or unexpected order summary.");
  }
  return updated;
};

export const paymentAmountMatchesSummary = (amount, order) =>
  Number(amount) === decimalToPaise(order?.total_amount);

export const acquireSubmissionLock = (lock) => {
  if (lock.current) return false;
  lock.current = true;
  return true;
};

export const checkoutErrorMessage = (error, action) => {
  const status = error.response?.status;
  const detail = error.response?.data?.detail;
  if (!error.response) return action === "address" ? "Could not reach the server. Your existing order review is unchanged; please try again." : "Could not reach the payment service. Please try again.";
  if (status === 401 || status === 403 || status === 404) return action === "address"
    ? "This order could not be authorized. Please return to checkout and sign in again or reopen your guest order."
    : "We could not authorize this order. Please sign in again and retry.";
  if (status === 400 && /no longer be modified|expired|reservation|razorpay|payment/i.test(detail || "")) return "This order can no longer be changed. Its payment may have started or its reservation may have expired. Please contact support before continuing.";
  if (status === 400 || status === 422) return typeof detail === "string" ? detail : "Please check the delivery address and try again.";
  return (typeof detail === "string" && detail) || (action === "address" ? "We couldn't reprice this order. Your existing review is unchanged." : "Unable to start payment.");
};

export const sameOrderSummary = (left, right) =>
  ["subtotal", "shipping_charge", "discount", "gst_total", "total_amount"].every((field) => decimalToPaise(left[field]) === decimalToPaise(right[field])) &&
  ["full_name", "house_name", "street", "landmark", "city", "district", "state", "pincode", "phone_number"].every((field) => left[field] === right[field]) &&
  JSON.stringify(left.items?.map((item) => [item.id, item.quantity, item.unit_price, item.taxable_value, item.gst_rate, item.cgst_amount, item.sgst_amount, item.igst_amount])) ===
  JSON.stringify(right.items?.map((item) => [item.id, item.quantity, item.unit_price, item.taxable_value, item.gst_rate, item.cgst_amount, item.sgst_amount, item.igst_amount]));
