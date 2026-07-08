type MarqueeProps = {
  items?: string[];
};

const DEFAULT_ITEMS = [
  "Challenge Accepted",
  "Claim Your Crown",
  "Last One Standing",
  "Find Your Crew",
];

/**
 * Scrolling ticker of short phrases, separated by a diamond glyph.
 * Content is duplicated once in the markup so the loop is seamless —
 * see .marquee-track / @keyframes marquee-scroll in globals.css.
 */
export default function Marquee({ items = DEFAULT_ITEMS }: MarqueeProps) {
  const line = items.join(" ✦ ") + " ✦ ";

  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        <span className="marquee-item">{line}</span>
        <span className="marquee-item">{line}</span>
      </div>
    </div>
  );
}