export function getVideoUrl(item) {
  return item.video_url || item.video || "";
}

export const previewPlaybackProps = {
  autoPlay: true,
  muted: true,
  loop: true,
  playsInline: true,
  preload: "metadata",
};
