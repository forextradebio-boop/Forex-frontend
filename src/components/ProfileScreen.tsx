import React, { useState } from 'react';
import { 
  User, Shield, Bell, Lock, UserCheck, HelpCircle, LogOut,
  ChevronRight, RefreshCw, AlertCircle, X, Check,
  Smartphone, History
} from 'lucide-react';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import ProfileCard from './ProfileCard';
import { useAuth } from '../contexts/AuthContext';
import KycScreen from './KycScreen';

export default function ProfileScreen() {
  const { data: profile, isLoading, isError, refetch, isFetching } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const { logout } = useAuth();

  const [activeView, setActiveView] = useState<'profile' | 'kyc'>('profile');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    country: '',
    avatar: ''
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenEdit = () => {
    if (profile) {
      setEditForm({
        name: profile.name,
        phone: profile.phone || '',
        country: profile.country || '',
        avatar: profile.avatar || ''
      });
      setIsEditModalOpen(true);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(editForm, {
      onSuccess: () => {
        setIsEditModalOpen(false);
        showToast("Profile updated successfully");
      },
      onError: () => {
        showToast("Failed to update profile");
      }
    });
  };

  const settingsLinks = [
    { id: 'personal', icon: User, label: 'Personal Information', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 'security', icon: Shield, label: 'Security & Password', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { id: 'notifications', icon: Bell, label: 'Notifications', color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { id: 'privacy', icon: Lock, label: 'Privacy Settings', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { id: 'kyc', icon: UserCheck, label: 'KYC Verification', color: 'text-teal-400', bg: 'bg-teal-400/10' },
    { id: 'support', icon: HelpCircle, label: 'Help & Support', color: 'text-rose-400', bg: 'bg-rose-400/10' },
  ];

  if (isError) {
    return (
      <div className="flex flex-col h-full bg-[#09090b] items-center justify-center p-6">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 max-w-md w-full flex flex-col items-center text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-16 h-16 text-rose-500" />
          <div>
            <h3 className="text-rose-400 font-black text-xl mb-2">Profile Unavailable</h3>
            <p className="text-zinc-400 text-sm">We couldn't securely load your profile data. Please verify your connection.</p>
          </div>
          <button 
            onClick={() => refetch()}
            className="mt-4 bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 rounded-xl font-bold text-sm transition shadow-lg w-full"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="flex flex-col h-full bg-[#09090b] p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-8 animate-pulse">
        <div className="h-48 bg-zinc-900 rounded-2xl border border-zinc-800"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-zinc-900 rounded-xl border border-zinc-800"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#09090b] font-sans text-zinc-300 relative overflow-y-auto">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-teal-500 text-black px-6 py-3 rounded-xl shadow-2xl font-bold text-sm animate-bounce flex items-center gap-2 border border-teal-400">
          <Check className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md p-4 lg:px-8 sticky top-0 z-10 flex items-center justify-between">
        <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
          {activeView === 'kyc' ? (
            <>
              <button onClick={() => setActiveView('profile')} className="hover:text-teal-500 mr-2"><ChevronRight className="w-5 h-5 rotate-180" /></button>
              <UserCheck className="w-5 h-5 text-teal-500" /> KYC Verification
            </>
          ) : (
            <><User className="w-5 h-5 text-teal-500" /> My Profile</>
          )}
        </h2>
        <button 
          onClick={() => refetch()}
          className={`p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors ${isFetching ? 'animate-spin text-teal-400' : ''}`}
          title="Refresh Profile"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 lg:p-8 max-w-4xl mx-auto w-full space-y-8">
        
        {/* Top Profile Card */}
        <ProfileCard profile={profile} onEditClick={handleOpenEdit} />

        {/* Settings Menu */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/30">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-2">Preferences & Settings</h3>
          </div>
          
          <div className="divide-y divide-zinc-800/50">
            {settingsLinks.map((link) => (
              <button 
                key={link.id}
                onClick={() => {
                  if (link.id === 'kyc') setActiveView('kyc');
                  else showToast(`Opening ${link.label} (Coming Soon)`);
                }}
                className="w-full flex items-center justify-between p-5 hover:bg-zinc-900/50 transition-colors group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${link.bg} border border-zinc-800/50`}>
                    <link.icon className={`w-5 h-5 ${link.color}`} />
                  </div>
                  <span className="font-bold text-zinc-200 group-hover:text-white transition-colors">{link.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-teal-500 transition-colors" />
              </button>
            ))}

            {/* Logout Button */}
            <button 
              onClick={() => {
                if(window.confirm("Are you sure you want to log out securely?")) {
                  logout();
                }
              }}
              className="w-full flex items-center justify-between p-5 hover:bg-rose-500/5 transition-colors group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <LogOut className="w-5 h-5 text-rose-500" />
                </div>
                <span className="font-bold text-rose-500 group-hover:text-rose-400 transition-colors">Secure Logout</span>
              </div>
            </button>
          </div>
        </div>

      </div>

      {activeView === 'kyc' && (
        <div className="absolute inset-0 top-[73px] bg-[#09090b] z-20 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-4xl mx-auto w-full">
             <button onClick={() => setActiveView('profile')} className="mb-6 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-bold text-sm">
               <ChevronRight className="w-4 h-4 rotate-180" /> Back to Profile
             </button>
             <KycScreen />
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 relative shadow-2xl">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-6">
              <h2 className="text-xl font-black text-white">Edit Profile</h2>
              <p className="text-xs text-zinc-500 mt-1">Update your personal trading credentials.</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={profile.email} 
                  disabled
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-500 cursor-not-allowed font-mono"
                  title="Email cannot be changed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Phone Number</label>
                <input 
                  type="text" 
                  value={editForm.phone}
                  onChange={e => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all font-mono"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Country</label>
                <input 
                  type="text" 
                  value={editForm.country}
                  onChange={e => setEditForm({...editForm, country: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all"
                  placeholder="United Kingdom"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Avatar URL</label>
                <input 
                  type="url" 
                  value={editForm.avatar}
                  onChange={e => setEditForm({...editForm, avatar: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all font-mono"
                  placeholder="https://example.com/avatar.png"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black font-black rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {updateProfileMutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
