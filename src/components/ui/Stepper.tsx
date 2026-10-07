import { Icon } from "./Icon";

/** Progress stepper. The current step is marked with aria-current="step". */
export function Stepper({ steps, current, label = "Progress" }: { steps: string[]; current: number; label?: string }) {
  return (
    <nav aria-label={label}>
      <ol className="flex items-center gap-2">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s} className="flex min-w-0 flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
              <span
                className={`num grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-bold transition-colors duration-ui ${
                  done ? "border-accent bg-accent text-accent-ink" : active ? "border-ink bg-ink text-paper" : "border-line-strong text-muted"
                }`}
              >
                {done ? <Icon name="check" size={16} /> : i + 1}
              </span>
              <span className={`truncate text-sm ${active ? "font-bold" : "text-muted"}`}>
                {s}
                <span className="sr-only">{done ? " (done)" : active ? " (current step)" : ""}</span>
              </span>
              {i < steps.length - 1 ? <span className={`hidden h-px flex-1 sm:block ${done ? "bg-accent" : "bg-line"}`} aria-hidden="true" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
