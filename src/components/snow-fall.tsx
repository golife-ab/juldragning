"use client";

export function SnowFall() {
  const flakes = Array.from({ length: 48 }, (_, i) => i);

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      aria-hidden
    >
      {flakes.map((i) => (
        <span
          key={i}
          className="snowflake absolute top-[-10%] rounded-full bg-white/80"
          style={{
            left: `${(i * 37) % 100}%`,
            width: `${4 + (i % 5)}px`,
            height: `${4 + (i % 5)}px`,
            animationDelay: `${(i % 12) * 0.4}s`,
            animationDuration: `${6 + (i % 8)}s`,
          }}
        />
      ))}
    </div>
  );
}
