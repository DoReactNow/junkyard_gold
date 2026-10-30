import Link from "next/link";
import { ADDRESS_LINE, BUSINESS, SMS_HREF, TEL_HREF, smsWithBody } from "@/lib/business";
import { ChatIcon, MailIcon, PhoneIcon, PinIcon } from "./icons";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${BUSINESS.name} home`}>
      <svg viewBox="0 0 64 64" className="size-9 shrink-0" aria-hidden>
        <rect width="64" height="64" rx="12" fill={light ? "#e8a913" : "#121212"} />
        <path d="M14 44 24 22h16l10 22z" fill={light ? "#121212" : "#e8a913"} />
        <path d="M24 22l6 22M40 22l-6 22" stroke={light ? "#e8a913" : "#121212"} strokeWidth="3" />
      </svg>
      <span className={`whitespace-nowrap font-display text-xl font-bold uppercase leading-none sm:text-2xl ${light ? "text-white" : "text-ink"}`}>
        Junkyard <span className="text-gold">Gold</span>
      </span>
    </Link>
  );
}

const NAV = [
  { href: "/used-engines", label: "Engines" },
  { href: "/used-transmissions", label: "Transmissions" },
  { href: "/parts?type=Other", label: "Other Parts" },
  { href: "/#how", label: "How It Works" },
  { href: "/warranty", label: "Warranty" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40">
      <div className="bg-ink text-[13px] text-white/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2">
          <span className="hidden items-center gap-1.5 sm:flex">
            <PinIcon className="size-3.5 text-gold" /> {ADDRESS_LINE}
          </span>
          <span className="flex items-center gap-4">
            <a href={TEL_HREF} className="flex items-center gap-1.5 hover:text-gold">
              <PhoneIcon className="size-3.5 text-gold" /> Call {BUSINESS.phoneDisplay}
            </a>
            <a href={SMS_HREF} className="flex items-center gap-1.5 hover:text-gold">
              <ChatIcon className="size-3.5 text-gold" /> Text {BUSINESS.phoneDisplay}
            </a>
          </span>
        </div>
      </div>
      <div className="border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
          <Logo />
          <nav className="hidden items-center gap-6 text-[15px] font-medium lg:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-gold-dark">
                {n.label}
              </Link>
            ))}
          </nav>
          <a href={smsWithBody("Hi, I need a part. My VIN is: ")} className="btn-gold shrink-0 whitespace-nowrap !px-3.5 !py-2.5 text-sm">
            <ChatIcon /> Text<span className="hidden sm:inline"> Your</span> VIN
          </a>
        </div>
        <nav className="flex gap-5 overflow-x-auto border-t border-line px-4 py-2 text-sm font-medium lg:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="shrink-0 hover:text-gold-dark">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink text-white/75">
      <div className="stripe h-2" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            Tested used engines, transmissions and major parts from our yard in Bradenton, Florida. Every part
            comes with a {BUSINESS.warrantyAdj} warranty, and we&apos;ll text you real photos before it ships.
          </p>
        </div>
        <div>
          <h3 className="font-display text-lg uppercase text-white">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/used-engines" className="hover:text-gold">Used Engines</Link></li>
            <li><Link href="/used-transmissions" className="hover:text-gold">Used Transmissions</Link></li>
            <li><Link href="/parts?type=Other" className="hover:text-gold">Other Parts</Link></li>
            <li><Link href="/warranty" className="hover:text-gold">Warranty</Link></li>
            <li><Link href="/shipping-returns" className="hover:text-gold">Shipping &amp; Returns</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-lg uppercase text-white">Contact</h3>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li><a href={TEL_HREF} className="flex items-center gap-2 hover:text-gold"><PhoneIcon className="size-4 text-gold" />Call {BUSINESS.phoneDisplay}</a></li>
            <li><a href={SMS_HREF} className="flex items-center gap-2 hover:text-gold"><ChatIcon className="size-4 text-gold" />Text {BUSINESS.phoneDisplay}</a></li>
            <li><a href={`mailto:${BUSINESS.email}`} className="flex items-center gap-2 hover:text-gold"><MailIcon className="size-4 text-gold" />{BUSINESS.email}</a></li>
            <li className="flex items-start gap-2"><PinIcon className="mt-0.5 size-4 shrink-0 text-gold" />{ADDRESS_LINE}</li>
            <li className="pl-6 text-white/55">{BUSINESS.hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-white/50">
          <span>© {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.</span>
          <span className="flex gap-4">
            <Link href="/privacy" className="hover:text-gold">Privacy</Link>
            <Link href="/terms" className="hover:text-gold">Terms &amp; SMS Policy</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
