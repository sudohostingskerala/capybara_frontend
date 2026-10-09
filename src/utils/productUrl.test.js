import test from "node:test";
import assert from "node:assert/strict";
import { getProductUrl } from "./productUrl.js";

test("video ad product links use the canonical product detail route", () => {
  const apiProduct = { slug: "pattu-pavada" };

  assert.equal(getProductUrl(apiProduct), "/product/pattu-pavada");
});

test("video ad product links retain the product slug", () => {
  const apiProduct = { slug: "handwoven-silk-saree" };

  assert.equal(getProductUrl(apiProduct), "/product/handwoven-silk-saree");
});
