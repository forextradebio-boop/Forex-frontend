import React, { useState } from 'react';
import { 
  User, Shield, Bell, Lock, UserCheck, HelpCircle, LogOut,
  ChevronRight, RefreshCw, AlertCircle, X, Check,
  Smartphone, History
} from 'lucide-react';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import { useWallet } from '../hooks/useWallet';
import ProfileCard from './ProfileCard';
import { useAuth } from '../contexts/AuthContext';
import KycScreen from './KycScreen';

export default function ProfileScreen() {
  const { data: profile, isLoading, isError, refetch, isFetching } = useProfile();
  const { data: walletData } = useWallet();
  const updateProfileMutation = useUpdateProfile();
  const { logout } = useAuth();

  const [activeView, setActiveView] = useState<'profile' | 'personal' | 'security' | 'kyc'>('profile');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    country: '',
    avatar: '',
    email: ''
  });
  const [securityForm, setSecurityForm] = useState({
    username: '',
    newPassword: '',
    confirmPassword: ''
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
        avatar: profile.avatar || '',
        email: profile.email || ''
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

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityForm.username.trim()) {
      showToast('Username cannot be empty');
      return;
    }
    if (securityForm.newPassword && securityForm.newPassword !== securityForm.confirmPassword) {
      showToast('Passwords do not match');
      return;
    }

    const payload: any = { username: securityForm.username.trim() };
    if (securityForm.newPassword) {
      payload.password = securityForm.newPassword;
    }

    updateProfileMutation.mutate(payload, {
      onSuccess: () => {
        setActiveView('profile');
        setSecurityForm({ ...securityForm, newPassword: '', confirmPassword: '' });
        showToast('Security settings updated successfully');
      },
      onError: () => {
        showToast('Failed to update security settings');
      }
    });
  };

  React.useEffect(() => {
    if (profile) {
      setSecurityForm(prev => ({
        ...prev,
        username: profile.username || ''
      }));
    }
  }, [profile]);

  const InfoCard = ({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) => (
    <div className={`rounded-3xl border p-4 ${highlight ? 'border-lb-accent/20 bg-lb-accent/5' : 'border-lb-border bg-lb-bg'} shadow-sm`}> 
      <div className="text-[9px] uppercase tracking-[0.32em] text-lb-text-muted mb-2">{label}</div>
      <div className={`text-sm font-bold ${highlight ? 'text-lb-accent' : 'text-lb-text'}`}>{value}</div>
    </div>
  );

  const settingsLinks = [
    { id: 'personal', icon: User, label: 'Personal Information', color: 'text-lb-accent', bg: 'bg-blue-400/10', description: 'View and edit your profile details clearly' },
    { id: 'security', icon: Shield, label: 'Security & Password', color: 'text-emerald-400', bg: 'bg-emerald-400/10', description: 'Change username and password securely' },
    { id: 'kyc', icon: UserCheck, label: 'KYC Verification', color: 'text-lb-accent', bg: 'bg-lb-accent/10', description: 'Complete your verification documentation' },
  ];

  if (isError) {
    return (
      <div className="flex flex-col h-full bg-lb-panel items-center justify-center p-6">
        <div className="bg-lb-down/10 border border-lb-down/20 rounded-2xl p-8 max-w-md w-full flex flex-col items-center text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-16 h-16 text-lb-down" />
          <div>
            <h3 className="text-lb-down font-black text-xl mb-2">Profile Unavailable</h3>
            <p className="text-lb-text-muted text-sm">We couldn't securely load your profile data. Please verify your connection.</p>
          </div>
          <button 
            onClick={() => refetch()}
            className="mt-4 bg-lb-down hover:bg-lb-down/80 text-lb-text px-8 py-3 rounded-xl font-bold text-sm transition shadow-lg w-full"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="flex flex-col h-full bg-lb-panel p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-8 animate-pulse">
        <div className="h-48 bg-lb-bg rounded-2xl border border-lb-border"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-lb-bg rounded-xl border border-lb-border"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-lb-panel font-sans text-lb-text relative overflow-y-auto">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-lb-accent text-lb-bg px-6 py-3 rounded-xl shadow-2xl font-bold text-sm animate-bounce flex items-center gap-2 border border-lb-accent">
          <Check className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-lb-border bg-lb-panel/80 backdrop-blur-md p-4 lg:px-8 sticky top-0 z-10 flex items-center justify-between">
        <h2 className="text-xl font-black text-lb-text tracking-wide flex items-center gap-2">
          {activeView === 'kyc' ? (
            <>
              <button onClick={() => setActiveView('profile')} className="hover:text-lb-accent mr-2"><ChevronRight className="w-5 h-5 rotate-180" /></button>
              <UserCheck className="w-5 h-5 text-lb-accent" /> KYC Verification
            </>
          ) : activeView === 'security' ? (
            <>
              <button onClick={() => setActiveView('profile')} className="hover:text-lb-accent mr-2"><ChevronRight className="w-5 h-5 rotate-180" /></button>
              <Shield className="w-5 h-5 text-lb-accent" /> Security & Password
            </>
          ) : activeView === 'personal' ? (
            <>
              <button onClick={() => setActiveView('profile')} className="hover:text-lb-accent mr-2"><ChevronRight className="w-5 h-5 rotate-180" /></button>
              <User className="w-5 h-5 text-lb-accent" /> Personal Information
            </>
          ) : (
            <>
              <User className="w-5 h-5 text-lb-accent" /> My Profile
            </>
          )}
        </h2>
        <button 
          onClick={() => refetch()}
          className={`p-2 rounded-lg bg-lb-bg hover:bg-lb-panel-hover border border-lb-border text-lb-text-muted hover:text-lb-accent transition-colors ${isFetching ? 'animate-spin text-lb-accent' : ''}`}
          title="Refresh Profile"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 lg:p-8 max-w-4xl mx-auto w-full space-y-8">
        
        {/* Top Profile Card */}
        <ProfileCard profile={profile} wallet={walletData} onEditClick={handleOpenEdit} />

        {/* Settings Menu */}
        <div className="bg-lb-panel border border-lb-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-lb-border bg-lb-bg">
            <h3 className="text-xs font-black text-lb-text-muted uppercase tracking-widest ml-2">Preferences & Settings</h3>
          </div>
          
          <div className="divide-y divide-lb-border">
            {settingsLinks.map((link) => (
              <button 
                key={link.id}
                onClick={() => {
                  if (link.id === 'kyc') setActiveView('kyc');
                  else if (link.id === 'security') setActiveView('security');
                  else if (link.id === 'personal') setActiveView('personal');
                  else setActiveView('profile');
                }}
                className="w-full flex items-center justify-between p-5 hover:bg-lb-panel-hover transition-colors group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${link.bg} border border-lb-border`}>
                    <link.icon className={`w-5 h-5 ${link.color}`} />
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-lb-text group-hover:text-lb-accent transition-colors">{link.label}</span>
                    <p className="text-[11px] text-lb-text-muted">{link.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-lb-text-muted group-hover:text-lb-accent transition-colors" />
              </button>
            ))}

            {/* Logout Button */}
            <button 
              onClick={() => {
                if(window.confirm("Are you sure you want to log out securely?")) {
                  logout();
                }
              }}
              className="w-full flex items-center justify-between p-5 hover:bg-lb-down/10 transition-colors group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-lb-down/10 border border-lb-down/20">
                  <LogOut className="w-5 h-5 text-lb-down" />
                </div>
                <span className="font-bold text-lb-down group-hover:text-lb-down/80 transition-colors">Secure Logout</span>
              </div>
            </button>
          </div>
        </div>

      </div>

      {activeView === 'kyc' && (
        <div className="absolute inset-0 top-[73px] bg-lb-panel z-20 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-4xl mx-auto w-full">
             <button onClick={() => setActiveView('profile')} className="mb-6 flex items-center gap-2 text-lb-text-muted hover:text-lb-accent transition-colors font-bold text-sm">
               <ChevronRight className="w-4 h-4 rotate-180" /> Back to Profile
             </button>
             <KycScreen />
          </div>
        </div>
      )}

      {activeView === 'security' && (
        <div className="absolute inset-0 top-[73px] bg-lb-panel z-20 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-4xl mx-auto w-full">
             <button onClick={() => setActiveView('profile')} className="mb-6 flex items-center gap-2 text-lb-text-muted hover:text-lb-accent transition-colors font-bold text-sm">
               <ChevronRight className="w-4 h-4 rotate-180" /> Back to Profile
             </button>
             <div className="bg-lb-panel border border-lb-border rounded-3xl p-8 shadow-2xl">
               <div className="mb-6">
                 <h3 className="text-2xl font-black text-lb-text">Security & Password</h3>
                 <p className="text-sm text-lb-text-muted mt-2">Update your username and password in one secure place.</p>
               </div>
               <form onSubmit={handleSaveSecurity} className="space-y-5">
                 <div>
                   <label className="text-xs font-bold uppercase tracking-widest text-lb-text-muted">Username</label>
                   <input
                     type="text"
                     value={securityForm.username}
                     onChange={e => setSecurityForm({ ...securityForm, username: e.target.value })}
                     className="mt-2 w-full bg-lb-bg border border-lb-border rounded-2xl px-4 py-3 text-sm text-lb-text focus:outline-none focus:border-lb-accent focus:ring-1 focus:ring-lb-accent/20"
                     placeholder="Enter your username"
                     required
                   />
                 </div>
                 <div>
                   <label className="text-xs font-bold uppercase tracking-widest text-lb-text-muted">New Password</label>
                   <input
                     type="password"
                     value={securityForm.newPassword}
                     onChange={e => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                     className="mt-2 w-full bg-lb-bg border border-lb-border rounded-2xl px-4 py-3 text-sm text-lb-text focus:outline-none focus:border-lb-accent focus:ring-1 focus:ring-lb-accent/20"
                     placeholder="Leave blank to keep current password"
                   />
                 </div>
                 <div>
                   <label className="text-xs font-bold uppercase tracking-widest text-lb-text-muted">Confirm New Password</label>
                   <input
                     type="password"
                     value={securityForm.confirmPassword}
                     onChange={e => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                     className="mt-2 w-full bg-lb-bg border border-lb-border rounded-2xl px-4 py-3 text-sm text-lb-text focus:outline-none focus:border-lb-accent focus:ring-1 focus:ring-lb-accent/20"
                     placeholder="Repeat the new password"
                   />
                 </div>
                 <div className="flex flex-col gap-3 sm:flex-row">
                   <button
                     type="submit"
                     className="flex-1 bg-lb-accent hover:bg-lb-accent/80 text-lb-bg font-bold rounded-2xl py-3 transition-colors"
                   >
                     Save Security Settings
                   </button>
                   <button
                     type="button"
                     onClick={() => setSecurityForm({ username: profile.username || '', newPassword: '', confirmPassword: '' })}
                     className="flex-1 border border-lb-border hover:border-lb-accent text-lb-text-muted hover:text-lb-accent rounded-2xl py-3 transition-colors"
                   >
                     Reset
                   </button>
                 </div>
               </form>
             </div>
          </div>
        </div>
      )}

      {activeView === 'personal' && (
        <div className="absolute inset-0 top-[73px] bg-lb-panel z-20 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-4xl mx-auto w-full">
            <button onClick={() => setActiveView('profile')} className="mb-6 flex items-center gap-2 text-lb-text-muted hover:text-lb-accent transition-colors font-bold text-sm">
              <ChevronRight className="w-4 h-4 rotate-180" /> Back to Profile
            </button>
            <div className="bg-lb-panel border border-lb-border rounded-3xl p-8 shadow-2xl">
              <div className="mb-6">
                <h3 className="text-2xl font-black text-lb-text">Personal Information</h3>
                <p className="text-sm text-lb-text-muted mt-2">Your full profile details in one place.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard label="Full Name" value={profile.name || 'Not set'} />
                <InfoCard label="Username" value={profile.username || 'Not set'} />
                <InfoCard label="Email" value={profile.email || 'Not set'} />
                <InfoCard label="Phone Number" value={profile.phone || 'Not set'} />
                <InfoCard label="Country" value={profile.country || 'Not set'} />
                <InfoCard label="KYC Status" value={profile.kycStatus || 'UNSUBMITTED'} highlight />
                <InfoCard label="Account ID" value={profile._id ? profile._id.substring(0, 12) : 'Not available'} />
                <InfoCard label="Joined" value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Not set'} />
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button onClick={handleOpenEdit} className="flex-1 bg-lb-accent hover:bg-lb-accent/80 text-lb-bg font-bold rounded-2xl py-3 transition-colors">Edit Personal Info</button>
                <button onClick={() => setActiveView('security')} className="flex-1 border border-lb-border hover:border-lb-accent text-lb-text-muted hover:text-lb-accent rounded-2xl py-3 transition-colors">Go to Security</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-lb-panel border border-lb-border rounded-3xl max-w-md w-full p-6 relative shadow-2xl">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 text-lb-text-muted hover:text-lb-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-6">
              <h2 className="text-xl font-black text-lb-text">Edit Profile</h2>
              <p className="text-xs text-lb-text-muted mt-1">Update your personal trading credentials.</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={editForm.email}
                  onChange={e => setEditForm({...editForm, email: e.target.value})}
                  className="w-full bg-lb-bg border border-lb-border rounded-xl px-4 py-3 text-sm text-lb-text focus:outline-none focus:border-lb-accent focus:ring-1 focus:ring-lb-accent/50 transition-all font-mono"
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  required
                  className="w-full bg-lb-bg border border-lb-border rounded-xl px-4 py-3 text-sm text-lb-text focus:outline-none focus:border-lb-accent focus:ring-1 focus:ring-lb-accent/50 transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">Phone Number</label>
                <input 
                  type="text" 
                  value={editForm.phone}
                  onChange={e => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full bg-lb-bg border border-lb-border rounded-xl px-4 py-3 text-sm text-lb-text focus:outline-none focus:border-lb-accent focus:ring-1 focus:ring-lb-accent/50 transition-all font-mono"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">Country</label>
                <input 
                  type="text" 
                  value={editForm.country}
                  onChange={e => setEditForm({...editForm, country: e.target.value})}
                  className="w-full bg-lb-bg border border-lb-border rounded-xl px-4 py-3 text-sm text-lb-text focus:outline-none focus:border-lb-accent focus:ring-1 focus:ring-lb-accent/50 transition-all"
                  placeholder="United Kingdom"
                />
              </div>


              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 bg-lb-bg hover:bg-lb-panel-hover border border-lb-border text-lb-text-muted font-bold rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="flex-1 py-3 bg-lb-accent hover:bg-lb-accent/80 disabled:opacity-50 text-lb-bg font-black rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
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
