import { useTheme } from '../../context/ThemeContext';

export function Skeleton({ className = '' }) {
  const { isDark } = useTheme();
  return (
    <div
      className={`rounded-xl ${isDark ? 'skeleton-shimmer-dark' : 'skeleton-shimmer-light'} ${className}`}
    />
  );
}

export function DashboardSkeleton() {
  const { isDark } = useTheme();

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Hero Greeting Row Skeleton */}
      <div
        className={`p-6 rounded-2xl border transition-colors shadow-sm ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Skeleton className="w-24 h-4 rounded-md" />
              <Skeleton className="w-28 h-5 rounded-full" />
            </div>
            <Skeleton className="w-64 sm:w-80 h-8 rounded-lg" />
            <Skeleton className="w-48 sm:w-60 h-4 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-28 h-9 rounded-xl" />
            <Skeleton className="w-28 h-9 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Top 4 Metric Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`p-4 rounded-2xl border transition-colors shadow-sm space-y-2 ${
              isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
            }`}
          >
            <Skeleton className="w-20 h-3 rounded" />
            <Skeleton className="w-32 h-7 rounded-md" />
            <Skeleton className="w-24 h-3 rounded" />
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Monthly Limit Card */}
          <div
            className={`p-5 rounded-2xl border transition-colors shadow-sm space-y-4 ${
              isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
            }`}
          >
            <div className="flex justify-between items-center">
              <Skeleton className="w-28 h-4 rounded" />
              <Skeleton className="w-20 h-4 rounded" />
            </div>
            <Skeleton className="w-36 h-8 rounded" />
            <Skeleton className="w-full h-2.5 rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="w-20 h-3 rounded" />
              <Skeleton className="w-20 h-3 rounded" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className={`p-5 rounded-2xl border transition-colors shadow-sm space-y-3 ${
                isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
              }`}
            >
              <Skeleton className="w-28 h-4 rounded" />
              <Skeleton className="w-32 h-7 rounded" />
              <Skeleton className="w-24 h-3 rounded" />
            </div>
            <div
              className={`p-5 rounded-2xl border transition-colors shadow-sm space-y-3 ${
                isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
              }`}
            >
              <Skeleton className="w-28 h-4 rounded" />
              <Skeleton className="w-32 h-7 rounded" />
              <Skeleton className="w-24 h-3 rounded" />
            </div>
          </div>

          {/* Donut Chart Skeleton */}
          <div
            className={`p-6 rounded-2xl border transition-colors shadow-sm space-y-4 ${
              isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
            }`}
          >
            <div className="flex justify-between">
              <Skeleton className="w-36 h-4 rounded" />
              <Skeleton className="w-20 h-4 rounded" />
            </div>
            <div className="flex items-center justify-center py-6">
              <Skeleton className="w-44 h-44 rounded-full" />
            </div>
          </div>
        </div>

        {/* Right Column: Activity Feed Skeleton */}
        <div className="lg:col-span-5 space-y-6">
          <div
            className={`p-5 rounded-2xl border transition-colors shadow-sm space-y-4 ${
              isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
            }`}
          >
            <div className="flex justify-between items-center pb-3 border-b border-[#26262b]/40">
              <div className="space-y-1">
                <Skeleton className="w-28 h-4 rounded" />
                <Skeleton className="w-36 h-3 rounded" />
              </div>
              <Skeleton className="w-16 h-3 rounded" />
            </div>

            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-xl" />
                    <div className="space-y-1.5">
                      <Skeleton className="w-32 h-3.5 rounded" />
                      <Skeleton className="w-20 h-2.5 rounded" />
                    </div>
                  </div>
                  <Skeleton className="w-16 h-4 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LedgerSkeleton() {
  const { isDark } = useTheme();

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Header */}
      <div
        className={`p-6 rounded-2xl border transition-colors shadow-sm ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="w-40 h-8 rounded-lg" />
            <Skeleton className="w-60 h-4 rounded" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-32 h-9 rounded-xl" />
            <Skeleton className="w-32 h-9 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-hidden py-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="w-20 h-8 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Table Skeleton */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-sm transition-colors p-4 space-y-3 ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 px-2 border-b border-[#26262b]/30">
            <Skeleton className="w-24 h-4 rounded" />
            <Skeleton className="w-24 h-5 rounded-full" />
            <Skeleton className="w-48 h-4 rounded" />
            <Skeleton className="w-20 h-4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BudgetSkeleton() {
  const { isDark } = useTheme();

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Header */}
      <div
        className={`p-6 rounded-2xl border transition-colors shadow-sm ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="w-52 h-8 rounded-lg" />
            <Skeleton className="w-72 h-4 rounded" />
          </div>
          <Skeleton className="w-32 h-10 rounded-xl" />
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border transition-colors shadow-sm space-y-4 ${
              isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <Skeleton className="w-28 h-4 rounded" />
                <Skeleton className="w-20 h-3 rounded" />
              </div>
              <Skeleton className="w-16 h-5 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="w-32 h-6 rounded" />
              <Skeleton className="w-full h-2 rounded-full" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="w-16 h-3 rounded" />
              <Skeleton className="w-16 h-3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

