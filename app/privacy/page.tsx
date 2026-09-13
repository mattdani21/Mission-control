import { LegalDocument } from "../../components/legal-document";

export const metadata = {
  title: "Privacy — Mission Control",
};

export default function PrivacyPage() {
  return <LegalDocument file="PRIVACY.md" eyebrow="Envogue pilot" />;
}
