/** A cut-out product photo on a dark, lit backdrop. */
export function Stage({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  gold = false,
  label,
  eager = false,
}: {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  gold?: boolean;
  label?: string;
  eager?: boolean;
}) {
  return (
    <div className={`stage ${gold ? "stage-gold" : ""} overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} className={`relative z-10 mx-auto h-full w-full object-contain ${imgClassName}`} />
      {label && (
        <span className="absolute left-3 top-3 z-20 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] font-medium tracking-wide text-white/75 backdrop-blur">
          {label}
        </span>
      )}
    </div>
  );
}
