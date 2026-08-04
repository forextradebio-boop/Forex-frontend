import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Upload, CreditCard, Building2, UserCircle2, AlertCircle, Loader } from 'lucide-react';
import { submitKyc } from '../../services/kyc';

interface KYCScreenProps {
  onBack: () => void;
  onSubmit: () => void;
}

export const KYCScreen: React.FC<KYCScreenProps> = ({ onBack, onSubmit }) => {
  const [aadhar, setAadhar] = useState('');
  const [pan, setPan] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [upi, setUpi] = useState('');
  const [holderName, setHolderName] = useState('');
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const aadharFileInputRef = React.useRef<HTMLInputElement>(null);
  const panFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, setter: (file: File | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      setter(file);
    }
  };

  const triggerFileInput = (ref: React.RefObject<HTMLInputElement>) => {
    ref.current?.click();
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validation
    if (!aadhar.trim()) {
      setErrorMsg('Aadhar number is required');
      return;
    }
    if (!aadharFile) {
      setErrorMsg('Aadhar photo is required');
      return;
    }
    if (!pan.trim()) {
      setErrorMsg('PAN number is required');
      return;
    }
    if (!panFile) {
      setErrorMsg('PAN photo is required');
      return;
    }
    if (!holderName.trim()) {
      setErrorMsg('Account holder name is required');
      return;
    }
    if (!bankName.trim()) {
      setErrorMsg('Bank name is required');
      return;
    }
    if (!bankAccount.trim()) {
      setErrorMsg('Account number is required');
      return;
    }
    if (!ifsc.trim()) {
      setErrorMsg('IFSC code is required');
      return;
    }

    try {
      setIsLoading(true);

      // Convert files to base64
      const aadharBase64 = await fileToBase64(aadharFile);
      const panBase64 = await fileToBase64(panFile);

      const payload = {
        aadharNumber: aadhar,
        aadharDocument: aadharBase64,
        panNumber: pan,
        panDocument: panBase64,
        accountHolderName: holderName,
        bankName,
        accountNumber: bankAccount,
        ifscCode: ifsc,
        upiId: upi || undefined,
      };

      await submitKyc(payload);
      setSuccessMsg('KYC submitted successfully!');
      setTimeout(() => {
        onSubmit();
      }, 1500);
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.message || 'Failed to submit KYC. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-lb-bg z-[110] flex flex-col animate-in slide-in-from-right font-sans">
      <div className="flex items-center p-4 bg-lb-panel border-b border-lb-border shadow-sm shrink-0 sticky top-0 z-10">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-lb-text-muted active:bg-lb-panel-hover rounded-full transition-colors -ml-2">
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col ml-2">
          <h1 className="text-[19px] font-bold text-lb-text leading-tight">Identity Verification</h1>
          <span className="text-[12px] text-lb-text-muted font-medium">KYC & Bank Details</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 flex flex-col gap-6">
        
        <form id="kyc-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* Identity Section */}
          <div className="bg-lb-panel rounded-[24px] p-5 shadow-sm shadow-black/5 border border-lb-border flex flex-col gap-5">
            <div className="flex items-center gap-3 border-b border-lb-border pb-3">
              <div className="w-8 h-8 rounded-full bg-lb-accent/10 flex items-center justify-center text-lb-accent">
                <UserCircle2 size={18} />
              </div>
              <h2 className="text-[17px] font-bold text-lb-text">Personal Identity</h2>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-lb-text ml-1">Aadhar Number</label>
              <input type="text" required value={aadhar} onChange={e => setAadhar(e.target.value)} placeholder="0000 0000 0000" className="w-full bg-lb-text/[0.03] border border-lb-border hover:border-lb-text/20 rounded-xl px-4 py-3 text-[15px] text-lb-text focus:outline-none focus:border-lb-accent focus:bg-lb-bg focus:ring-4 focus:ring-lb-accent/10 transition-all placeholder:text-lb-text-muted/60" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-lb-text ml-1">Aadhar Photo</label>
              <div 
                onClick={() => triggerFileInput(aadharFileInputRef)}
                className="w-full h-24 border-2 border-dashed border-lb-border rounded-xl flex flex-col items-center justify-center bg-lb-text/[0.02] text-lb-text-muted active:bg-lb-text/[0.05] hover:border-lb-accent hover:bg-lb-accent/5 transition-colors cursor-pointer"
              >
                <Upload size={20} className="mb-1 text-lb-text-muted" />
                <span className="text-[13px] font-medium">{aadharFile ? aadharFile.name : 'Tap to upload Aadhar'}</span>
              </div>
              <input
                ref={aadharFileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileSelect(e, setAadharFile)}
                className="hidden"
              />
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <label className="text-[13px] font-bold text-lb-text ml-1">PAN Number</label>
              <input type="text" required value={pan} onChange={e => setPan(e.target.value)} placeholder="ABCDE1234F" className="w-full bg-lb-text/[0.03] border border-lb-border hover:border-lb-text/20 rounded-xl px-4 py-3 text-[15px] text-lb-text uppercase focus:outline-none focus:border-lb-accent focus:bg-lb-bg focus:ring-4 focus:ring-lb-accent/10 transition-all placeholder:text-lb-text-muted/60" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-lb-text ml-1">PAN Photo</label>
              <div 
                onClick={() => triggerFileInput(panFileInputRef)}
                className="w-full h-24 border-2 border-dashed border-lb-border rounded-xl flex flex-col items-center justify-center bg-lb-text/[0.02] text-lb-text-muted active:bg-lb-text/[0.05] hover:border-lb-accent hover:bg-lb-accent/5 transition-colors cursor-pointer"
              >
                <Upload size={20} className="mb-1 text-lb-text-muted" />
                <span className="text-[13px] font-medium">{panFile ? panFile.name : 'Tap to upload PAN'}</span>
              </div>
              <input
                ref={panFileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileSelect(e, setPanFile)}
                className="hidden"
              />
            </div>
          </div>

          {/* Banking Section */}
          <div className="bg-lb-panel rounded-[24px] p-5 shadow-sm shadow-black/5 border border-lb-border flex flex-col gap-5">
            <div className="flex items-center gap-3 border-b border-lb-border pb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Building2 size={18} />
              </div>
              <h2 className="text-[17px] font-bold text-lb-text">Bank Details</h2>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-lb-text ml-1">Account Holder Name</label>
              <input type="text" required value={holderName} onChange={e => setHolderName(e.target.value)} placeholder="Name as per bank record" className="w-full bg-lb-text/[0.03] border border-lb-border hover:border-lb-text/20 rounded-xl px-4 py-3 text-[15px] text-lb-text focus:outline-none focus:border-lb-accent focus:bg-lb-bg focus:ring-4 focus:ring-lb-accent/10 transition-all placeholder:text-lb-text-muted/60" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-lb-text ml-1">Bank Name</label>
              <input type="text" required value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" className="w-full bg-lb-text/[0.03] border border-lb-border hover:border-lb-text/20 rounded-xl px-4 py-3 text-[15px] text-lb-text focus:outline-none focus:border-lb-accent focus:bg-lb-bg focus:ring-4 focus:ring-lb-accent/10 transition-all placeholder:text-lb-text-muted/60" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-lb-text ml-1">Account Number</label>
              <input type="text" required value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="Account Number" className="w-full bg-lb-text/[0.03] border border-lb-border hover:border-lb-text/20 rounded-xl px-4 py-3 text-[15px] text-lb-text focus:outline-none focus:border-lb-accent focus:bg-lb-bg focus:ring-4 focus:ring-lb-accent/10 transition-all placeholder:text-lb-text-muted/60" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-lb-text ml-1">IFSC Code</label>
              <input type="text" required value={ifsc} onChange={e => setIfsc(e.target.value)} placeholder="IFSC Code" className="w-full bg-lb-text/[0.03] border border-lb-border hover:border-lb-text/20 rounded-xl px-4 py-3 text-[15px] text-lb-text uppercase focus:outline-none focus:border-lb-accent focus:bg-lb-bg focus:ring-4 focus:ring-lb-accent/10 transition-all placeholder:text-lb-text-muted/60" />
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <div className="flex justify-between items-end">
                <label className="text-[13px] font-bold text-lb-text ml-1">UPI ID</label>
                <span className="text-[11px] text-lb-text-muted font-medium">Optional</span>
              </div>
              <input type="text" value={upi} onChange={e => setUpi(e.target.value)} placeholder="user@upi" className="w-full bg-lb-text/[0.03] border border-lb-border hover:border-lb-text/20 rounded-xl px-4 py-3 text-[15px] text-lb-text focus:outline-none focus:border-lb-accent focus:bg-lb-bg focus:ring-4 focus:ring-lb-accent/10 transition-all placeholder:text-lb-text-muted/60" />
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-lb-down/10 border border-lb-down/30 rounded-xl p-4 flex gap-3 items-start">
              <AlertCircle className="text-lb-down mt-1 flex-shrink-0" size={20} />
              <span className="text-lb-down text-[14px] font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="bg-lb-up/10 border border-lb-up/30 rounded-xl p-4 flex gap-3 items-start">
              <CheckCircle2 className="text-lb-up mt-1 flex-shrink-0" size={20} />
              <span className="text-lb-up text-[14px] font-medium">{successMsg}</span>
            </div>
          )}

        </form>
      </div>

      <div className="bg-lb-panel border-t border-lb-border p-4 shrink-0 pb-safe">
        <button 
          type="submit"
          form="kyc-form"
          disabled={isLoading}
          className="w-full bg-lb-accent hover:opacity-90 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-[17px] shadow-lg shadow-lb-accent/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader size={20} className="animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit Application <CheckCircle2 size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
