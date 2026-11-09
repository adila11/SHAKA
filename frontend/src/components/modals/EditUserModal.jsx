import { useState } from 'react';
import { X, User, AtSign, Loader2, AlertCircle, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

function EditUserModalDialog({ onClose, currentUser, onSave }) {
  const { isDark } = useTheme();

  const [name, setName] = useState(() => currentUser?.name || currentUser?.username || '');
  const [username, setUsername] = useState(() => currentUser?.username || '');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = name.trim();
    const trimmedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!trimmedName) {
      setErrorMsg('Name is required.');
      return;
    }

    if (!trimmedUsername || trimmedUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters long.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await onSave({
        name: trimmedName,
        username: trimmedUsername,
      });

      if (res && res.success === false) {
        setErrorMsg(res.message || 'Failed to update profile.');
        setIsSaving(false);
      } else {
        setIsSaving(false);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Error updating profile.');
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md transition-all"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
      }}
    >
      <div
        className={`w-full max-w-md rounded-3xl p-6 sm:p-7 border shadow-2xl transition-colors min-w-0 max-w-full break-words overflow-hidden ${
          isDark
            ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]'
            : 'bg-white border-[#e5e3dc] text-[#18181b]'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="text-left min-w-0">
            <h3
              id="edit-user-modal-title"
              className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}
            >
              Edit User Profile
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Update your account display name and unique username handle.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name input */}
          <div className="text-left">
            <label className={`block text-[11px] font-semibold mb-1.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                required
                placeholder="Enter your full name"
                className={`w-full h-11 pl-9 pr-3 rounded-xl border text-sm font-medium outline-none focus:border-[#c9b27c] transition-colors ${
                  isDark
                    ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                    : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                }`}
              />
              <User className="w-4 h-4 text-[#8a8a93] absolute left-3 top-3.5" />
            </div>
            <span className={`block text-[10px] mt-1 ${isDark ? 'text-[#6b6b75]' : 'text-[#9ca3af]'}`}>
              This is the primary name displayed on your profile and dashboard.
            </span>
          </div>

          {/* Username input */}
          <div className="text-left">
            <label className={`block text-[11px] font-semibold mb-1.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                maxLength={24}
                required
                placeholder="username"
                className={`w-full h-11 pl-9 pr-3 rounded-xl border text-sm font-mono outline-none focus:border-[#c9b27c] transition-colors ${
                  isDark
                    ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                    : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                }`}
              />
              <AtSign className="w-4 h-4 text-[#8a8a93] absolute left-3 top-3.5" />
            </div>
            <span className={`block text-[10px] mt-1 ${isDark ? 'text-[#6b6b75]' : 'text-[#9ca3af]'}`}>
              Shown light and small below your name. Lowercase letters, numbers, and underscores only.
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                isDark
                  ? 'border-[#26262b] bg-[#17171a] text-[#8a8a93] hover:text-[#e8e8ea]'
                  : 'border-[#e5e3dc] bg-[#f6f5f2] text-[#71717a] hover:text-[#18181b]'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim() || !username.trim()}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-tr from-[#c9b27c] to-[#a68d55] text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#c9b27c]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditUserModal({ isOpen, onClose, currentUser, onSave }) {
  if (!isOpen) return null;

  return (
    <EditUserModalDialog
      onClose={onClose}
      currentUser={currentUser}
      onSave={onSave}
    />
  );
}
