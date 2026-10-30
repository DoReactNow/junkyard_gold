import { PolicyPage } from "@/components/policy-page";
import { BUSINESS } from "@/lib/business";

export const metadata = { title: "Warranty" };

export default function Page() {
  return (
    <PolicyPage title="Warranty" intro={`Every used part from ${BUSINESS.name} comes with a ${BUSINESS.warrantyAdj} warranty.`}>
      <h2>What&apos;s covered</h2>
      <p>
        For {BUSINESS.warranty} from the date you receive the part, we warranty it against internal mechanical defects
        that keep it from working as designed. For engines that means the block, heads, crankshaft and internal moving
        parts. For transmissions, the case and internal components.
      </p>
      <h2>What we do if there&apos;s a problem</h2>
      <p>Contact us with your order number and a description of the problem. If the part is defective we will, at our option, replace it with an equivalent unit or refund the purchase price.</p>
      <h2>What&apos;s not covered</h2>
      <ul>
        <li>Labor, towing, fluids, rental cars or other costs of installing or removing the part.</li>
        <li>Damage from improper installation, overheating, lack of oil or fluid, or racing and commercial abuse.</li>
        <li>Bolt-on accessories and sensors (for example sensors, belts, hoses, gaskets and seals).</li>
        <li>Parts that have been disassembled or modified without our written approval.</li>
      </ul>
      <h2>Keep your warranty valid</h2>
      <ul>
        <li>Have the part installed by a qualified mechanic.</li>
        <li>Replace the oil, filter and coolant (engines) or fluid and filter (transmissions) on installation and keep the receipts.</li>
        <li>Check and replace the radiator, thermostat, water pump and torque converter where needed.</li>
      </ul>
      <p>Questions? Call {BUSINESS.phoneDisplay}, text {BUSINESS.smsDisplay} or email {BUSINESS.email}.</p>
    </PolicyPage>
  );
}
