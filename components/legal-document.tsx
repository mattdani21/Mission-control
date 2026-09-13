import { readFile } from "node:fs/promises";
import { join } from "node:path";

import Link from "next/link";

import { renderLegalMarkdown } from "../lib/legal";
import { SiteFooter } from "./site-footer";

export async function LegalDocument({ file, eyebrow }: { file: string; eyebrow: string }) {
  const source = await readFile(join(process.cwd(), file), "utf8");
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-dim">{eyebrow}</p>
      <article
        className="legal-prose mt-4 text-sm leading-relaxed text-mut"
        dangerouslySetInnerHTML={{ __html: renderLegalMarkdown(source) }}
      />
      <p className="mt-10 text-sm text-dim">
        <Link href="/" className="text-accent-ink hover:underline">
          ← Back to Mission Control
        </Link>
      </p>
      <SiteFooter className="mt-12" />
    </main>
  );
}
