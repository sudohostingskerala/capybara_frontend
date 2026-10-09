import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getVideoUrl, previewPlaybackProps } from "./videoAd.js";

test("video ad uses the API-provided CDN video URL", () => {
  const apiAd = {
    video: "/media/video_ads/example.mp4",
    video_url: "https://cdn.example.com/video_ads/example.mp4",
  };

  assert.equal(getVideoUrl(apiAd), apiAd.video_url);
});

test("video ad retains the legacy video field as a fallback", () => {
  assert.equal(getVideoUrl({ video: "/media/example.mp4" }), "/media/example.mp4");
  assert.equal(getVideoUrl({}), "");
});

test("video previews use muted inline autoplay settings", () => {
  assert.deepEqual(previewPlaybackProps, {
    autoPlay: true,
    muted: true,
    loop: true,
    playsInline: true,
    preload: "metadata",
  });
});

test("product detail page renders the existing video ad carousel", async () => {
  const productDetail = await readFile(
    new URL("../pages/ProductDetail.jsx", import.meta.url),
    "utf8",
  );

  assert.match(productDetail, /import VideoCarousel from ["']\.\.\/components\/VideoCarousel["']/);
  assert.match(productDetail, /<VideoCarousel\s/);
});
