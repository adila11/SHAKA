import { useState } from 'react';
import { X, Check, Loader2, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { PREDEFINED_PROFILE_PICTURES, normalizeProfileImageKey } from '../../data/financeData';

function ProfilePictureModalDialog({ onClose, currentImage, onSave }) {
  const { isDark } = useTheme();
  const [selectedId, setSelectedId] = useState(() => normalizeProfileImageKey(currentImage));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleConfirm = async () => {
    setErrorMsg('');
    setIsSaving(true);
    try {
      const res = await onSave(selectedId);
      if (res && res.success === false) {
        setErrorMsg(res.message || 'Failed to save profile picture.');
        setIsSaving(false);
      } else {
        setIsSaving(false);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Error updating profile picture.');
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-picture-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 transition-all"
    >
      <div
        className={`w-full max-w-md rounded-3xl p-6 sm:p-7 border shadow-2xl transition-colors min-w-0 max-w-full break-words overflow-hidden ${
          isDark
            ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]'
            : 'bg-white border-[#e5e3dc] text-[#18181b]'
        }`}
      >
        {/* Header with Title, Description, and Close Button */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="text-left min-w-0">
            <h3
              id="profile-picture-modal-title"
              className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}
            >
              Choose Your Profile Picture
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Select one of the available profile pictures for your account.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={`p-1.5 rounded-xl border transition-colors shrink-0 ${
              isDark
                ? 'bg-[#26262b]/50 border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea] hover:bg-[#26262b]'
                : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#71717a] hover:text-[#18181b]'
            }`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl text-xs flex items-center gap-2 bg-[#d97070]/15 text-[#d97070] border border-[#d97070]/30">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="min-w-0 flex-1">{errorMsg}</span>
          </div>
        )}

        {/* Side-by-side Circular Avatars */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 my-6">
          {PREDEFINED_PROFILE_PICTURES.map((item) => {
            const isSelected = selectedId === item.id;
            const isCurrent = normalizeProfileImageKey(currentImage) === item.id;

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                disabled={isSaving}
                className={`group relative flex flex-col items-center p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#c9b27c] ${
                  isSelected
                    ? isDark
                      ? 'border-[#c9b27c] bg-[#c9b27c]/10 shadow-lg shadow-[#c9b27c]/15'
                      : 'border-[#c9b27c] bg-[#c9b27c]/15 shadow-lg shadow-[#c9b27c]/20'
                    : isDark
                    ? 'border-[#26262b] bg-[#1f1f24]/60 hover:border-[#38383f] hover:bg-[#222228]'
                    : 'border-[#e5e3dc] bg-[#faf9f5] hover:border-[#d4a359]/60 hover:bg-[#f4f2eb]'
                }`}
              >
                {/* Visual Selection Indicator Badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#c9b27c] text-neutral-950 flex items-center justify-center shadow-md animate-in fade-in zoom-in-75">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {/* Circular Avatar */}
                <div
                  className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden transition-all duration-200 group-hover:scale-105 ${
                    isSelected
                      ? 'ring-4 ring-[#c9b27c] ring-offset-2 ' + (isDark ? 'ring-offset-[#17171a]' : 'ring-offset-white')
                      : 'opacity-90 group-hover:opacity-100'
                  }`}
                >
                  <img
                    src={item.image}
                    alt={item.label}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>

                {/* Picture Label & Current Tag */}
                <div className="mt-3 text-center">
                  <span
                    className={`block text-xs font-bold tracking-wide transition-colors ${
                      isSelected
                        ? 'text-[#c9b27c]'
                        : isDark
                        ? 'text-[#e8e8ea]'
                        : 'text-[#18181b]'
                    }`}
                  >
                    {item.label}
                  </span>
                  {isCurrent && (
                    <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#c9b27c]/15 text-[#c9b27c] border border-[#c9b27c]/30">
                      Current
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Cancel & Confirm */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={`flex-1 h-11 px-4 rounded-xl border text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              isDark
                ? 'border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea] hover:bg-[#26262b]'
                : 'border-[#e5e3dc] text-[#71717a] hover:text-[#18181b] hover:bg-[#f6f5f2]'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving}
            className="flex-1 h-11 px-4 rounded-xl bg-gradient-to-r from-[#c9b27c] to-[#b39b65] text-neutral-950 text-xs font-bold tracking-wide shadow-md hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Confirm</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePictureModal({ isOpen, onClose, currentImage, onSave }) {
  if (!isOpen) return null;
  return (
    <ProfilePictureModalDialog
      onClose={onClose}
      currentImage={currentImage}
      onSave={onSave}
    />
  );
}
