import { LegalDocument } from "../../components/legal-document";

export const metadata = {
  title: "Terms — Mission Control",
};

export default function TermsPage() {
  return <LegalDocument file="TERMS.md" eyebrow="Envogue pilot" />;
}
