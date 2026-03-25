import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Upload, CheckCircle, XCircle, Loader2, FileText, User, Camera, Video } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export default function KYC() {
  const [loading, setLoading] = useState(false);
  const [kycData, setKycData] = useState<any>(null);
  const [files, setFiles] = useState<{ [key: string]: string }>({
    nidFront: '',
    nidBack: '',
    selfie: ''
  });
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchKYCStatus = async () => {
    try {
      const response = await axios.get('/api/kyc/status');
      if (response.data.kyc) {
        setKycData(response.data.kyc);
      }
    } catch (error) {
      console.error('Failed to fetch KYC status');
    }
  };

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Camera access denied. Please allow camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast.error('No camera found on this device.');
      } else {
        toast.error('Could not access camera. Please check your permissions and try again.');
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      let width = video.videoWidth;
      let height = video.videoHeight;
      const maxDim = 1024;

      if (width > height && width > maxDim) {
        height *= maxDim / width;
        width = maxDim;
      } else if (height > maxDim) {
        width *= maxDim / height;
        height = maxDim;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFiles(prev => ({ ...prev, selfie: dataUrl }));
        stopCamera();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should be less than 10MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1024;

          if (width > height && width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          } else if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setFiles(prev => ({ ...prev, [field]: dataUrl }));
          }
        };
        img.onerror = () => {
          toast.error('Invalid image file. Please upload a valid image.');
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
    // Clear the input value so the same file can be selected again
    e.target.value = '';
  };

  const handleVerifyWithAI = async () => {
    if (!files.nidFront || !files.nidBack || !files.selfie) {
      toast.error('Please upload all required documents');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/kyc/verify-ai', {
        nidFront: files.nidFront,
        nidBack: files.nidBack,
        selfie: files.selfie
      });

      const result = response.data.result;
      
      // Submit result to backend
      await axios.post('/api/kyc/submit', {
        nidFront: files.nidFront,
        nidBack: files.nidBack,
        selfie: files.selfie,
        status: result.status,
        aiResult: JSON.stringify(result)
      });

      setKycData({ status: result.status, aiVerificationResult: JSON.stringify(result) });
      toast.success(`AI Verification (Einstein) completed: ${result.status}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || 'AI Verification failed. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Smart KYC Verification</h1>
        <p className="text-slate-500">Powered by Einstein AI for instant verification.</p>
      </div>
      
      {(!kycData || kycData.status !== 'verified') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { id: 'nidFront', label: 'NID Front', icon: <FileText className="text-indigo-600" /> },
            { id: 'nidBack', label: 'NID Back', icon: <FileText className="text-indigo-600" /> },
            { id: 'selfie', label: 'Live Selfie', icon: <Camera className="text-indigo-600" /> }
          ].map((item) => (
            <div key={item.id} className="relative group">
              {item.id === 'selfie' ? (
                <div className={`h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all ${
                  files[item.id] ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 group-hover:border-indigo-400'
                }`}>
                  {files[item.id] ? (
                    <div className="relative w-full h-full">
                      <img src={files[item.id]} alt={item.label} className="h-full w-full object-contain rounded-lg" />
                      <button 
                        onClick={() => setFiles(prev => ({ ...prev, [item.id]: '' }))}
                        className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full hover:bg-rose-600"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full space-y-3 px-4">
                      <button 
                        onClick={startCamera}
                        disabled={loading || (kycData && kycData.status === 'verified')}
                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors w-full justify-center"
                      >
                        <Video size={18} />
                        <span className="text-sm font-bold">Open Camera</span>
                      </button>
                      <div className="relative w-full">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, item.id)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          disabled={loading || (kycData && kycData.status === 'verified')}
                        />
                        <div className="flex items-center space-x-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors w-full justify-center border border-slate-200">
                          <Upload size={18} />
                          <span className="text-sm font-bold">Upload Photo</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {!files[item.id] && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, item.id)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={loading || (kycData && kycData.status === 'verified')}
                    />
                  )}
                  <div className={`h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all ${
                    files[item.id] ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 group-hover:border-indigo-400'
                  }`}>
                    {files[item.id] ? (
                      <div className="relative w-full h-full">
                        <img src={files[item.id]} alt={item.label} className="h-full w-full object-contain rounded-lg" />
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            setFiles(prev => ({ ...prev, [item.id]: '' }));
                          }}
                          className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full hover:bg-rose-600 z-20"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-white rounded-xl shadow-sm mb-3">
                          {item.icon}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{item.label}</span>
                        <span className="text-xs text-slate-400 mt-1">Click to upload</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-2xl p-4 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Take Selfie</h3>
              <button onClick={stopCamera} className="text-slate-500 hover:text-rose-500">
                <XCircle size={24} />
              </button>
            </div>
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-4">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={captureSelfie}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all"
            >
              Capture
            </button>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}


      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        {!kycData || kycData.status !== 'verified' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                  <Loader2 className={loading ? "animate-spin" : ""} size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-indigo-900">Einstein AI Ready</p>
                  <p className="text-xs text-indigo-600">Upload documents to start verification</p>
                </div>
              </div>
              <button
                onClick={handleVerifyWithAI}
                disabled={loading || !files.nidFront || !files.nidBack || !files.selfie}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200"
              >
                {loading ? 'Verifying...' : 'Start Einstein Verify'}
              </button>
            </div>

            {kycData && (
              <div className={`p-4 rounded-2xl border ${
                kycData.status === 'rejected' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
              }`}>
                <div className="flex items-center space-x-3">
                  {kycData.status === 'rejected' ? <XCircle className="text-rose-600" /> : <Loader2 className="text-amber-600 animate-spin" />}
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${kycData.status === 'rejected' ? 'text-rose-900' : 'text-amber-900'}`}>
                      Status: {kycData.status.toUpperCase()}
                    </p>
                    {kycData.aiVerificationResult && (
                      <p className="text-xs text-slate-600 mt-1">
                        {JSON.parse(kycData.aiVerificationResult).reason}
                      </p>
                    )}
                  </div>
                  {kycData.status === 'rejected' && (
                    <button
                      onClick={() => {
                        setKycData(null);
                        setFiles({ nidFront: '', nidBack: '', selfie: '' });
                      }}
                      className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700 transition-colors"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">KYC Verified</h2>
            <p className="text-slate-500 mt-2">Your identity has been successfully verified by Einstein AI.</p>
            
            {kycData.aiVerificationResult && (
              <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Verification Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Name</p>
                    <p className="font-bold text-slate-900">{JSON.parse(kycData.aiVerificationResult).extractedInfo?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">NID Number</p>
                    <p className="font-bold text-slate-900">{JSON.parse(kycData.aiVerificationResult).extractedInfo?.nidNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
