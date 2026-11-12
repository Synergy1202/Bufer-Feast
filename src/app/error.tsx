"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="shell page-space">
      <h1 className="page-title">This page needs another try.</h1>
      <p className="page-intro">
        The application could not load this view. No payment was taken. If an
        order save was interrupted, open My test orders to retry that same save.
      </p>
      <Button size="lg" onClick={reset} className="mt-6">
        Try the page again
      </Button>
    </div>
  );
}
