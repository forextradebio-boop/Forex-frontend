import React, { useState } from 'react';
import { useKyc, useSubmitKyc } from '../hooks/useKyc';
import { ShieldCheck, UploadCloud, AlertCircle, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';

export default function KycScreen() {
  const { data: kyc, isLoading, isError, refetch } = useKyc();
  const submitKycMutation = useSubmitKyc();

  const [form, setForm] = useState({
    aadharNumber: '',
    aadharDocument: '',
    panNumber: '',
    panDocument: '',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.aadharDocument || !form.panDocument) {
      setErrorMsg("Please provide image URLs for both Aadhaar and PAN cards.");
      return;
    }

    submitKycMutation.mutate(
      form,
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

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-lb-panel border border-lb-border rounded-2xl">
        <AlertCircle className="w-10 h-10 text-lb-down mb-2" />
        <p className="text-lb-text-muted text-sm">Failed to load KYC status.</p>
        <button onClick={() => refetch()} className="mt-4 text-lb-accent font-bold text-xs hover:underline">Retry</button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-2xl mx-auto w-full">
        <div className="h-32 bg-lb-bg rounded-2xl border border-lb-border"></div>
        <div className="h-96 bg-lb-bg rounded-2xl border border-lb-border"></div>
      </div>
    );
  }

  const isSubmitted = kyc && kyc.status !== 'UNSUBMITTED';
  const statusColor = kyc?.status === 'APPROVED' ? 'text-lb-accent bg-lb-accent/10 border-lb-accent/20' :
                      kyc?.status === 'REJECTED' ? 'text-lb-down bg-lb-down/10 border-lb-down/20' :
                      'text-amber-400 bg-amber-400/10 border-amber-400/20';
  const StatusIcon = kyc?.status === 'APPROVED' ? CheckCircle2 :
                     kyc?.status === 'REJECTED' ? XCircle : Clock;

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6 relative pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-lb-accent text-lb-bg px-6 py-3 rounded-xl shadow-2xl font-bold text-sm animate-bounce flex items-center gap-2 border border-lb-accent">
          <CheckCircle2 className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      {/* Header / Status Card */}
      <div className="bg-lb-panel border border-lb-border rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full ${statusColor.split(' ')[1]}`}></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-lb-bg border border-lb-border flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-8 h-8 text-lb-accent" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-lb-text">Identity Verification</h2>
            <p className="text-xs text-lb-text-muted mt-1">Required for deposits and withdrawals.</p>
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
        <div className="p-4 bg-lb-down/10 border border-lb-down/30 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-lb-down mt-0.5" />
          <div>
            <p className="text-lb-down font-bold text-sm">Verification Rejected</p>
            <p className="text-lb-down/80 text-xs mt-1">{kyc.adminNotes || "Your documents did not meet the guidelines. Please resubmit."}</p>
            <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 bg-lb-down hover:bg-lb-down/80 text-lb-text font-bold text-xs rounded-lg transition-colors">
              Submit New Documents
            </button>
          </div>
        </div>
      )}

      {/* Form or Preview */}
      {(!isSubmitted || kyc?.status === 'REJECTED') ? (
        <form onSubmit={handleSubmit} className="bg-lb-panel border border-lb-border rounded-3xl p-6 shadow-2xl space-y-6">
          <h3 className="text-sm font-black text-lb-text uppercase tracking-wider border-b border-lb-border/50 pb-4">Government ID Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">Aadhaar Number</label>
              <input type="text" required value={form.aadharNumber} onChange={e => setForm({...form, aadharNumber: e.target.value})} className="w-full bg-lb-bg border border-lb-border rounded-xl px-4 py-3 text-sm text-lb-text focus:border-lb-accent focus:ring-1 focus:ring-lb-accent/50 outline-none transition-all font-mono" placeholder="1234 5678 9012" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">PAN Number</label>
              <input type="text" required value={form.panNumber} onChange={e => setForm({...form, panNumber: e.target.value})} className="w-full bg-lb-bg border border-lb-border rounded-xl px-4 py-3 text-sm text-lb-text focus:border-lb-accent focus:ring-1 focus:ring-lb-accent/50 outline-none transition-all font-mono" placeholder="ABCDE1234F" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">Aadhaar Image URL</label>
              <input type="url" required value={form.aadharDocument} onChange={e => setForm({...form, aadharDocument: e.target.value})} className="w-full bg-lb-bg border border-lb-border rounded-xl px-4 py-3 text-sm text-lb-text focus:border-lb-accent focus:ring-1 focus:ring-lb-accent/50 outline-none transition-all" placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">PAN Image URL</label>
              <input type="url" required value={form.panDocument} onChange={e => setForm({...form, panDocument: e.target.value})} className="w-full bg-lb-bg border border-lb-border rounded-xl px-4 py-3 text-sm text-lb-text focus:border-lb-accent focus:ring-1 focus:ring-lb-accent/50 outline-none transition-all" placeholder="https://..." />
            </div>
          </div>

          <h3 className="text-sm font-black text-lb-text uppercase tracking-wider border-b border-lb-border/50 pb-4 pt-4">Bank Account Details</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">Account Holder Name</label>
              <input type="text" required value={form.accountHolderName} onChange={e => setForm({...form, accountHolderName: e.target.value})} className="w-full bg-lb-bg border border-lb-border rounded-xl px-4 py-3 text-sm text-lb-text focus:border-lb-accent focus:ring-1 focus:ring-lb-accent/50 outline-none transition-all" placeholder="John Doe" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">Bank Name</label>
              <input type="text" required value={form.bankName} onChange={e => setForm({...form, bankName: e.target.value})} className="w-full bg-lb-bg border border-lb-border rounded-xl px-4 py-3 text-sm text-lb-text focus:border-lb-accent focus:ring-1 focus:ring-lb-accent/50 outline-none transition-all" placeholder="e.g. HDFC Bank" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">Account Number</label>
              <input type="text" required value={form.accountNumber} onChange={e => setForm({...form, accountNumber: e.target.value})} className="w-full bg-lb-bg border border-lb-border rounded-xl px-4 py-3 text-sm text-lb-text focus:border-lb-accent focus:ring-1 focus:ring-lb-accent/50 outline-none transition-all font-mono" placeholder="1234567890" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider">IFSC Code</label>
              <input type="text" required value={form.ifscCode} onChange={e => setForm({...form, ifscCode: e.target.value})} className="w-full bg-lb-bg border border-lb-border rounded-xl px-4 py-3 text-sm text-lb-text focus:border-lb-accent focus:ring-1 focus:ring-lb-accent/50 outline-none transition-all font-mono" placeholder="HDFC0001234" />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-lb-down/10 border border-lb-down/30 rounded-lg text-lb-down text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {errorMsg}
            </div>
          )}

          <button type="submit" disabled={submitKycMutation.isPending} className="w-full py-4 bg-lb-accent hover:bg-lb-accent/80 disabled:opacity-50 text-lb-bg font-black rounded-xl text-sm transition-all shadow-sm">
            {submitKycMutation.isPending ? 'Uploading...' : 'Submit Verification'}
          </button>
        </form>
      ) : (
        <div className="bg-lb-panel border border-lb-border rounded-3xl p-6 shadow-2xl">
          <h3 className="text-sm font-black text-lb-text uppercase tracking-wider border-b border-lb-border/50 pb-4 mb-6">Submitted Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-lb-bg rounded-xl p-3 border border-lb-border">
              <div className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider mb-1">Aadhaar Number</div>
              <div className="text-sm font-bold text-lb-text font-mono truncate">{kyc?.aadharNumber || "N/A"}</div>
            </div>
            <div className="bg-lb-bg rounded-xl p-3 border border-lb-border">
              <div className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider mb-1">PAN Number</div>
              <div className="text-sm font-bold text-lb-text font-mono truncate">{kyc?.panNumber || "N/A"}</div>
            </div>
            <div className="bg-lb-bg rounded-xl p-3 border border-lb-border md:col-span-2">
              <div className="text-[10px] text-lb-text-muted font-bold uppercase tracking-wider mb-1">Bank Details</div>
              <div className="text-sm font-bold text-lb-text truncate">
                {kyc?.bankName} - {kyc?.accountNumber} ({kyc?.ifscCode})
              </div>
              <div className="text-xs text-lb-text-muted truncate mt-1">Holder: {kyc?.accountHolderName}</div>
            </div>
          </div>

          <h3 className="text-sm font-black text-lb-text uppercase tracking-wider border-b border-lb-border/50 pb-4 mb-6">Document Previews</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="bg-lb-bg border border-lb-border rounded-2xl p-2 relative group overflow-hidden">
              <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-lb-text uppercase tracking-widest z-10 border border-lb-border/50">
                Aadhaar Card
              </div>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                {kyc?.aadharDocument ? (
                  <img src={kyc.aadharDocument} alt="Aadhaar" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <FileText className="w-8 h-8 text-lb-text-muted" />
                )}
              </div>
            </div>

            <div className="bg-lb-bg border border-lb-border rounded-2xl p-2 relative group overflow-hidden">
              <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-lb-text uppercase tracking-widest z-10 border border-lb-border/50">
                PAN Card
              </div>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                {kyc?.panDocument ? (
                  <img src={kyc.panDocument} alt="PAN" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <FileText className="w-8 h-8 text-lb-text-muted" />
                )}
              </div>
            </div>

          </div>
          
        </div>
      )}
    </div>
  );
}
