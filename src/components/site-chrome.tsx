import Link from "next/link";
import { ADDRESS_LINE, BUSINESS, SMS_HREF, TEL_HREF, smsWithBody } from "@/lib/business";
import { ChatIcon, MailIcon, PhoneIcon, PinIcon, ShieldIcon, TruckIcon } from "./icons";
import { OpenStatus } from "./trust";

/** JG monogram + wordmark. `light` = on a dark background. */
export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <Link href="/" className="group flex min-w-0 items-center gap-2.5 sm:gap-3" aria-label={`${BUSINESS.name} home`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/jg-mark-sm.png"
        alt=""
        width={64}
        height={38}
        className={`h-8 w-auto shrink-0 sm:h-9 ${light ? "" : "drop-shadow-[0_1px_0_rgb(0_0_0/0.25)]"}`}
      />
      {!compact && (
        <span className="leading-none">
          <span className={`block whitespace-nowrap font-display text-[15px] font-bold tracking-[0.12em] sm:text-[19px] sm:tracking-[0.14em] ${light ? "text-white" : "text-ink"}`}>
            JUNKYARD <span className="text-gold-grad">GOLD</span>
          </span>
          <span className={`mt-1 hidden whitespace-nowrap text-[10px] font-medium tracking-[0.2em] sm:block ${light ? "text-white/55" : "text-steel"}`}>
            EST. {BUSINESS.founded} · BRADENTON, FL
          </span>
        </span>
      )}
    </Link>
  );
}

