/** Skeleton shaped like a product card: image well, name, meta line, price. */
export function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 border border-line bg-surface p-3" aria-hidden="true">
      <div className="skeleton aspect-[16/10] w-full" />
      <div className="skeleton h-5 w-2/3" />
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton h-4 w-1/2" />
    </div>
  );
}

export function LineSkeleton({ w = "100%" }: { w?: string }) {
  return <div className="skeleton h-4" style={{ width: w }} aria-hidden="true" />;
}
