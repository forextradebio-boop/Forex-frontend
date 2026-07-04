import React from 'react';
import { UserProfile } from '../types';
import { BadgeCheck, User as UserIcon, Calendar, CheckCircle2 } from 'lucide-react';

interface Props {
  profile: UserProfile;
  onEditClick: () => void;
}

export default function ProfileCard({ profile, onEditClick }: Props) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  };

  const joinDate = new Date(profile.createdAt).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all duration-500"></div>

      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start relative z-10">
        
        {/* Avatar */}
        <div className="relative">
          {profile.avatar ? (
            <img 
              src={profile.avatar} 
              alt={profile.name} 
              className="w-24 h-24 rounded-full border-4 border-zinc-900 object-cover shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-zinc-900 bg-zinc-800 flex items-center justify-center shadow-xl text-3xl font-black text-zinc-500">
              {getInitials(profile.name)}
            </div>
          )}
          <div className="absolute -bottom-2 -right-2 bg-zinc-900 rounded-full p-1 border border-zinc-800" title="Verified Account">
            <CheckCircle2 className="w-6 h-6 fill-teal-500 text-black" />
          </div>
        </div>

        {/* Info Container */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center md:justify-start gap-2">
                {profile.name}
              </h2>
              <p className="text-zinc-400 font-mono text-sm mt-1">@{profile.username || 'user'}</p>
              <p className="text-zinc-400 font-mono text-sm mt-1">{profile.email}</p>
            </div>
            
            <button 
              onClick={onEditClick}
              className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-teal-500/50 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              Edit Profile
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
            <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
              <div className="text-zinc-500 font-bold mb-1 uppercase tracking-wider text-[10px]">Account ID</div>
              <div className="text-zinc-200 font-mono truncate">{profile._id.substring(0, 8).toUpperCase()}</div>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
              <div className="text-zinc-500 font-bold mb-1 uppercase tracking-wider text-[10px]">Status</div>
              <div className="text-teal-400 font-bold flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></div> Active
              </div>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
              <div className="text-zinc-500 font-bold mb-1 uppercase tracking-wider text-[10px]">Country</div>
              <div className="text-zinc-200 font-bold truncate">{profile.country || 'Not Set'}</div>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
              <div className="text-zinc-500 font-bold mb-1 uppercase tracking-wider text-[10px]">Phone Number</div>
              <div className="text-zinc-200 font-bold truncate">{profile.phone || 'Not Set'}</div>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
              <div className="text-zinc-500 font-bold mb-1 uppercase tracking-wider text-[10px]">KYC Status</div>
              <div className="text-teal-400 font-bold truncate">{profile.kycStatus || 'UNSUBMITTED'}</div>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
              <div className="text-zinc-500 font-bold mb-1 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Joined
              </div>
              <div className="text-zinc-200 font-bold">{joinDate}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
