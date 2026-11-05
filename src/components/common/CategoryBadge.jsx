
const CATEGORY_COLORS = {
  Food: '#c9b27c',
  Rent: '#8fb39a',
  Bills: '#d4a359',
  Travel: '#c9b27c',
  Shopping: '#8a8a93',
  Health: '#8fb39a',
};

export default function CategoryBadge({ category, customColor = null }) {
  const color = customColor || CATEGORY_COLORS[category] || '#c9b27c';

  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-xs">
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span>{category}</span>
    </span>
  );
}
