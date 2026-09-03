import type { CSSProperties } from "react";

interface OptimizedImageProps {
  /** Original path relative to public/, e.g. "projects/moe.jpg". */
  src: string;
  alt: string;
  /** Base URL prefix (the site deploys under a subpath). */
  baseUrl: string;
  /** Widths available as derivatives, smallest first. */
  widths?: number[];
  /** `sizes` attribute — how wide the image renders at each breakpoint. */
  sizes?: string;
  className?: string;
  style?: CSSProperties;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
}

/**
 * Renders a <picture> over the derivatives built by scripts/optimize-images.mjs,
 * letting the browser pick AVIF, then WebP, then JPEG, at the smallest width
 * that covers the display size.
 *
 * The originals stay in place as the final fallback, but nothing links to them
 * directly: project screenshots averaged ~3350px wide inside ~400px cards.
 */
export function OptimizedImage({
  src,
  alt,
  baseUrl,
  widths = [400, 800],
  sizes = "(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw",
  className,
  style,
  width,
  height,
  loading = "lazy",
  fetchPriority,
}: OptimizedImageProps) {
  const lastSlash = src.lastIndexOf("/");
  const dir = lastSlash === -1 ? "" : src.slice(0, lastSlash);
  const file = lastSlash === -1 ? src : src.slice(lastSlash + 1);
  const stem = file.replace(/\.[^.]+$/, "");
  const base = `${baseUrl}optimized/${dir ? `${dir}/` : ""}${stem}`;

  const srcSet = (ext: string) =>
    widths.map((w) => `${base}-${w}.${ext} ${w}w`).join(", ");

  return (
    <picture>
      <source type="image/avif" srcSet={srcSet("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet("webp")} sizes={sizes} />
      <img
        src={`${base}-${widths[0]}.jpg`}
        srcSet={srcSet("jpg")}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        className={className}
        style={style}
      />
    </picture>
  );
}
