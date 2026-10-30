"use client";

import { VehicleFields } from "./vehicle-fields";

/** Sidebar version of the vehicle search (search results, catalog pages). */
export function PartFinder({
  stacked = false,
  defaultType,
  initial,
}: {
  stacked?: boolean;
  defaultType?: string;
  initial?: { year?: string; make?: string; model?: string };
}) {
  return <VehicleFields layout={stacked ? "stacked" : "row"} defaultType={defaultType} initial={initial} />;
}
