import React from 'react';
import { UserProfile } from '../types';
import { BadgeCheck, User as UserIcon, Calendar, CheckCircle2 } from 'lucide-react';

interface Props {
  profile: UserProfile;
  wallet?: {
    balance?: number;
    equity?: number;
    margin?: number;
    freeMargin?: number;
    pnl?: number;
  };
  onEditClick: () => void;
}

export default function ProfileCard({ profile, wallet, onEditClick }: Props) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  };

  const joinDate = new Date(profile.createdAt).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="bg-lb-panel border border-lb-border rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-lb-accent/10 rounded-full blur-3xl group-hover:bg-lb-accent/20 transition-all duration-500"></div>

      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start relative z-10">
        
        {/* Avatar */}
        <div className="relative">
          {profile.avatar ? (
            <img 
              src={profile.avatar} 
              alt={profile.name} 
              className="w-24 h-24 rounded-full border-4 border-lb-bg object-cover shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-lb-bg bg-lb-panel-hover flex items-center justify-center shadow-xl text-3xl font-black text-lb-text-muted">
              {getInitials(profile.name)}
            </div>
          )}
          <div className="absolute -bottom-2 -right-2 bg-lb-bg rounded-full p-1 border border-lb-border" title="Verified Account">
            <CheckCircle2 className="w-6 h-6 fill-lb-accent text-lb-bg" />
          </div>
        </div>

        {/* Info Container */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-lb-text tracking-tight flex items-center justify-center md:justify-start gap-2">
                {profile.name}
              </h2>
              <p className="text-lb-text-muted font-mono text-sm mt-1">@{profile.username || 'user'}</p>
              <p className="text-lb-text-muted font-mono text-sm mt-1">{profile.email || 'Email not set'}</p>
            </div>
            
            <button 
              onClick={onEditClick}
              className="px-6 py-2 bg-lb-bg hover:bg-lb-panel-hover border border-lb-border hover:border-lb-accent/50 text-lb-text font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              Edit Profile
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-4 text-xs">
            <div className="bg-lb-bg/50 rounded-lg p-3 border border-lb-border/50">
              <div className="text-lb-text-muted font-bold mb-1 uppercase tracking-wider text-[10px]">Account ID</div>
              <div className="text-lb-text font-mono truncate">{profile._id.substring(0, 8).toUpperCase()}</div>
            </div>
            <div className="bg-lb-bg/50 rounded-lg p-3 border border-lb-border/50">
              <div className="text-lb-text-muted font-bold mb-1 uppercase tracking-wider text-[10px]">Balance</div>
              <div className="text-lb-accent font-bold truncate">${wallet?.balance?.toFixed(2) ?? '0.00'}</div>
            </div>
            <div className="bg-lb-bg/50 rounded-lg p-3 border border-lb-border/50">
              <div className="text-lb-text-muted font-bold mb-1 uppercase tracking-wider text-[10px]">Equity</div>
              <div className="text-lb-text font-bold truncate">${wallet?.equity?.toFixed(2) ?? '0.00'}</div>
            </div>
            <div className="bg-lb-bg/50 rounded-lg p-3 border border-lb-border/50">
              <div className="text-lb-text-muted font-bold mb-1 uppercase tracking-wider text-[10px]">Country</div>
              <div className="text-lb-text font-bold truncate">{profile.country || 'Not Set'}</div>
            </div>
            <div className="bg-lb-bg/50 rounded-lg p-3 border border-lb-border/50">
              <div className="text-lb-text-muted font-bold mb-1 uppercase tracking-wider text-[10px]">Phone Number</div>
              <div className="text-lb-text font-bold truncate">{profile.phone || 'Not Set'}</div>
            </div>
            <div className="bg-lb-bg/50 rounded-lg p-3 border border-lb-border/50">
              <div className="text-lb-text-muted font-bold mb-1 uppercase tracking-wider text-[10px]">KYC Status</div>
              <div className="text-lb-accent font-bold truncate">{profile.kycStatus || 'UNSUBMITTED'}</div>
            </div>
            <div className="bg-lb-bg/50 rounded-lg p-3 border border-lb-border/50 md:col-span-2">
              <div className="text-lb-text-muted font-bold mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Joined
              </div>
              <div className="text-lb-text font-bold">{joinDate}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
