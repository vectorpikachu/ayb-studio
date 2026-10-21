import { PencilLine } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A small handwritten rendering of an Armenian word or sentence, always shown
 * next to the printed form. The pencil mark keeps the two readings distinct
 * without adding another label to every card.
 */
export function Handwriting({
  text,
  className,
  textClassName,
  iconSize = 12,
}: {
  text: string;
  className?: string;
  textClassName?: string;
  iconSize?: number;
}) {
  return (
    <div className={cn("flex items-start gap-2", className)}>
      <PencilLine
        size={iconSize}
        strokeWidth={1.6}
        className="mt-[0.3em] shrink-0 text-[var(--faint)]"
        aria-hidden
      />
      <p
        className={cn(
          "min-w-0 break-words font-hand text-[15px] leading-[1.7] text-[var(--ink)] opacity-90",
          textClassName,
        )}
        lang="hy"
      >
        {text}
      </p>
    </div>
  );
}
