import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center size-8 bg-primary rounded-md text-primary-foreground", className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5 rotate-90"
      >
        <path d="M12 2v2.5" />
        <path d="M12 20v-2.5" />
        <path d="M20.39 16.5l-2-1.5" />
        <path d="M5.61 9l-2-1.5" />
        <path d="M20.39 7.5l-2 1.5" />
        <path d="M5.61 15l-2 1.5" />
        <path d="M12 5.5a6.5 6.5 0 1 1-6.5 6.5" />
        <path d="M12 5.5a6.5 6.5 0 1 0 6.5 6.5" />
      </svg>
    </div>
  );
}
