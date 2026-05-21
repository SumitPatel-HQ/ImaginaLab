interface SlideDotIndicatorsProps {
  count?: number;
  indices?: number[];
  activeIndex: number;
  onSelect: (index: number) => void;
  className?: string;
  isResetting?: boolean;
}

export function SlideDotIndicators({
  count,
  indices,
  activeIndex,
  onSelect,
  className,
  isResetting = false,
}: SlideDotIndicatorsProps) {
  const visibleIndices = indices ?? (count ? Array.from({ length: count }, (_, i) => i) : []);

  if (visibleIndices.length <= 1) return null;

  const baseClassName =
    "absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-30 hidden md:flex items-center";
  const wrapperClassName = className ?? baseClassName;

  return (
    <div className={wrapperClassName}>
      {visibleIndices.map((index) => (
        <button
          key={index}
          type="button"
          aria-label={`Go to slide ${index }`}
          className={`h-3 w-3 rounded-full border border-white/10 bg-white/20 shadow-lg backdrop-blur-xs focus:outline-none focus-visible:ring-0 ${
            activeIndex === index
              ? "w-6 bg-white/70 shadow-[0_0_12px_rgba(255,255,255,0.18)] cursor-default"
              : "w-2 hover:bg-white/40 hover:scale-105 cursor-pointer"
          } ${
            isResetting
              ? ""
              : "transition-[width,background-color,transform,box-shadow] duration-300 ease-in-out"
          }`}
          onClick={(e) => {
            e.preventDefault();
            if (activeIndex !== index) {
              onSelect(index);
            }
          }}
        />
      ))}
    </div>
  );
}
