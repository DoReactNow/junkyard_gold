import type { ReactNode } from "react";
import { BUSINESS } from "./business";

export type Guide = { slug: string; title: string; description: string; minutes: number; eyebrow: string; body: ReactNode };

const Tip = ({ children }: { children: ReactNode }) => (
  <div className="my-6 rounded-2xl border border-gold/40 bg-gold-light/15 px-5 py-4 text-[15px] text-ink/80">{children}</div>
);

export const GUIDES: Guide[] = [
  {
    slug: "used-engine-installation-checklist",
    eyebrow: "Installation",
    title: "Used engine pre-installation checklist",
    description: "What your mechanic should check and replace before a used engine goes in, so it runs right and the warranty stays valid.",
    minutes: 6,
    body: (
      <>
        <p>
          A used engine is only as good as its installation. Most failures in the first few weeks come from parts that were
          reused from the old engine, not from the replacement itself. Go through this list with your mechanic before you
          start the new engine.
        </p>
        <h2>Before it goes in</h2>
        <ul>
          <li><b>Confirm the match.</b> Compare the engine code, displacement and options with your VIN and the old engine.</li>
          <li><b>Inspect it on arrival.</b> Check the shipment for damage and note anything on the delivery receipt before you sign.</li>
          <li><b>Transfer what&apos;s needed.</b> Move over sensors, brackets and accessories that differ, and replace gaskets you disturb.</li>
          <li><b>Timing components.</b> On engines with a timing belt, replace the belt, tensioner and idler. It&apos;s cheap insurance.</li>
        </ul>
        <h2>Cooling system</h2>
        <ul>
          <li>Flush the radiator and heater core, or replace the radiator if the old engine overheated.</li>
          <li>Install a new thermostat and consider a new water pump and hoses.</li>
          <li>Fill with the coolant type your manufacturer specifies and bleed the air out.</li>
        </ul>
        <Tip>
          <b>Overheating is the number-one way to ruin a good engine.</b> If the old engine failed from overheating, find and fix the
          cause before the replacement goes in.
        </Tip>
        <h2>Oil and first start</h2>
        <ul>
          <li>Install a new oil filter and fill with fresh oil of the correct grade.</li>
          <li>Prime the oil system before the first start where the engine allows it.</li>
          <li>Check for leaks, warning lights and unusual noises, then recheck all fluid levels after the first drive.</li>
        </ul>
        <h2>Keep the paperwork</h2>
        <p>
          Keep receipts for the installation, fluids and parts you replaced. Our {BUSINESS.warrantyAdj} warranty asks for proof of
          a proper installation if you ever need to make a claim.
        </p>
      </>
    ),
  },
  {
    slug: "used-transmission-installation-checklist",
    eyebrow: "Installation",
    title: "Used transmission pre-installation checklist",
    description: "Cooler lines, fluid, torque converter and programming: the steps that decide whether a used transmission lasts.",
    minutes: 5,
    body: (
      <>
        <p>
          Transmissions are sensitive to contamination and fluid. Debris left in the cooler lines from the old unit is the most
          common reason a replacement fails early. These are the steps that matter.
        </p>
        <h2>Before installation</h2>
        <ul>
          <li><b>Confirm the match.</b> Check the transmission model, drive type (2WD, 4WD, AWD) and engine pairing against your VIN.</li>
          <li><b>Flush the cooler and lines.</b> Or replace them. Never reuse a contaminated cooler.</li>
          <li><b>Seat the torque converter fully.</b> A converter that isn&apos;t fully engaged can destroy the pump on startup.</li>
          <li>Inspect the mounts, crossmember and wiring connectors, and replace damaged parts.</li>
        </ul>
        <h2>Fluid</h2>
        <ul>
          <li>Use exactly the fluid type your manufacturer specifies. The wrong fluid can cause slipping and harsh shifts.</li>
          <li>Fill and check the level with the engine running and the transmission at operating temperature, following the factory procedure.</li>
        </ul>
        <Tip>
          <b>Many modern transmissions need programming.</b> After installation, the transmission control module may need a relearn or
          software update so it shifts correctly. Ask your shop to check.
        </Tip>
        <h2>Test drive</h2>
        <ul>
          <li>Check every gear, including reverse, and watch for slipping, flaring or delayed engagement.</li>
          <li>Recheck the fluid level and look for leaks after the drive.</li>
        </ul>
        <h2>Keep the paperwork</h2>
        <p>
          Keep the installation invoice and fluid receipts. They&apos;re required for a warranty claim under our{" "}
          {BUSINESS.warrantyAdj} warranty.
        </p>
      </>
    ),
  },
  {
    slug: "find-your-engine-code-from-your-vin",
    eyebrow: "Fitment",
    title: "How to find your engine code from your VIN",
    description: "Where to find your VIN, which digits tell you the model year and engine, and why it decides which part fits.",
    minutes: 4,
    body: (
      <>
        <p>
          Two vehicles of the same year and model can have different engines and transmissions. Your VIN (vehicle identification
          number) tells us exactly which ones yours came with, so it&apos;s the most reliable way to get the right part.
        </p>
        <h2>Where to find your VIN</h2>
        <ul>
          <li>The driver-side dashboard, visible through the bottom of the windshield.</li>
          <li>The sticker on the driver&apos;s door jamb.</li>
          <li>Your registration, title or insurance card.</li>
        </ul>
        <h2>What the digits mean</h2>
        <ul>
          <li><b>Digits 1–3</b> identify the manufacturer and country.</li>
          <li><b>Digits 4–8</b> describe the vehicle: model, body, restraint system and, for many makes, the engine.</li>
          <li><b>Digit 10</b> is the model year.</li>
          <li><b>Digits 11–17</b> are the plant and serial number.</li>
        </ul>
        <Tip>
          <b>For most Ford, GM and Chrysler vehicles, the 8th digit is the engine code.</b> Other makes put it elsewhere in digits
          4–8. That&apos;s why our listings say things like &quot;VIN F, 8th digit&quot;.
        </Tip>
        <h2>The easy way</h2>
        <p>
          Enter your VIN in the search on our home page. We decode it with the federal NHTSA database and show the parts that match
          your engine. Or text your VIN to {BUSINESS.phoneDisplay} and a specialist will confirm the exact match for you.
        </p>
      </>
    ),
  },
];
