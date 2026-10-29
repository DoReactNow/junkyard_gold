type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24" };

export const PhoneIcon = ({ className = "size-4" }: P) => (
  <svg {...base} className={className} aria-hidden><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
);
export const ChatIcon = ({ className = "size-4" }: P) => (
  <svg {...base} className={className} aria-hidden><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
);
export const PinIcon = ({ className = "size-4" }: P) => (
  <svg {...base} className={className} aria-hidden><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
export const MailIcon = ({ className = "size-4" }: P) => (
  <svg {...base} className={className} aria-hidden><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
);
export const ShieldIcon = ({ className = "size-5" }: P) => (
  <svg {...base} className={className} aria-hidden><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const TruckIcon = ({ className = "size-5" }: P) => (
  <svg {...base} className={className} aria-hidden><path d="M10 17h4V5H2v12h3" /><path d="M14 8h4l4 4v5h-2" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>
);
export const CameraIcon = ({ className = "size-5" }: P) => (
  <svg {...base} className={className} aria-hidden><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" /><circle cx="12" cy="13" r="3" /></svg>
);
export const SearchIcon = ({ className = "size-4" }: P) => (
  <svg {...base} className={className} aria-hidden><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
);
export const CheckIcon = ({ className = "size-4" }: P) => (
  <svg {...base} className={className} aria-hidden><path d="M20 6 9 17l-5-5" /></svg>
);
export const ReturnIcon = ({ className = "size-5" }: P) => (
  <svg {...base} className={className} aria-hidden><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-1" /></svg>
);
