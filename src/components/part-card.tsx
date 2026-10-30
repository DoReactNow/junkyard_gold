import Link from "next/link";
import type { Part } from "@prisma/client";
import { money, partUrl, warrantyAdj } from "@/lib/inventory";
import { cutout, pickPhotos } from "@/lib/photos";
import { Stage } from "./stage";

type ImgPart = Pick<Part, "imageUrl" | "partType" | "make" | "model" | "spec">;

/** Photos for a listing: its own photo, else example photos of a similar unit, else an illustration. */
export function partImages(p: ImgPart): { files: string[]; kind: "own" | "example" | "illustration" } {
  if (p.imageUrl) return { files: [p.imageUrl], kind: "own" };
  const match = pickPhotos(p);
  if (match.files.length) return { files: match.files.map(cutout), kind: "example" };
  if (p.partType === "Engine") return { files: ["/img/engine.svg"], kind: "illustration" };
  if (p.partType === "Transmission") return { files: ["/img/transmission.svg"], kind: "illustration" };
  return { files: ["/img/part.svg"], kind: "illustration" };
}

export const partImage = (p: ImgPart) => partImages(p).files[0];

export function PartCard({ part }: { part: Part }) {
  const img = partImages(part);
  return (
    <Link
      href={partUrl(part)}
      className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-white shadow-card transition duration-500 hover:-translate-y-1.5 hover:shadow-lift"
    >
      <Stage
        src={img.files[0]}
        className="aspect-[5/4]"
        imgClassName="p-6 transition duration-700 group-hover:scale-[1.06]"
        label={part.partType}
      />
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[16.5px] font-semibold leading-snug tracking-tight">
          {part.year} {part.make} {part.model}
        </h3>
        {part.spec && <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug text-steel">{part.spec}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <div className="font-serif text-[30px] leading-none">{money(part.price)}</div>
            <div className="mt-1.5 text-[12.5px] text-steel">
              {part.mileage ? `${part.mileage.toLocaleString()} mi · ` : ""}
              {warrantyAdj(part.warranty)} warranty
            </div>
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-ink transition duration-300 group-hover:border-gold group-hover:bg-gold-grad" aria-hidden>
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
