import test from "node:test";
import assert from "node:assert/strict";
import { decimalToPaise, deliveryAddressUpdateRequest, checkoutReviewPath, isCompleteOrderSummary, sameOrderSummary, verifyUpdatedOrderSummary, paymentAmountMatchesSummary, acquireSubmissionLock, checkoutErrorMessage } from "./checkoutOrder.js";

const summary = (overrides = {}) => ({
  id: 12, full_name: "Buyer", phone_number: "1234567890", house_name: "House",
  street: "", landmark: "", city: "Kochi", district: "Ernakulam", state: "Kerala", pincode: "682001",
  subtotal: "1499.00", shipping_charge: "50.00", discount: "0.00", gst_total: "74.95", total_amount: "1623.95",
  items: [{ id: 5, quantity: 1, unit_price: "1499.00", taxable_value: "1499.00", gst_rate: "0.0500", cgst_amount: "37.48", sgst_amount: "37.47", igst_amount: "0.00" }],
  ...overrides,
});

test("validates an authoritative order detail response and formats decimal amounts to paise", () => {
  assert.equal(isCompleteOrderSummary(summary()), true);
  assert.equal(isCompleteOrderSummary(summary({ total_amount: undefined })), false);
  assert.equal(decimalToPaise("1623.95"), 162395);
});

test("address update targets the existing order with auth or guest bearer convention", () => {
  assert.deepEqual(deliveryAddressUpdateRequest(42, { address_id: 7 }), {
    url: "/orders/42/delivery-address/", payload: { address_id: 7 }, config: {},
  });
  assert.deepEqual(deliveryAddressUpdateRequest(42, { state: "Tamil Nadu" }, "guest-secret"), {
    url: "/orders/42/delivery-address/", payload: { state: "Tamil Nadu" }, config: { guestBearerToken: "guest-secret" },
  });
});

test("both checkout types transition to their shared review page before payment", () => {
  assert.equal(checkoutReviewPath(false), "/checkout/review");
  assert.equal(checkoutReviewPath(true), "/guest-checkout/review");
});

test("replaced backend GST and payable values are detected after destination state changes", () => {
  const kerala = summary();
  const interState = summary({
    state: "Tamil Nadu", district: "Chennai", pincode: "600001", gst_total: "74.95", total_amount: "1623.95",
    items: [{ ...kerala.items[0], cgst_amount: "0.00", sgst_amount: "0.00", igst_amount: "74.95" }],
  });
  assert.equal(sameOrderSummary(kerala, interState), false);
});

test("stale price and totals are detected and the response amount remains authoritative", () => {
  const previous = summary();
  const repriced = summary({ subtotal: "1600.00", gst_total: "80.00", total_amount: "1730.00", items: [{ ...previous.items[0], unit_price: "1600.00", taxable_value: "1600.00", cgst_amount: "40.00", sgst_amount: "40.00" }] });
  assert.equal(sameOrderSummary(previous, repriced), false);
  assert.equal(decimalToPaise(repriced.total_amount), 173000);
});

test("only a complete repriced response for the same order can replace the current summary", () => {
  const original = summary();
  const repriced = summary({ state: "Tamil Nadu", total_amount: "1623.95" });
  assert.equal(verifyUpdatedOrderSummary(original, repriced), repriced);
  assert.throws(() => verifyUpdatedOrderSummary(original, summary({ id: 13 })), /incomplete or unexpected/);
  assert.throws(() => verifyUpdatedOrderSummary(original, summary({ items: [] })), /incomplete or unexpected/);
  assert.equal(original.state, "Kerala");
});

test("Razorpay paise must match the latest persisted decimal total", () => {
  const current = summary();
  assert.equal(paymentAmountMatchesSummary(162395, current), true);
  assert.equal(paymentAmountMatchesSummary(162394, current), false);
});

test("submission lock blocks repeated address and payment attempts until released", () => {
  const lock = { current: false };
  assert.equal(acquireSubmissionLock(lock), true);
  assert.equal(acquireSubmissionLock(lock), false);
  lock.current = false;
  assert.equal(acquireSubmissionLock(lock), true);
});

test("address errors explain expired or payment-locked orders, invalid input and authorization failures", () => {
  assert.match(checkoutErrorMessage({ response: { status: 400, data: { detail: "This order can no longer be modified." } } }, "address"), /reservation may have expired/);
  assert.equal(checkoutErrorMessage({ response: { status: 400, data: { state: ["Unknown state"] } } }, "address"), "Please check the delivery address and try again.");
  assert.match(checkoutErrorMessage({ response: { status: 404 } }, "address"), /could not be authorized/);
  assert.match(checkoutErrorMessage({ message: "Network Error" }, "address"), /existing order review is unchanged/);
});
