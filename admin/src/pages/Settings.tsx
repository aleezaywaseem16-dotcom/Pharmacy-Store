import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';

export default function Settings() {
  const { user, setAuth, accessToken } = useAuthStore();
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (user) {
      setProfileForm({ firstName: user.firstName, lastName: user.lastName, phone: '' });
    }
  }, [user]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.patch('/auth/me', profileForm);
      if (accessToken) setAuth(data.data, accessToken);
      toast.success('Profile updated');
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed');
    } finally { setSavingProfile(false); }
  }

  async function handlePwSave(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSavingPw(true);
    try {
      await api.patch('/auth/me/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed. Please login again.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed');
    } finally { setSavingPw(false); }
  }

  const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500";

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your admin profile and security</p>
      </div>

      {/* Profile Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <p className="font-semibold text-white text-lg">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <span className={`text-xs px-2 py-0.5 rounded border mt-1 inline-block ${
              user?.role === 'SUPER_ADMIN' ? 'text-violet-400 border-violet-800 bg-violet-900/30' :
              'text-blue-400 border-blue-800 bg-blue-900/30'
            }`}>{user?.role}</span>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Profile Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">First Name</label>
              <input value={profileForm.firstName} onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Last Name</label>
              <input value={profileForm.lastName} onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1">Phone</label>
              <input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <button type="submit" disabled={savingProfile} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {savingProfile ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Security Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">Change Password</h2>
        <form onSubmit={handlePwSave} className="space-y-4">
          {[
            { key: 'currentPassword', label: 'Current Password' },
            { key: 'newPassword', label: 'New Password' },
            { key: 'confirmPassword', label: 'Confirm New Password' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
              <input
                type="password"
                value={(pwForm as Record<string, string>)[key]}
                onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                className={inputCls}
                autoComplete="new-password"
              />
            </div>
          ))}
          <button type="submit" disabled={savingPw} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {savingPw ? 'Changing…' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Account Info</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-400">Email</dt>
            <dd className="text-white">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-400">Role</dt>
            <dd className="text-white">{user?.role}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-400">Email Verified</dt>
            <dd className={user?.isVerified ? 'text-emerald-400' : 'text-amber-400'}>{user?.isVerified ? '✓ Verified' : '✗ Not verified'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
