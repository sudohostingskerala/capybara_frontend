
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { getVideoAds } from "../services/videoAdService";
import styles from "./VideoCarousel.module.css";

function getVideoUrl(item) {
  return item.video_url || item.video || "";
}

function getProductUrl(product) {
  // Change this if your existing product route is different.
  return `/products/${product.slug}`;
}

function formatPrice(value) {
  if (value == null || value === "") return null;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function ProductCard({ product, compact = false }) {
  if (!product) return null;

  const price = formatPrice(
    product.selling_price ?? product.price
  );

  return (
    <Link
      to={getProductUrl(product)}
      className={`${styles.productCard} ${
        compact ? styles.productCardCompact : ""
      }`}
      onClick={(event) => event.stopPropagation()}
    >
      {product.image ? (
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className={styles.productImage}
        />
      ) : (
        <div className={styles.imagePlaceholder}>
          No image
        </div>
      )}

      <div className={styles.productInfo}>
        <p className={styles.productName}>{product.name}</p>

        {price && (
          <p className={styles.productPrice}>{price}</p>
        )}
      </div>

      <span className={styles.productArrow} aria-hidden="true">
        →
      </span>
    </Link>
  );
}

function VideoCard({ item, onOpen, registerVideo }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
      video.pause();
    };
  }, []);

  return (
    <article className={styles.videoCard}>
      <button
        type="button"
        className={styles.videoPreviewButton}
        onClick={() => onOpen(item)}
        aria-label={`Watch ${
          item.title || item.product_details?.name || "video"
        }`}
      >
        <video
          ref={(node) => registerVideo(item.id, node)}
          src={getVideoUrl(item)}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className={styles.previewVideo}
        />

        <span className={styles.watchLabel}>▶ Watch</span>
        <span className={styles.expandLabel}>⛶</span>
      </button>

      <ProductCard
        product={item.product_details}
        compact
      />
    </article>
  );
}

export default function VideoCarousel({
  heading = "Shop the look",
  subtitle = "Discover our collection in motion",
}) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);

  const fullscreenVideoRef = useRef(null);
  const previewRefs = useRef(new Map());

  const activeItem =
    activeIndex >= 0 ? videos[activeIndex] : null;

  const registerVideo = useCallback((id, node) => {
    if (node) {
      previewRefs.current.set(id, node);
    } else {
      previewRefs.current.delete(id);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadVideos() {
      try {
        setLoading(true);
        setError("");

        const data = await getVideoAds();
        const items = Array.isArray(data)
          ? data
          : data.results || [];

        if (!isMounted) return;

        setVideos(
          items.filter(
            (item) =>
              (item.video_url || item.video) &&
              item.product_details
          )
        );
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              err.message ||
              "Unable to load videos right now."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadVideos();

    return () => {
      isMounted = false;
    };
  }, []);

  const closeViewer = useCallback(() => {
    setActiveIndex(-1);
    setMuted(true);
    setPlaying(true);
  }, []);

  const openViewer = useCallback(
    (item) => {
      const index = videos.findIndex(
        (video) => video.id === item.id
      );

      if (index < 0) return;

      previewRefs.current.forEach((video) => video?.pause());

      setActiveIndex(index);
      setMuted(true);
      setPlaying(true);
    },
    [videos]
  );

  const changeVideo = useCallback(
    (direction) => {
      if (!videos.length) return;

      setActiveIndex((current) =>
        (current + direction + videos.length) % videos.length
      );

      setMuted(true);
      setPlaying(true);
    },
    [videos.length]
  );

  useEffect(() => {
    if (!activeItem) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowRight") changeVideo(1);
      if (event.key === "ArrowLeft") changeVideo(-1);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeItem, closeViewer, changeVideo]);

  useEffect(() => {
    const video = fullscreenVideoRef.current;
    if (!activeItem || !video) return;

    video.muted = muted;

    if (playing) {
      video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  }, [activeItem, muted, playing]);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <header className={styles.sectionHeader}>
          <div>
            <h2 className={styles.heading}>{heading}</h2>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
        </header>

        {loading && (
          <p className={styles.message}>Loading videos...</p>
        )}

        {error && !loading && (
          <p className={styles.errorMessage} role="alert">
            {error}
          </p>
        )}

        {!loading && !error && videos.length === 0 && (
          <p className={styles.message}>
            No videos available right now.
          </p>
        )}

        {!loading && videos.length > 0 && (
          <div className={styles.carousel}>
            {videos.map((item) => (
              <VideoCard
                key={item.id}
                item={item}
                onOpen={openViewer}
                registerVideo={registerVideo}
              />
            ))}
          </div>
        )}
      </div>

      {activeItem && (
        <div
          className={styles.viewerOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Video viewer"
          onClick={closeViewer}
        >
          <button
            type="button"
            className={styles.closeButton}
            onClick={closeViewer}
            aria-label="Close viewer"
          >
            ×
          </button>

          <button
            type="button"
            className={`${styles.navButton} ${styles.previousButton}`}
            onClick={(event) => {
              event.stopPropagation();
              changeVideo(-1);
            }}
            aria-label="Previous video"
          >
            ‹
          </button>

          <div
            className={styles.viewer}
            onClick={(event) => event.stopPropagation()}
          >
            <video
              key={activeItem.id}
              ref={fullscreenVideoRef}
              src={getVideoUrl(activeItem)}
              autoPlay
              muted={muted}
              loop
              playsInline
              className={styles.fullscreenVideo}
              onClick={() => setPlaying((value) => !value)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />

            <div className={styles.viewerHeader}>
              <span className={styles.viewerTitle}>
                {activeItem.title ||
                  activeItem.product_details.name}
              </span>

              <span className={styles.videoCount}>
                {activeIndex + 1} / {videos.length}
              </span>
            </div>

            <div className={styles.viewerBottom}>
              <div className={styles.videoControls}>
                <button
                  type="button"
                  onClick={() => setPlaying((value) => !value)}
                >
                  {playing ? "Pause" : "Play"}
                </button>

                <button
                  type="button"
                  onClick={() => setMuted((value) => !value)}
                >
                  {muted ? "Unmute" : "Mute"}
                </button>
              </div>

              <div className={styles.viewerProduct}>
                <ProductCard
                  product={activeItem.product_details}
                />
              </div>

              <div className={styles.mobileNavigation}>
                <button onClick={() => changeVideo(-1)}>
                  ← Previous
                </button>
                <button onClick={() => changeVideo(1)}>
                  Next →
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`${styles.navButton} ${styles.nextButton}`}
            onClick={(event) => {
              event.stopPropagation();
              changeVideo(1);
            }}
            aria-label="Next video"
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}
