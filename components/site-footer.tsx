import Link from "next/link";

export function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-dim ${className}`}>
      <Link href="/privacy" className="hover:text-mut">
        Privacy
      </Link>
      <Link href="/terms" className="hover:text-mut">
        Terms
      </Link>
      <a href="mailto:team@empyrean.co.za" className="hover:text-mut">
        team@empyrean.co.za
      </a>
    </footer>
  );
}
