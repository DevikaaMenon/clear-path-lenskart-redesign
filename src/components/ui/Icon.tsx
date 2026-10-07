/**
 * Clear Path icon set: original, drawn on a 24px grid with a 2px stroke,
 * round caps and joins. Decorative by default (aria-hidden); pass `label`
 * when an icon is the only content of a control.
 */
import type { SVGProps } from "react";

const P: Record<string, React.ReactNode> = {
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 20 20" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />,
  "heart-filled": <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" fill="currentColor" />,
  bag: <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
  user: <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h10" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-up": <path d="m6 15 6-6 6 6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  "chevron-left": <path d="m15 6-6 6 6 6" />,
  "arrow-right": <path d="M4 12h16m-6-6 6 6-6 6" />,
  "arrow-left": <path d="M20 12H4m6-6-6 6 6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  compare: <><circle cx="7" cy="12" r="4" /><circle cx="17" cy="12" r="4" /><path d="M11 12h2" /></>,
  glasses: <><circle cx="6.5" cy="13.5" r="3.5" /><circle cx="17.5" cy="13.5" r="3.5" /><path d="M10 13.5c.7-.7 3.3-.7 4 0M3 13.5 4 8h1.5M21 13.5 20 8h-1.5" /></>,
  cube: <><path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" /><path d="M4 7.5 12 12l8-4.5M12 12v9" /></>,
  ruler: <><path d="M3 15 15 3l6 6L9 21l-6-6Z" /><path d="m7 11 2 2m1-5 2 2m1-5 2 2" /></>,
  truck: <><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>,
  return: <><path d="M4 9h11a5 5 0 0 1 0 10H8" /><path d="m8 5-4 4 4 4" /></>,
  cash: <><rect x="3" y="6" width="18" height="12" rx="1" /><circle cx="12" cy="12" r="2.5" /><path d="M6 9v.01M18 15v.01" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>,
  pin: <><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5v.01" /></>,
  alert: <><path d="M12 3.5 2.5 20h19L12 3.5Z" /><path d="M12 10v4.5M12 17.2v.01" /></>,
  trash: <><path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  undo: <><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
  sliders: <><path d="M4 7h10m4 0h2M4 17h4m4 0h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  upload: <><path d="M12 15V4m-5 5 5-5 5 5" /><path d="M4 15v5h16v-5" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="1" /><path d="M3.5 10h17M8 3v4m8-4v4" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="1" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  rotate: <><path d="M20 12a8 8 0 1 1-2.4-5.7" /><path d="M20 4v5h-5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2m0 15v2M2.5 12h2m15 0h2M5.3 5.3l1.4 1.4m10.6 10.6 1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>,
  screen: <><rect x="3" y="4.5" width="18" height="12" rx="1" /><path d="M9 20.5h6M12 16.5v4" /></>,
  book: <><path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Z" /><path d="M12 6.5V20" /></>,
  lens: <><circle cx="12" cy="12" r="8" /><path d="M8.5 9.5a4.5 4.5 0 0 1 3.5-2" /></>,
  contact: <><ellipse cx="12" cy="13" rx="8" ry="5" /><path d="M4 13a8 8 0 0 1 16 0" /></>,
  kid: <><circle cx="12" cy="7" r="3" /><path d="M7 21v-5a5 5 0 0 1 10 0v5M9.5 7h.01M14.5 7h.01" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" />,
  card: <><rect x="3" y="5.5" width="18" height="13" rx="1" /><path d="M3 10h18M7 15h4" /></>,
  upi: <><path d="M7 4 4 20M12 4l-3 16M15 8h3.5a2.5 2.5 0 0 1 0 5H15" /></>,
  wallet: <><path d="M4 7h15a1 1 0 0 1 1 1v11H4V7Z" /><path d="M4 7l12-3v3M16 13.5h.01" /></>,
  bank: <><path d="M3 9.5 12 4l9 5.5H3ZM5 10v8m4.5-8v8m5-8v8M19 10v8M3 20h18" /></>,
  timer: <><circle cx="12" cy="13" r="7.5" /><path d="M12 9v4l2.5 2.5M9.5 2.5h5" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.7c0 1.8-2.4 2.3-2.4 3.8M12 17.2v.01" /></>,
  text: <><path d="M4 7V5h10v2M9 5v14M7 19h4" /><path d="M14 12v-1.5h6V12M17 10.5V19M15.5 19h3" /></>,
  location: <><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3m0 13v3M2.5 12h3m13 0h3" /><circle cx="12" cy="12" r="7" /></>,
};

export type IconName = keyof typeof P;

export function Icon({
  name, size = 24, label, className, ...rest
}: { name: IconName; size?: number; label?: string } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      {P[name]}
    </svg>
  );
}

export const ICON_NAMES = Object.keys(P) as IconName[];
