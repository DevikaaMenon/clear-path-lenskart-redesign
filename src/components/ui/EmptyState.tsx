import { Icon, IconName } from "./Icon";

export function EmptyState({
  icon = "search", title, body, children, headingLevel = 2,
}: { icon?: IconName; title: string; body?: React.ReactNode; children?: React.ReactNode; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as "h2";
  return (
    <div className="flex flex-col items-start gap-4 border border-dashed border-line-strong bg-surface p-6 md:p-10">
      <span className="grid h-14 w-14 place-items-center rounded-full border border-ink">
        <Icon name={icon} size={26} />
      </span>
      <div>
        <H className="font-display text-3xl">{title}</H>
        {body ? <div className="mt-2 max-w-prose text-muted">{body}</div> : null}
      </div>
      {children}
    </div>
  );
}
