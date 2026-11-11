import type { Metadata } from "next";
import { AppPage } from "@/components/nav/AppPage";
import { ProofClient } from "@/components/proof/ProofClient";
import { buildCsp } from "@/lib/csp";

export const metadata: Metadata = {
  title: "Proof of privacy — watch the network",
  description:
    "Watch Pagoblin's network live, read the exact Content-Security-Policy, compare the source hash with GitHub, and download a privacy receipt. No third-party requests.",
  alternates: { canonical: "/proof" },
};

export default function ProofPage() {
  const analyticsHost = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
    ? process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || "https://plausible.io"
    : "";

  return (
    <AppPage title="Proof of privacy" width={720} chrome={false}>
      <ProofClient
        csp={buildCsp({ dev: process.env.NODE_ENV === "development", analyticsHost })}
        analyticsHost={analyticsHost}
      />
    </AppPage>
  );
}
