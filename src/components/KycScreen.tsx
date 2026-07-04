import React, { useState } from 'react';
import { useKyc, useSubmitKyc } from '../hooks/useKyc';
import { ShieldCheck, UploadCloud, AlertCircle, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';

export default function KycScreen() {
  const { data: kyc, isLoading, isError, refetch } = useKyc();
  const submitKycMutation = useSubmitKyc();

  const [form, setForm] = useState({
    documentType: 'AADHAR',
    documentNumber: '',
    fullName: '',
    dob: '',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [documents, setDocuments] = useState([
    { type: 'FRONT_SIDE', url: '' },
    { type: 'BACK_SIDE', url: '' },
    { type: 'SELFIE', url: '' },
  ]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (documents.some(d => !d.url)) {
      setErrorMsg("Please upload all required documents (Front, Back, and Selfie URLs)");
      return;
    }

    submitKycMutation.mutate(
      { ...form, documents },
      {
        onSuccess: () => {
          setToastMessage("KYC Submitted Successfully!");
          setTimeout(() => setToastMessage(null), 3000);
        },
        onError: (err: any) => {
          setErrorMsg(err.response?.data?.error || "Failed to submit KYC");
        }
      }
    );
  };

  const handleDocUrlChange = (index: number, url: string) => {
    const newDocs = [...documents];
    newDocs[index].url = url;
    setDocuments(newDocs);
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-zinc-950 border border-zinc-800 rounded-2xl">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
        <p className="text-zinc-400 text-sm">Failed to load KYC status.</p>
        <button onClick={() => refetch()} className="mt-4 text-teal-400 font-bold text-xs hover:underline">Retry</button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-2xl mx-auto w-full">
        <div className="h-32 bg-zinc-900 rounded-2xl border border-zinc-800"></div>
        <div className="h-96 bg-zinc-900 rounded-2xl border border-zinc-800"></div>
      </div>
    );
  }

  const isSubmitted = kyc && kyc.status !== 'NOT_SUBMITTED';
  const statusColor = kyc?.status === 'APPROVED' ? 'text-teal-400 bg-teal-400/10 border-teal-400/20' :
                      kyc?.status === 'REJECTED' ? 'text-rose-400 bg-rose-400/10 border-rose-400/20' :
                      'text-amber-400 bg-amber-400/10 border-amber-400/20';
  const StatusIcon = kyc?.status === 'APPROVED' ? CheckCircle2 :
                     kyc?.status === 'REJECTED' ? XCircle : Clock;

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-teal-500 text-black px-6 py-3 rounded-xl shadow-2xl font-bold text-sm animate-bounce flex items-center gap-2 border border-teal-400">
          <CheckCircle2 className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      {/* Header / Status Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full ${statusColor.split(' ')[1]}`}></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-8 h-8 text-teal-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-white">Identity Verification</h2>
            <p className="text-xs text-zinc-500 mt-1">Required for deposits and withdrawals.</p>
          </div>
          {isSubmitted && (
            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${statusColor}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="font-bold text-xs tracking-wider">{kyc.status}</span>
            </div>
          )}
        </div>
      </div>

      {isSubmitted && kyc?.status === 'REJECTED' && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5" />
          <div>
            <p className="text-rose-500 font-bold text-sm">Verification Rejected</p>
            <p className="text-rose-400/70 text-xs mt-1">{kyc.rejectionReason || "Your documents did not meet the guidelines. Please resubmit."}</p>
            <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-lg transition-colors">
              Submit New Documents
            </button>
          </div>
        </div>
      )}

      {/* Form or Preview */}
      {(!isSubmitted || kyc?.status === 'REJECTED') ? (
        <form onSubmit={handleSubmit} className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-zinc-800/50 pb-4">Personal Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Full Name (As per ID)</label>
              <input type="text" required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 outline-none transition-all" placeholder="John Doe" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Date of Birth</label>
              <input type="date" required value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Document Type</label>
              <select value={form.documentType} onChange={e => setForm({...form, documentType: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 outline-none transition-all">
                <option value="AADHAR">Aadhaar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="PASSPORT">Passport</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Document Number</label>
              <input type="text" required value={form.documentNumber} onChange={e => setForm({...form, documentNumber: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 outline-none transition-all font-mono" placeholder="ABCD123456" />
            </div>
          </div>

          <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-zinc-800/50 pb-4 pt-4">Upload Documents</h3>
          
          <div className="space-y-4">
            {documents.map((doc, idx) => (
              <div key={idx} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2 block">{doc.type.replace('_', ' ')} (Image URL)</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input type="url" required value={doc.url} onChange={e => handleDocUrlChange(idx, e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-300 outline-none focus:border-teal-500" placeholder="https://..." />
                  </div>
                  {doc.url && <div className="w-10 h-10 rounded overflow-hidden border border-zinc-800 bg-black flex-shrink-0"><img src={doc.url} alt="" className="w-full h-full object-cover" /></div>}
                </div>
              </div>
            ))}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-500 text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {errorMsg}
            </div>
          )}

          <button type="submit" disabled={submitKycMutation.isPending} className="w-full py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black font-black rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)]">
            {submitKycMutation.isPending ? 'Uploading...' : 'Submit Documents'}
          </button>
        </form>
      ) : (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
          <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-zinc-800/50 pb-4 mb-6">Submitted Information</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Name</div>
              <div className="text-sm font-bold text-white truncate">{kyc?.fullName}</div>
            </div>
            <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Type</div>
              <div className="text-sm font-bold text-white truncate">{kyc?.documentType}</div>
            </div>
            <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Number</div>
              <div className="text-sm font-bold text-white font-mono truncate">{kyc?.documentNumber}</div>
            </div>
            <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Submitted On</div>
              <div className="text-sm font-bold text-zinc-300 truncate">{new Date(kyc?.createdAt || Date.now()).toLocaleDateString()}</div>
            </div>
          </div>

          <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-zinc-800/50 pb-4 mb-6">Document Previews</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {kyc?.documents.map((doc, idx) => (
              <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 relative group overflow-hidden">
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-zinc-300 uppercase tracking-widest z-10 border border-zinc-800/50">
                  {doc.type.replace('_', ' ')}
                </div>
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                  {doc.url ? (
                    <img src={doc.url} alt={doc.type} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <FileText className="w-8 h-8 text-zinc-700" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
        </div>
      )}
    </div>
  );
}
