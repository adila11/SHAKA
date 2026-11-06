import { useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export default function BackendSyncBadge({ className = '' }) {
  const { isBackendConnected, isLoading, retryConnection } = useFinance();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async (e) => {
    e.stopPropagation();
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      await retryConnection();
    } finally {
      setIsRetrying(false);
    }
  };

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
    <button
      type="button"
      onClick={handleRetry}
      title="Click to retry connection to backend"
      className={`text-[11px] px-2.5 py-0.5 rounded-full bg-[#d97070]/15 text-[#d97070] font-semibold border border-[#d97070]/30 hover:bg-[#d97070]/25 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 ${className}`}
    >
      {isRetrying ? (
        <Loader2 className="w-3 h-3 animate-spin shrink-0 text-[#d97070]" />
      ) : (
        <AlertCircle className="w-3 h-3 shrink-0 text-[#d97070]" />
      )}
      <span className="w-1.5 h-1.5 rounded-full bg-[#d97070]" />
      <span>{isRetrying ? 'Retrying...' : 'Backend Unable to Sync'}</span>
      <RefreshCw className={`w-2.5 h-2.5 ml-0.5 ${isRetrying ? 'animate-spin' : ''}`} />
    </button>
  );
}
