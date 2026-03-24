import React from 'react';
import { Member } from '../types';
import { QRCodeSVG } from 'qrcode.react';

interface MemberIdCardProps {
  member: Member;
}

export default function MemberIdCard({ member }: MemberIdCardProps) {
  return (
    <div className="hidden print:flex flex-col items-center justify-center w-full h-screen bg-white">
      <div className="w-[3.375in] h-[2.125in] border-2 border-indigo-600 rounded-xl overflow-hidden flex flex-col relative bg-white shadow-sm">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-2 text-center flex-shrink-0">
          <h1 className="text-sm font-bold uppercase tracking-wider">eUddok Smart Samity</h1>
          <p className="text-[10px] opacity-90">Member Identity Card</p>
        </div>

        {/* Body */}
        <div className="flex-1 p-3 flex items-start space-x-3">
          {/* Photo */}
          <div className="w-20 h-24 border-2 border-indigo-100 rounded-lg overflow-hidden flex-shrink-0 bg-slate-50 flex items-center justify-center">
            {member.photoUrl ? (
              <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-slate-300">{member.name[0]}</span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col justify-between h-full py-0.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">{member.name}</h2>
              <p className="text-[10px] text-indigo-600 font-bold mt-0.5">{member.memberId}</p>
            </div>
            
            <div className="space-y-1 mt-2">
              <div className="flex text-[9px]">
                <span className="text-slate-500 w-10">Phone:</span>
                <span className="font-semibold text-slate-800">{member.phone}</span>
              </div>
              <div className="flex text-[9px]">
                <span className="text-slate-500 w-10">NID:</span>
                <span className="font-semibold text-slate-800">{member.nid}</span>
              </div>
              <div className="flex text-[9px]">
                <span className="text-slate-500 w-10">Joined:</span>
                <span className="font-semibold text-slate-800">{new Date(member.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer & QR */}
        <div className="absolute bottom-2 right-2">
          <div className="bg-white p-1 rounded-lg shadow-sm border border-slate-100">
            <QRCodeSVG value={`member:${member.memberId}`} size={40} />
          </div>
        </div>
        
        {/* Signature Line */}
        <div className="absolute bottom-2 left-3 w-20 border-t border-slate-400 pt-0.5 text-center">
          <span className="text-[8px] text-slate-500">Auth. Signature</span>
        </div>
      </div>
    </div>
  );
}
