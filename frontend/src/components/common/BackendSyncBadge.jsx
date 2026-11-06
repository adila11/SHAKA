import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export default function BackendSyncBadge({ className = '' }) {
  const { isBackendConnected, isLoading } = useFinance();

  if (isLoading && isBackendConnected === null) {
    return (
      <span
        className={`text-[11px] px-2.5 py-0.5 rounded-full bg-[#d4a359]/15 text-[#d4a359] font-semibold border border-[#d4a359]/30 flex items-center gap-1.5 shadow-sm ${className}`}
      >
        <Loader2 className="w-3 h-3 animate-spin shrink-0 text-[#d4a359]" />
        <span>Connecting to Backend...</span>
      </span>
    );
  }

  if (isBackendConnected) {
    return (
      <span
        className={`text-[11px] px-2.5 py-0.5 rounded-full bg-[#8fb39a]/15 text-[#8fb39a] font-semibold border border-[#8fb39a]/30 flex items-center gap-1.5 shadow-sm ${className}`}
      >
        <CheckCircle2 className="w-3 h-3 shrink-0 text-[#8fb39a]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#8fb39a] animate-pulse" />
        <span>Backend Connected</span>
      </span>
    );
  }

  return (
    <span
      className={`text-[11px] px-2.5 py-0.5 rounded-full bg-[#d97070]/15 text-[#d97070] font-semibold border border-[#d97070]/30 flex items-center gap-1.5 shadow-sm ${className}`}
    >
      <AlertCircle className="w-3 h-3 shrink-0 text-[#d97070]" />
      <span className="w-1.5 h-1.5 rounded-full bg-[#d97070]" />
      <span>Backend Unable to Sync</span>
    </span>
  );
}

