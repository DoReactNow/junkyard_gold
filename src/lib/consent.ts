import { BUSINESS } from "./business";

/**
 * The exact SMS consent wording shown next to the checkbox. The server stores this text with the
 * time, IP address and browser of every lead that ticks it — your proof of consent (TCPA / 10DLC).
 * If you change the wording, old leads keep the version they agreed to.
 */
export const CONSENT_TEXT =
  `I agree to receive text messages from ${BUSINESS.name} about my parts request, including follow-ups. ` +
  "Message frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help. " +
  "Consent is not a condition of purchase.";
