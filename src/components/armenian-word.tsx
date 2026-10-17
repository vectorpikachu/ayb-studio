import { cn } from "@/lib/utils";

/**
 * Long Armenian words are common. Container-query based sizing lets a single
 * word use its card's real width instead of a one-size-fits-all font size.
 */
export function ArmenianWord({
  text,
  max = 96,
  min = 28,
  className,
}: {
  text: string;
  max?: number;
  min?: number;
  className?: string;
}) {
  const length = Math.max(1, Array.from(text).length);
  const relativeSize = (90 / (length * 0.64)).toFixed(3);

  return (
    <span
      className={cn("block max-w-full break-words", className)}
      style={{
        fontSize: `clamp(${min}px, ${relativeSize}cqw, ${max}px)`,
        lineHeight: 0.98,
      }}
      title={text}
    >
      {text}
    </span>
  );
}
