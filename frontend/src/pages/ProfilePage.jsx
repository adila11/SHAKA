import { useState, useEffect } from 'react';
import {
  KeyRound,
  SunMedium,
  Moon,
  LogOut,
  ChevronRight,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Pencil
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import ProfilePictureModal from '../components/modals/ProfilePictureModal';
import { getProfileImageUrl } from '../data/financeData';

export default function ProfilePage() {
  const {
    currentUser,
    logout,
    setCurrentScreen,
    sessionInfo,
    fetchSessionInfo,
    isAccessCodeEnabled,
    enableAccessCode,
    changeAccessCode,
    disableAccessCode,
    resetAccessCode,
    updateProfile,
  } = useFinance();
  const { isDark, setTheme } = useTheme();

  // Modal dialog states: null | 'enable' | 'change' | 'disable' | 'view_reset'
  const [modalType, setModalType] = useState(null);

  // Form states
  const [accessCode, setAccessCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [currentCode, setCurrentCode] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Profile Picture & Username Edit states
  const [isPictureModalOpen, setIsPictureModalOpen] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editUsernameValue, setEditUsernameValue] = useState(currentUser?.username || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);

  const handleSaveProfilePicture = async (selectedId) => {
    setIsSavingProfile(true);
    setProfileFeedback(null);
    const res = await updateProfile({ profileImage: selectedId, avatar: selectedId });
    setIsSavingProfile(false);
    if (res.success) {
      setProfileFeedback({ type: 'success', message: 'Profile picture updated successfully!' });
      setTimeout(() => setProfileFeedback(null), 3000);
      return { success: true };
    } else {
      setProfileFeedback({ type: 'error', message: res.message || 'Failed to update profile picture.' });
      return { success: false, message: res.message };
    }
  };

  const handleSaveUsername = async (e) => {
    e?.preventDefault();
    const trimmed = editUsernameValue.trim().toLowerCase();
    if (!trimmed || trimmed.length < 3) {
      setProfileFeedback({ type: 'error', message: 'Username must be at least 3 characters long.' });
      return;
    }

    if (trimmed === currentUser?.username?.toLowerCase()) {
      setIsEditingUsername(false);
      return;
    }

    setIsSavingProfile(true);
    setProfileFeedback(null);
    const res = await updateProfile({ username: trimmed });
    setIsSavingProfile(false);

    if (res.success) {
      setProfileFeedback({ type: 'success', message: 'Username updated successfully!' });
      setIsEditingUsername(false);
      setTimeout(() => setProfileFeedback(null), 3000);
    } else {
      setProfileFeedback({ type: 'error', message: res.message || 'Failed to update username.' });
    }
  };

  useEffect(() => {
    fetchSessionInfo();
  }, [fetchSessionInfo]);

  const closeModal = () => {
    setModalType(null);
    setAccessCode('');
    setConfirmCode('');
    setCurrentCode('');
    setAccountPassword('');
    setShowPassword(false);
    setFeedback(null);
  };

  const handleEnable = async (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(accessCode)) {
      setFeedback({ type: 'error', message: 'Access code must be a 4-digit number.' });
      return;
    }
    if (accessCode !== confirmCode) {
      setFeedback({ type: 'error', message: 'Access codes do not match.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    const res = await enableAccessCode(accessCode);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: 'success', message: '4-digit access code enabled successfully!' });
      setTimeout(closeModal, 1200);
    } else {
      setFeedback({ type: 'error', message: res.message || 'Failed to enable access code.' });
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(currentCode)) {
      setFeedback({ type: 'error', message: 'Current access code must be a 4-digit number.' });
      return;
    }
    if (!/^\d{4}$/.test(accessCode)) {
      setFeedback({ type: 'error', message: 'New access code must be a 4-digit number.' });
      return;
    }
    if (accessCode !== confirmCode) {
      setFeedback({ type: 'error', message: 'New access codes do not match.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    const res = await changeAccessCode(currentCode, accessCode);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: 'success', message: '4-digit access code changed successfully!' });
      setTimeout(closeModal, 1200);
    } else {
      setFeedback({ type: 'error', message: res.message || 'Failed to update access code.' });
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    if (!currentCode.trim() && !accountPassword.trim()) {
      setFeedback({ type: 'error', message: 'Enter your 4-digit access code or account password to confirm.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    const res = await disableAccessCode(currentCode, accountPassword);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: 'success', message: 'Access code disabled.' });
      setTimeout(closeModal, 1200);
    } else {
      setFeedback({ type: 'error', message: res.message || 'Verification failed.' });
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!accountPassword.trim()) {
      setFeedback({ type: 'error', message: 'Account password is required to reset access code.' });
      return;
    }
    if (!/^\d{4}$/.test(accessCode)) {
      setFeedback({ type: 'error', message: 'New access code must be a 4-digit number.' });
      return;
    }
    if (accessCode !== confirmCode) {
      setFeedback({ type: 'error', message: 'New access codes do not match.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    const res = await resetAccessCode(accountPassword, accessCode);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: 'success', message: 'Access code reset successfully!' });
      setTimeout(closeModal, 1200);
    } else {
      setFeedback({ type: 'error', message: res.message || 'Password verification failed.' });
    }
  };

  // Format timestamps
  const formatTime = (ts) => {
    if (!ts) return 'Active now';
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div
        className={`p-6 rounded-2xl border transition-colors shadow-sm ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#c9b27c]/15 text-[#c9b27c] border border-[#c9b27c]/30">
                Verified Account
              </span>
              <span className="text-xs text-[#8a8a93]">SHAKA Security</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
              Settings & Security
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Manage your personal credentials, security settings, and user-specific access code.
            </p>
          </div>
        </div>
      </div>

      {/* Responsive 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols on desktop): Member Profile */}
        <div className="lg:col-span-4 space-y-6">
          {/* Profile Card */}
          <div
            className={`p-6 rounded-2xl border text-center transition-colors shadow-sm ${
              isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
            }`}
          >
            {/* Avatar with Edit Option */}
            <div className="relative w-24 h-24 mx-auto mb-3">
              <button
                type="button"
                onClick={() => setIsPictureModalOpen(true)}
                title="Click to edit profile picture"
                className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-tr from-[#26262b] to-[#1f1f24] border-2 border-[#c9b27c] text-[#c9b27c] text-2xl font-black flex items-center justify-center shadow-lg shadow-[#c9b27c]/15 hover:opacity-95 transition-all cursor-pointer group"
              >
                <img
                  src={getProfileImageUrl(currentUser?.profileImage || currentUser?.avatar)}
                  alt={currentUser?.username || 'Profile'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </button>

              {/* Edit Badge Button Overlay */}
              <button
                type="button"
                onClick={() => setIsPictureModalOpen(true)}
                title="Edit Profile Picture"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#c9b27c] text-neutral-950 flex items-center justify-center cursor-pointer shadow-md hover:scale-110 active:scale-95 transition-all"
                aria-label="Edit Profile Picture"
              >
                {isSavingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
              </button>
            </div>

            {/* Edit Profile Picture Action Link */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setIsPictureModalOpen(true)}
                className="text-[11px] font-semibold text-[#c9b27c] hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit photo</span>
              </button>
            </div>

            {/* Feedback Alert for Profile Actions */}
            {profileFeedback && (
              <div
                className={`mb-3 p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 ${
                  profileFeedback.type === 'success'
                    ? 'bg-[#8fb39a]/15 text-[#8fb39a] border border-[#8fb39a]/30'
                    : 'bg-[#d97070]/15 text-[#d97070] border border-[#d97070]/30'
                }`}
              >
                {profileFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{profileFeedback.message}</span>
              </div>
            )}

            {/* Editable Username */}
            {isEditingUsername ? (
              <form onSubmit={handleSaveUsername} className="space-y-3 pt-1 border-t border-[#26262b]/60">
                <div className="text-left">
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                    Edit Username
                  </label>
                  <input
                    type="text"
                    value={editUsernameValue}
                    onChange={(e) => setEditUsernameValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    maxLength={24}
                    required
                    placeholder="Enter new username"
                    autoFocus
                    className={`w-full h-10 px-3 rounded-xl border text-sm font-mono outline-none focus:border-[#c9b27c] ${
                      isDark ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]' : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                    }`}
                  />
                  <span className={`block text-[10px] mt-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                    Lowercase letters, numbers, and underscores only.
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingUsername(false);
                      setEditUsernameValue(currentUser?.username || '');
                      setProfileFeedback(null);
                    }}
                    className="flex-1 py-2 rounded-xl border border-[#26262b] text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile || !editUsernameValue.trim()}
                    className="flex-1 py-2 rounded-xl bg-[#c9b27c] text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Save</span>}
                  </button>
                </div>
              </form>
            ) : (
              <div className="pt-2 border-t border-[#26262b]/60">
                <div className="flex items-center justify-center gap-2">
                  <h3 className={`text-lg font-bold tracking-tight font-mono ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                    {currentUser?.username || 'abdulshamil'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingUsername(true);
                      setEditUsernameValue(currentUser?.username || '');
                      setProfileFeedback(null);
                    }}
                    title="Edit username"
                    className="p-1.5 rounded-lg text-[#8a8a93] hover:text-[#c9b27c] hover:bg-[#c9b27c]/10 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                  Multi-User Ledger Admin
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (8 cols on desktop): Settings Panels */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Access Code Security (Replaces old 2FA) */}
          <div
            className={`p-6 rounded-2xl border transition-colors shadow-sm ${
              isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#c9b27c]/15 text-[#c9b27c] flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className={`text-base font-bold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                    Access Code Security
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                    User-specific fast reauthentication security
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <div>
                {isAccessCodeEnabled ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#8fb39a]/15 text-[#8fb39a] border border-[#8fb39a]/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Access Code Enabled</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-800/40 text-[#8a8a93] border border-neutral-700/40">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Access Code Disabled</span>
                  </span>
                )}
              </div>
            </div>

            {/* Session Information Box */}
            <div
              className={`p-4 rounded-xl border mb-5 ${
                isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className={`block text-[10px] uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                    Session Status
                  </span>
                  <span className="font-bold text-[#8fb39a] flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#8fb39a]" />
                    <span>Active Session</span>
                  </span>
                </div>
                <div>
                  <span className={`block text-[10px] uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                    Last Authenticated Activity
                  </span>
                  <span className={`font-mono block mt-0.5 ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                    {formatTime(sessionInfo?.lastActivityAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons for Access Code */}
            <div className="flex flex-wrap items-center gap-2.5">
              {!isAccessCodeEnabled ? (
                <button
                  type="button"
                  onClick={() => setModalType('enable')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-tr from-[#c9b27c] to-[#a68d55] text-neutral-950 font-bold text-xs shadow-md shadow-[#c9b27c]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4 stroke-[2.5]" />
                  <span>Enable Access Code</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setModalType('change')}
                    className="px-4 py-2 rounded-xl bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Change Access Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalType('view_reset')}
                    className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isDark
                        ? 'bg-[#202024] border-[#26262b] text-[#e8e8ea] hover:bg-[#28282d]'
                        : 'bg-white border-[#e5e3dc] text-[#18181b] hover:bg-[#f6f5f2]'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-[#c9b27c]" />
                    <span>View / Reset Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalType('disable')}
                    className="px-3.5 py-2 rounded-xl border border-[#d97070]/30 hover:bg-[#d97070]/10 text-[#d97070] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>Disable</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Section 2: Account Password */}
          <div
            className={`p-5 rounded-2xl border transition-colors shadow-sm ${
              isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
            }`}
          >
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Credentials
            </h4>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setCurrentScreen('change-pass')}
                className={`w-full p-4 rounded-xl border flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#0e0e10] border-[#26262b] hover:border-[#c9b27c]'
                    : 'bg-[#f6f5f2] border-[#e5e3dc] hover:border-[#c9b27c]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#c9b27c]/15 text-[#c9b27c] flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-sm font-bold block ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                      Change Password
                    </span>
                    <span className={`text-xs ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                      Update your account login password
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8a8a93]" />
              </button>
            </div>
          </div>

          {/* Section 3: Preferences & Theme */}
          <div
            className={`p-5 rounded-2xl border transition-colors shadow-sm ${
              isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
            }`}
          >
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Preferences & Styling
            </h4>

            <div className="space-y-4">
              {/* Theme Selector */}
              <div>
                <span className={`text-xs font-medium block mb-2 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                  Color Theme (Stitch Design Specification)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      isDark
                        ? 'bg-[#0e0e10] border-[#c9b27c] ring-1 ring-[#c9b27c]'
                        : 'bg-[#f6f5f2] border-[#e5e3dc] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Moon className="w-5 h-5 text-[#c9b27c]" />
                    <div className="text-left">
                      <span className="text-xs font-bold block text-[#e8e8ea]">Obsidian Dark</span>
                      <span className="text-[10px] text-[#8a8a93]">Base #0e0e10 & Gold</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      !isDark
                        ? 'bg-white border-[#c9b27c] ring-1 ring-[#c9b27c]'
                        : 'bg-[#0e0e10] border-[#26262b] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <SunMedium className="w-5 h-5 text-[#c9b27c]" />
                    <div className="text-left">
                      <span className={`text-xs font-bold block ${!isDark ? 'text-[#18181b]' : 'text-[#e8e8ea]'}`}>
                        Alabaster Light
                      </span>
                      <span className="text-[10px] text-[#8a8a93]">Base #f6f5f2 & Gold</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Currency Standard */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#c9b27c]/15 text-[#c9b27c] flex items-center justify-center">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-sm font-bold block ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                      Standard Currency
                    </span>
                    <span className={`text-xs ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                      Indian Rupee (₹) with JetBrains Mono tabular numerics
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#c9b27c]">INR (₹)</span>
              </div>
            </div>
          </div>

          {/* Section 4: Session Control */}
          <div
            className={`p-5 rounded-2xl border border-[#d97070]/30 bg-[#d97070]/5 transition-colors shadow-sm`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#d97070]">
                  Session Control
                </h4>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                  Terminate your active login session and revoke authentication tokens.
                </p>
              </div>

              <button
                type="button"
                onClick={logout}
                className="px-4 py-2.5 rounded-xl bg-[#d97070]/15 hover:bg-[#d97070]/25 text-[#d97070] font-bold text-xs border border-[#d97070]/30 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Session</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL DIALOGS --- */}

      {/* 1. Enable Access Code Modal */}
      {modalType === 'enable' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl transition-colors min-w-0 max-w-full break-words overflow-hidden ${
              isDark ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]' : 'bg-white border-[#e5e3dc] text-[#18181b]'
            }`}
          >
            <div className="flex items-center justify-between mb-4 min-w-0">
              <h3 className="text-base font-bold truncate">Enable Access Code</h3>
              <button type="button" onClick={closeModal} className="p-1 rounded-lg text-[#8a8a93] hover:text-white shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs mb-4 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Create a 4-digit numeric access code (PIN). This code will belong exclusively to your admin account (<span className="font-mono font-bold text-[#c9b27c] break-all">{currentUser?.username}</span>) and is stored securely using bcrypt hashing.
            </p>

            {feedback && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-[#8fb39a]/15 text-[#8fb39a] border border-[#8fb39a]/30'
                    : 'bg-[#d97070]/15 text-[#d97070] border border-[#d97070]/30'
                }`}
              >
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleEnable} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">New 4-Digit Access Code</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="4-digit PIN (e.g. 1234)"
                  className={`w-full h-11 px-3 text-center tracking-[0.3em] rounded-xl border text-base font-mono outline-none focus:border-[#c9b27c] ${
                    isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Confirm 4-Digit Access Code</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="Re-enter 4-digit PIN"
                  className={`w-full h-11 px-3 text-center tracking-[0.3em] rounded-xl border text-base font-mono outline-none focus:border-[#c9b27c] ${
                    isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-[#c9b27c] flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide characters' : 'Show characters'}</span>
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-[#26262b] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#c9b27c] text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Access Code</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Change Access Code Modal */}
      {modalType === 'change' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl transition-colors min-w-0 max-w-full break-words overflow-hidden ${
              isDark ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]' : 'bg-white border-[#e5e3dc] text-[#18181b]'
            }`}
          >
            <div className="flex items-center justify-between mb-4 min-w-0">
              <h3 className="text-base font-bold truncate">Change Access Code</h3>
              <button type="button" onClick={closeModal} className="p-1 rounded-lg text-[#8a8a93] hover:text-white shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-[#8fb39a]/15 text-[#8fb39a] border border-[#8fb39a]/30'
                    : 'bg-[#d97070]/15 text-[#d97070] border border-[#d97070]/30'
                }`}
              >
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleChange} noValidate className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Current 4-Digit Access Code</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentCode}
                  onChange={(e) => setCurrentCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="Enter current PIN"
                  className={`w-full h-11 px-3 text-center tracking-[0.3em] rounded-xl border text-base font-mono outline-none focus:border-[#c9b27c] ${
                    isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">New 4-Digit Access Code</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="New 4-digit PIN"
                  className={`w-full h-11 px-3 text-center tracking-[0.3em] rounded-xl border text-base font-mono outline-none focus:border-[#c9b27c] ${
                    isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Confirm New 4-Digit Access Code</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="Re-enter new 4-digit PIN"
                  className={`w-full h-11 px-3 text-center tracking-[0.3em] rounded-xl border text-base font-mono outline-none focus:border-[#c9b27c] ${
                    isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-[#c9b27c] flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide characters' : 'Show characters'}</span>
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-[#26262b] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#c9b27c] text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Code</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. View / Reset Access Code Modal */}
      {modalType === 'view_reset' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl transition-colors min-w-0 max-w-full break-words overflow-hidden ${
              isDark ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]' : 'bg-white border-[#e5e3dc] text-[#18181b]'
            }`}
          >
            <div className="flex items-center justify-between mb-3 min-w-0">
              <h3 className="text-base font-bold truncate">Access Code Security & Reset</h3>
              <button type="button" onClick={closeModal} className="p-1 rounded-lg text-[#8a8a93] hover:text-white shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cryptographic Security Notice */}
            <div
              className={`p-4 rounded-xl border mb-4 space-y-2 text-xs min-w-0 break-words ${
                isDark ? 'bg-[#0e0e10] border-[#c9b27c]/40 text-[#8a8a93]' : 'bg-[#faf9f6] border-[#c9b27c]/40 text-[#71717a]'
              }`}
            >
              <div className="flex items-center gap-2 text-[#c9b27c] font-bold">
                <Lock className="w-4 h-4 shrink-0" />
                <span>One-Way Cryptographic Security</span>
              </div>
              <p>
                To strictly adhere to bank-grade security principles, access codes are stored with irreversible <span className="font-mono text-[#c9b27c]">bcrypt</span> password-hashing. Plaintext codes are never stored or recoverable.
              </p>
              <p className="text-[11px] font-medium text-[#c9b27c]">
                If you have forgotten or need to change your access code, authenticate with your account password below to reset it immediately.
              </p>
            </div>

            {feedback && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-[#8fb39a]/15 text-[#8fb39a] border border-[#8fb39a]/30'
                    : 'bg-[#d97070]/15 text-[#d97070] border border-[#d97070]/30'
                }`}
              >
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleReset} noValidate className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Account Password (for verification)</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  placeholder="Enter login password"
                  className={`w-full h-11 px-3 rounded-xl border text-sm outline-none focus:border-[#c9b27c] ${
                    isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">New Access Code (4 digits)</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  inputMode="numeric"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  placeholder="4-digit PIN"
                  className={`w-full h-11 px-3 rounded-xl border text-sm font-mono tracking-widest outline-none focus:border-[#c9b27c] ${
                    isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Confirm New Access Code</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  inputMode="numeric"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  placeholder="Re-enter 4-digit PIN"
                  className={`w-full h-11 px-3 rounded-xl border text-sm font-mono tracking-widest outline-none focus:border-[#c9b27c] ${
                    isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-[#c9b27c] flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide password' : 'Show password'}</span>
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-[#26262b] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#c9b27c] text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Reset & Save</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Disable Access Code Modal */}
      {modalType === 'disable' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl transition-colors min-w-0 max-w-full break-words overflow-hidden ${
              isDark ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]' : 'bg-white border-[#e5e3dc] text-[#18181b]'
            }`}
          >
            <div className="flex items-center justify-between mb-4 min-w-0">
              <h3 className="text-base font-bold text-[#d97070] truncate">Disable Access Code</h3>
              <button type="button" onClick={closeModal} className="p-1 rounded-lg text-[#8a8a93] hover:text-white shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs mb-4 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Disable access code authentication. Please authenticate with your current access code or account password to confirm.
            </p>

            {feedback && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-[#8fb39a]/15 text-[#8fb39a] border border-[#8fb39a]/30'
                    : 'bg-[#d97070]/15 text-[#d97070] border border-[#d97070]/30'
                }`}
              >
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleDisable} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Current Access Code (4 digits)</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  inputMode="numeric"
                  value={currentCode}
                  onChange={(e) => setCurrentCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  placeholder="Enter 4-digit PIN"
                  className={`w-full h-11 px-3 rounded-xl border text-sm font-mono tracking-widest outline-none focus:border-[#c9b27c] ${
                    isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
                  }`}
                />
              </div>

              <div className="text-center text-xs text-[#8a8a93]">- OR -</div>

              <div>
                <label className="block text-xs font-semibold mb-1">Account Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  placeholder="Enter account password"
                  className={`w-full h-11 px-3 rounded-xl border text-sm outline-none focus:border-[#c9b27c] ${
                    isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
                  }`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-[#26262b] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#d97070] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm Disable</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Profile Picture Selection Modal */}
      <ProfilePictureModal
        isOpen={isPictureModalOpen}
        onClose={() => setIsPictureModalOpen(false)}
        currentImage={currentUser?.profileImage || currentUser?.avatar}
        onSave={handleSaveProfilePicture}
      />
    </div>
  );
}
