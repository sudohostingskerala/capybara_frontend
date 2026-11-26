import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canDownloadInvoice,
  invoiceDownloadMessage,
  invoiceRequestConfig,
} from './invoiceDownload.js';

test('invoice download is offered only for paid, non-cancelled orders with a ready PDF', () => {
  assert.equal(canDownloadInvoice({
    payment_status: 'PAID', status: 'SHIPPED', invoice_pdf_status: 'READY',
  }), true);
  assert.equal(canDownloadInvoice({
    payment_status: 'PENDING', status: 'SHIPPED', invoice_pdf_status: 'READY',
  }), false);
  assert.equal(canDownloadInvoice({
    payment_status: 'PAID', status: 'CANCELLED', invoice_pdf_status: 'READY',
  }), false);
  assert.equal(canDownloadInvoice({
    payment_status: 'PAID', status: 'CONFIRMED', invoice_pdf_status: 'GENERATING',
  }), false);
});

test('authenticated and guest invoice requests use the appropriate auth config', () => {
  assert.deepEqual(invoiceRequestConfig(), {});
  assert.deepEqual(invoiceRequestConfig('guest-bearer-token'), {
    guestBearerToken: 'guest-bearer-token',
  });
});

test('invoice download errors have status-specific customer messages', () => {
  assert.match(invoiceDownloadMessage(202), /being prepared/);
  assert.match(invoiceDownloadMessage(404), /not available/);
  assert.match(invoiceDownloadMessage(503), /temporarily unavailable/);
  assert.match(invoiceDownloadMessage(401), /could not verify access/);
  assert.match(invoiceDownloadMessage(403), /could not verify access/);
});
