import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="page py-16">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-2 font-display text-5xl">This page is out of focus</h1>
      <p className="mt-3 max-w-prose text-lg text-muted">We couldn&apos;t find it. It may have moved, or the link may be mistyped.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/" variant="primary">Go to the home page</ButtonLink>
        <ButtonLink href="/shop" variant="secondary">Browse all frames</ButtonLink>
      </div>
    </div>
  );
}