const NAV = [
  { href: "/used-engines", label: "Engines" },
  { href: "/used-transmissions", label: "Transmissions" },
  { href: "/parts?type=Other", label: "Other parts" },
  { href: "/our-process", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40">
      <div className="hidden bg-ink-2 text-[12.5px] text-white/60 md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-6">
          <span className="flex items-center gap-5">
            <span className="flex items-center gap-1.5"><ShieldIcon className="size-3.5 text-gold-2" /> {BUSINESS.warrantyAdj} warranty on every part</span>
            <span className="flex items-center gap-1.5"><TruckIcon className="size-3.5 text-gold-2" /> Ships to all 50 states</span>
            <span className="hidden items-center gap-1.5 lg:flex">{BUSINESS.networkSize} engines &amp; transmissions · every make</span>
          </span>
          <span className="flex items-center gap-5">
            <OpenStatus />
            <a href={`mailto:${BUSINESS.email}`} className="hover:text-white">{BUSINESS.email}</a>
          </span>
        </div>
      </div>
      <div className="border-b border-white/10 bg-ink/95 text-white backdrop-blur supports-[backdrop-filter]:bg-ink/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:h-[72px] md:px-6 lg:gap-8">
          <Logo light />
          <nav className="ml-2 hidden items-center gap-6 text-[14.5px] font-medium text-white/75 lg:flex xl:ml-6 xl:gap-7">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap transition hover:text-white">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <a href={TEL_HREF} className="hidden items-center gap-2 whitespace-nowrap text-sm font-semibold text-white/85 hover:text-white 2xl:flex">
              <PhoneIcon className="size-4 text-gold-2" /> {BUSINESS.phoneDisplay}
            </a>
            <a href={smsWithBody("Hi, I need a part. My VIN is: ")} className="btn-gold !h-10 shrink-0 whitespace-nowrap !px-4 text-sm">
              <ChatIcon /> <span className="hidden sm:inline">Text your VIN</span><span className="sm:hidden">Text us</span>
            </a>
            <details className="group relative lg:hidden">
              <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-lg border border-white/15 text-white [&::-webkit-details-marker]:hidden" aria-label="Menu">
                <svg viewBox="0 0 24 24" className="size-5 group-open:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg>
                <svg viewBox="0 0 24 24" className="hidden size-5 group-open:block" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
              </summary>
              <div className="absolute right-0 top-12 w-[min(88vw,320px)] overflow-hidden rounded-2xl border border-white/10 bg-ink-2 p-2 shadow-lift">
                {NAV.map((n) => (
                  <Link key={n.href} href={n.href} className="block rounded-lg px-4 py-3 text-[15px] font-medium text-white/85 hover:bg-white/5">
                    {n.label}
                  </Link>
                ))}
                <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/10 p-2 pt-3">
                  <a href={TEL_HREF} className="btn-outline-light !h-11 text-sm"><PhoneIcon /> Call</a>
                  <a href={SMS_HREF} className="btn-gold !h-11 text-sm"><ChatIcon /> Text</a>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const col = "text-[14px] text-white/60 transition hover:text-white";
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div className="hairline-gold" />
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_80%_0%,rgb(201_150_47/0.14),transparent_70%)]" />
        <div className="relative mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-8 px-4 py-16 md:px-6 md:py-20">
          <h2 className="font-serif max-w-3xl text-[2.6rem] leading-[1.02] sm:text-[3.6rem]">
            Have your VIN handy? <em className="text-gold-grad">Let&apos;s find your part.</em>
          </h2>
          <div className="flex flex-wrap gap-3">
            <a href={smsWithBody("Hi, I need a part. My VIN is: ")} className="btn-gold !h-[54px] !px-7"><ChatIcon /> Text {BUSINESS.smsDisplay}</a>
            <a href={TEL_HREF} className="btn-outline-light !h-[54px] !px-7"><PhoneIcon /> Call us</a>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 md:px-6">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_1.2fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-sm text-[14.5px] leading-relaxed text-white/60">
              Quality used engines, transmissions and major parts, matched to your VIN and shipped nationwide from
              Bradenton, Florida. Every part carries a {BUSINESS.warrantyAdj} warranty.
            </p>
          </div>
          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-2">Shop</h3>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/used-engines" className={col}>Used engines</Link></li>
              <li><Link href="/used-transmissions" className={col}>Used transmissions</Link></li>
              <li><Link href="/parts?type=Other" className={col}>Other parts</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-2">Company</h3>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/about" className={col}>About us</Link></li>
              <li><Link href="/our-process" className={col}>How it works</Link></li>
              <li><Link href="/guides" className={col}>Guides</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-2">Support</h3>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/warranty" className={col}>Warranty</Link></li>
              <li><Link href="/shipping-returns" className={col}>Shipping &amp; returns</Link></li>
              <li><Link href="/contact" className={col}>Contact</Link></li>
              <li><Link href="/terms" className={col}>Terms &amp; SMS policy</Link></li>
              <li><Link href="/privacy" className={col}>Privacy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-2">Contact</h3>
            <ul className="mt-4 space-y-3 text-[14px] text-white/70">
              <li><a href={TEL_HREF} className="flex items-center gap-2.5 hover:text-white"><PhoneIcon className="size-4 text-gold-2" /> Call {BUSINESS.phoneDisplay}</a></li>
              <li><a href={SMS_HREF} className="flex items-center gap-2.5 hover:text-white"><ChatIcon className="size-4 text-gold-2" /> Text {BUSINESS.smsDisplay}</a></li>
              <li><a href={`mailto:${BUSINESS.email}`} className="flex items-center gap-2.5 hover:text-white"><MailIcon className="size-4 text-gold-2" /> {BUSINESS.email}</a></li>
              <li className="flex items-start gap-2.5"><PinIcon className="mt-0.5 size-4 shrink-0 text-gold-2" /> {ADDRESS_LINE}</li>
              <li className="pl-6.5 text-white/45">{BUSINESS.hours}</li>
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-[12.5px] text-white/40">
          <span>© {BUSINESS.founded}–{new Date().getFullYear()} {BUSINESS.name}. All rights reserved.</span>
          <span>Serving drivers and repair shops since {BUSINESS.founded}.</span>
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

/** Dark page header used on inner pages. */
export function PageHero({
  eyebrow,
  title,
  children,
  crumbs,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  crumbs?: { name: string; href: string }[];
}) {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div className="grain pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-gold/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-10 md:px-6 md:pb-14">
        {crumbs && (
          <nav className="flex flex-wrap gap-1.5 text-[13px] text-white/50" aria-label="Breadcrumb">
            {crumbs.map((c, i) => (
              <span key={c.href} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-white/25">/</span>}
                {i < crumbs.length - 1 ? <Link href={c.href} className="hover:text-gold-light">{c.name}</Link> : <span className="text-white/80">{c.name}</span>}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && <div className="mt-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-2">{eyebrow}</div>}
        <h1 className="font-serif mt-4 max-w-4xl text-[2.9rem] leading-[1] sm:text-[3.8rem] md:text-[4.4rem]">{title}</h1>
        {children && <div className="mt-4 max-w-3xl text-[16.5px] leading-relaxed text-white/70">{children}</div>}
      </div>
      <div className="hairline-gold" />
    </section>
  );
}
