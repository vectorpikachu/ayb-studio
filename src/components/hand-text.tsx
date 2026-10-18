import { cn } from "@/lib/utils";

/**
 * Renders Armenian text with the handwritten face, but keeps numbers in the
 * print face at a slightly smaller size. Poqrik has no numeral glyphs, and
 * Latin handwritten digits look out of place beside Armenian cursive.
 */
export function HandText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts = text.split(/(\d+(?:[.,:]\d+)?)/g).filter(Boolean);

  return (
    <span className={cn("font-hand", className)} lang="hy">
      {parts.map((part, index) =>
        /^\d+(?:[.,:]\d+)?$/.test(part) ? (
          <span key={`${part}-${index}`} className="font-arm text-[0.78em] tracking-normal">
            {part}
          </span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </span>
  );
}
