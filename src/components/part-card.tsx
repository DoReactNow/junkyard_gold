import Link from "next/link";
import type { Part } from "@prisma/client";
import { money, partUrl } from "@/lib/inventory";

export function partImage(p: Pick<Part, "imageUrl" | "partType">) {
  if (p.imageUrl) return p.imageUrl;
  if (p.partType === "Engine") return "/img/engine.svg";
  if (p.partType === "Transmission") return "/img/transmission.svg";
  return "/img/part.svg";
}

export function PartCard({ part }: { part: Part }) {
  return (
    <Link
      href={partUrl(part)}
      className="group flex flex-col overflow-hidden rounded-lg border border-line bg-white transition hover:-translate-y-0.5 hover:border-gold hover:shadow-lg"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={partImage(part)} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-gold-dark">{part.partType}</span>
        <h3 className="mt-1 font-semibold leading-snug">
          {part.year} {part.make} {part.model}
        </h3>
        {part.spec && <p className="mt-0.5 text-sm text-steel">{part.spec}</p>}
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <div className="font-display text-2xl font-semibold">{money(part.price)}</div>
            <div className="text-xs text-steel">
              {part.mileage ? `${part.mileage.toLocaleString()} mi · ` : ""}
              {part.warranty} warranty
            </div>
          </div>
          <span className="text-sm font-semibold text-ink group-hover:text-gold-dark">View →</span>
        </div>
      </div>
    </Link>
  );
}
