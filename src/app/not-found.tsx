import Link from "next/link";
import { NAME } from "@/lib/brand";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-[44rem] flex-col gap-4 px-4 py-16">
      <p className="text-sm font-semibold tracking-wide text-blue-600 dark:text-blue-400 uppercase">
        {NAME}
      </p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        That page does not exist.
      </p>
      <Link
        href="/"
        className="font-medium text-blue-600 dark:text-blue-400 underline underline-offset-2"
      >
        Back to the calculator
      </Link>
    </main>
  );
}
