// Responsive photo from the image registry. Keeps aspect ratio by default; when `fill` is set it covers
// its parent (object-fit: cover) using the image's own focal point so important parts are not cropped away.
import { IMAGES } from '../assets/images';
import { useStore } from '../store';

export default function Photo({ name, fill = false, className = '', sizes = '(min-width: 1024px) 50vw, 100vw', priority = false, focus, decorative = false }) {
  const { L } = useStore();
  const img = IMAGES[name];
  if (!img) return null;
  return (
    <img
      src={img.src}
      srcSet={img.srcSet}
      sizes={sizes}
      width={img.width}
      height={img.height}
      alt={decorative ? '' : L(img.alt)}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      style={{ objectPosition: focus ?? img.focus }}
      className={`${fill ? 'absolute inset-0 h-full w-full object-cover' : 'h-auto w-full'} ${className}`}
    />
  );
}
