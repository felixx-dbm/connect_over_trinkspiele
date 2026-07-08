// Emoji set matches FLOATERS in src/app/page.tsx
const EMOJIS = ["🍺", "🍻", "🥂", "🍹", "🎲", "🏓", "⚡", "🍷"];

type Floater = {
  emoji: string;
  x: number;      // % from left
  y: number;      // % from top
  rot: number;    // deg
  size: number;   // rem
  duration: number; // s, full drift+fade cycle
  delay: number;    // s
  peak: number;     // max opacity reached mid-cycle
};

function buildFloaters(count: number): Floater[] {
  const floaters: Floater[] = [];
  
  // Calculate how many rows we need assuming 2 columns (left and right)
  const rows = Math.max(1, Math.floor(count / 2));
  const verticalSpacing = 100 / rows;

  for (let i = 0; i < count; i++) {
    const emoji = EMOJIS[i % EMOJIS.length];
    
    // Alternate between left side (even numbers) and right side (odd numbers)
    const isLeft = i % 2 === 0;
    
    // Set a base X percentage: ~10% for left, ~90% for right
    const baseX = isLeft ? 13 : 80;
    
    // Determine the row number to spread them evenly from top to bottom
    const row = Math.floor(i / 2);
    const baseY = row * verticalSpacing;

    // Keep the jitter so they don't look like a perfect, rigid grid
    const jitterX = ((i * 37) % 17) - 8;  // Shifts X by -8% to +8%
    const jitterY = ((i * 23) % 15) - 7;  // Shifts Y by -7% to +7%

    floaters.push({
      emoji,
      // Clamp values between 2% and 96% to keep them from clipping completely off-screen
      x: Math.min(96, Math.max(2, baseX + jitterX)),
      y: Math.min(96, Math.max(2, baseY + 5 + jitterY)),
      rot: ((i * 47) % 40) - 20,
      size: 2.4 + ((i * 13) % 5) * 0.6,
      duration: 14 + ((i * 7) % 10),
      delay: (i * 0.9) % 8,
      peak: 0.35 + ((i * 3) % 4) * 0.08,
    });
  }
  return floaters;
}

const FLOATERS = buildFloaters(20);

export default function FloatingBackground() {
  return (
    <div className="floating-bg" aria-hidden="true">
      {FLOATERS.map((f, i) => (
        <span
          key={i}
          className="floating-emoji"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            ["--rot" as string]: `${f.rot}deg`,
            ["--fsize" as string]: `${f.size}rem`,
            ["--duration" as string]: `${f.duration}s`,
            ["--delay" as string]: `${f.delay}s`,
            ["--peak" as string]: f.peak,
          }}
        >
          {f.emoji}
        </span>
      ))}
    </div>
  );
}