type WavyDividerProps = { color?: string; flip?: boolean };

export function WavyDivider({ color = '#a9cbd9', flip = false }: WavyDividerProps) {
  return (
    <svg
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
      className="block h-[34px] w-full"
      style={flip ? { transform: 'rotate(180deg)' } : undefined}
    >
      <path
        d="M0,20 C150,42 300,0 450,18 C620,38 760,2 920,20 C1060,36 1140,10 1200,18 L1200,40 L0,40 Z"
        fill={color}
        stroke="#33291b"
        strokeWidth="2.5"
      />
    </svg>
  );
}
