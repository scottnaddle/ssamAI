import { avatarPalette } from "@/lib/colors";

interface AvatarProps {
  name: string;
  size?: number;
  /** Optional explicit color. Otherwise hashed from name for stable output. */
  color?: string;
  className?: string;
}

/**
 * Stable colour from name so the same teacher always gets the same avatar tint.
 */
function hashIndex(s: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h % mod;
}

export function Avatar({ name, size = 32, color, className }: AvatarProps) {
  const safeName = name?.trim() || "?";
  const c = color ?? avatarPalette[hashIndex(safeName, avatarPalette.length)];
  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.44),
        background: `linear-gradient(135deg, ${c}, #E8A87C)`,
      }}
    >
      {safeName[0]?.toUpperCase()}
    </div>
  );
}
