import { useEffect, useRef, useState } from 'react';
import { getTrustTexts } from '../services/trustTextService';
import { getTrustTextIcon } from './trustTextIcons';
import styles from './TrustTextBar.module.css';

function getEntries(response) {
  const entries = Array.isArray(response)
    ? response
    : response?.results
      ?? response?.data?.results
      ?? response?.data
      ?? [];

  if (!Array.isArray(entries)) return [];
  return entries
    .filter((entry) => entry && typeof entry.text === 'string' && entry.text.trim())
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
}

export default function TrustTextBar() {
  const [entries, setEntries] = useState([]);
  const [copies, setCopies] = useState(1);
  const [groupWidth, setGroupWidth] = useState(0);
  const viewportRef = useRef(null);
  const groupRef = useRef(null);

  useEffect(() => {
    let active = true;
    getTrustTexts()
      .then((response) => {
        if (active) setEntries(getEntries(response));
      })
      .catch(() => {
        // The bar is optional storefront content; keep the rest of the page usable.
        if (active) setEntries([]);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!entries.length || !viewportRef.current || !groupRef.current) return undefined;

    const updateCopies = () => {
      const viewportWidth = viewportRef.current?.clientWidth ?? 0;
      const groupWidth = groupRef.current?.getBoundingClientRect().width ?? 0;
      if (groupWidth > 0) {
        // Fill the viewport plus one full group so even a short list loops without a gap.
        setCopies(Math.max(2, Math.ceil(viewportWidth / groupWidth) + 1));
        setGroupWidth(groupWidth);
      }
    };

    updateCopies();
    const observer = new ResizeObserver(updateCopies);
    observer.observe(viewportRef.current);
    observer.observe(groupRef.current);
    return () => observer.disconnect();
  }, [entries]);

  if (!entries.length) return null;

  const scrolling = copies > 1;
  const renderGroup = (copy) => (
    <div
      className={styles.group}
      key={copy}
      ref={copy === 0 ? groupRef : undefined}
      aria-hidden={copy > 0 ? 'true' : undefined}
    >
      {entries.map((entry, index) => {
        const Icon = getTrustTextIcon(entry.icon);
        return (
          <span className={styles.item} key={`${entry.id ?? index}-${copy}`}>
            {Icon && <Icon className={styles.icon} aria-hidden="true" />}
            <span>{entry.text}</span>
          </span>
        );
      })}
    </div>
  );

  return (
    <div className={styles.bar} ref={viewportRef}>
      <div
        className={`${styles.track} ${scrolling ? styles.scrolling : ''}`}
        style={{
          '--marquee-distance': `-${groupWidth}px`,
          '--duration': `${Math.max(18, groupWidth / 35)}s`,
        }}
      >
        {Array.from({ length: copies }, (_, copy) => renderGroup(copy))}
      </div>
    </div>
  );
}
