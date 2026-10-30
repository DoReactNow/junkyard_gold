"use client";

import { useState } from "react";
import { Stage } from "./stage";

/** Main photo with thumbnails that switch it. */
export function ProductGallery({ files, alt, label }: { files: string[]; alt: string; label?: string }) {
  const [shown, setShown] = useState(0);
  return (
    <div>
      <Stage src={files[shown]} alt={alt} gold eager className="aspect-[4/3] rounded-[24px] shadow-lift" imgClassName="p-8" label={label} />
      {files.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {files.slice(0, 4).map((f, i) => (
            <button
              key={f}
              type="button"
              onClick={() => setShown(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-pressed={i === shown}
              className={`overflow-hidden rounded-2xl outline-none ring-offset-2 ring-offset-paper transition focus-visible:ring-2 focus-visible:ring-gold ${i === shown ? "ring-2 ring-gold" : "opacity-75 hover:opacity-100"}`}
            >
              <Stage src={f} eager className="aspect-square" imgClassName="p-2" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
