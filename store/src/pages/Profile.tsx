import { useEffect, useState } from 'react';
import { User, Lock, Save } from 'lucide-react';
import api, { showError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
import { PageSpinner } from '@/components/ui/Spinner';
import { toast } from 'sonner';

export default function Profile() {
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (user) setForm({ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? '' });
  }, [isAuthenticated, user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.patch('/auth/me', form);
      updateUser(data.data);
      toast.success('Profile updated');
    } catch (e) { showError(e); }
    finally { setSavingProfile(false); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSavingPw(true);
    try {
      await api.patch('/auth/me/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed');
    } catch (e) { showError(e); }
    finally { setSavingPw(false); }
  };

  if (!user) return <PageSpinner />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Profile</h1>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8 bg-white rounded-2xl border border-slate-100 p-5">
        <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {user.firstName[0]}{user.lastName[0]}
        </div>
        <div>
          <p className="font-bold text-slate-800 text-lg">{user.firstName} {user.lastName}</p>
          <p className="text-slate-500 text-sm">{user.email}</p>
          <span className="inline-block mt-1 text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
            {user.role}
          </span>
        </div>
      </div>

      {/* Edit profile */}
      <form onSubmit={saveProfile} className="bg-white rounded-2xl border border-slate-100 p-5 mb-5">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600" /> Personal Information
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-slate-600 mb-1 block">First Name</label>
            <input
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Last Name</label>
            <input
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 transition-colors"
              required
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-xs text-slate-600 mb-1 block">Email</label>
          <input value={user.email} disabled className="w-full border border-slate-100 rounded-xl px-3 py-2.5 text-sm bg-slate-50 text-slate-500 cursor-not-allowed" />
        </div>
        <div className="mb-4">
          <label className="text-xs text-slate-600 mb-1 block">Phone Number</label>
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+92 300 0000000"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={savingProfile}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {savingProfile ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={changePassword} className="bg-white rounded-2xl border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-600" /> Change Password
        </h2>
        {[
          { label: 'Current Password', key: 'currentPassword' as const },
          { label: 'New Password', key: 'newPassword' as const },
          { label: 'Confirm New Password', key: 'confirmPassword' as const },
        ].map(({ label, key }) => (
          <div key={key} className="mb-4">
            <label className="text-xs text-slate-600 mb-1 block">{label}</label>
            <input
              type="password"
              value={pwForm[key]}
              onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 transition-colors"
              required
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={savingPw}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
        >
          <Lock className="w-4 h-4" />
          {savingPw ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
