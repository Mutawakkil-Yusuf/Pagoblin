import Link from "next/link";
import { Pip } from "@/components/pip/Pip";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-ink px-6 text-center text-cream">
      <Pip mood="sleepy" size={140} />
      <h1 className="mt-4 font-display text-h2 font-extrabold">Nothing here</h1>
      <p className="mt-2 max-w-[320px] text-body text-muted">
        This page does not exist. Pip looked under the desk, the chair and three PDF stacks already.
      </p>
      <Link
        href="/app"
        className="mt-6 inline-flex min-h-[52px] items-center rounded-pill bg-orange px-7 font-bold text-ink"
      >
        Open the toolkit
      </Link>
    </main>
  );
}
