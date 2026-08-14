import type { ModelInfo } from "@/lib/benchmark-data";
import { withBasePath } from "@/lib/base-path";

// Renders a model's brand icon inside a rounded chip.
// Icons for GLM/Kimi/LongCat already carry their own dark/green background,
// so those render "bare"; the rest sit on a white tile for consistent contrast.
const SELF_BG = new Set(["glm", "kimi", "longcat"]);

export function ModelIcon({
  model,
  size = 24,
  className = "",
  decorative = true,
  label,
}: {
  model: ModelInfo;
  size?: number;
  className?: string;
  decorative?: boolean;
  label?: string;
}) {
  const bare = SELF_BG.has(model.key);
  const inner = Math.round(size * (bare ? 1 : 0.62));
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bare ? "transparent" : "#fff",
        boxShadow: bare ? "none" : "inset 0 0 0 1px var(--border)",
        color: model.color,
      }}
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : (label ?? model.name)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="block shrink-0 object-contain"
        src={withBasePath(model.icon)}
        alt=""
        width={inner}
        height={inner}
        style={{ width: inner, height: inner }}
      />
    </span>
  );
}
