import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { Training, UserProfile } from '../types';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  training: Training | null;
  profile: UserProfile | null;
  isSubmitting: boolean;
  error: string | null;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  training,
  profile,
  isSubmitting,
  error
}) => {
  if (!training) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#1e293b] border border-[#334155] shadow-2xl"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#f8fafc]">ยืนยันการลงทะเบียน</h3>
                <button onClick={onClose} className="rounded-lg p-2 text-[#64748b] hover:bg-[#334155] hover:text-[#f8fafc]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Course Info Summary */}
                <div className="rounded-2xl bg-[#0f172a] p-4 border border-[#334155]">
                  <p className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest mb-1">หลักสูตรที่เลือก</p>
                  <h4 className="font-bold text-[#f8fafc] leading-tight">{training.title}</h4>
                  <p className="text-xs text-[#94a3b8] mt-2 italic">Academic Year {training.academicYear}</p>
                </div>

                {/* Auto-filled Info */}
                <div className="space-y-4">
                  <p className="text-sm font-bold text-[#64748b] uppercase tracking-widest">ข้อมูลผู้ลงทะเบียน (Auto-fill)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#64748b] uppercase font-bold">ชื่อ-นามสกุล</label>
                      <p className="rounded-xl bg-[#334155] px-4 py-3 text-sm text-[#f8fafc] font-medium border border-[#334155]">
                        {profile?.staffInfo?.name || profile?.displayName}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#64748b] uppercase font-bold">หน่วยงาน</label>
                      <p className="rounded-xl bg-[#334155] px-4 py-3 text-sm text-[#f8fafc] font-medium border border-[#334155]">
                        {profile?.staffInfo?.division || 'ไม่พบข้อมูลหน่วยงาน'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#64748b] uppercase font-bold">รหัสบุคลากร</label>
                    <p className="rounded-xl bg-[#334155] px-4 py-3 text-sm text-[#f8fafc] font-medium border border-[#334155]">
                       {profile?.staffInfo?.staffId || '-'}
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center space-x-2 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="pt-2 flex flex-col space-y-3">
                  <button
                    onClick={onConfirm}
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center space-x-2 rounded-xl bg-[#3b82f6] px-4 py-4 font-bold text-white transition-all hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span>ยืนยันข้อมูลและลงทะเบียน</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="w-full py-3 text-sm font-semibold text-[#64748b] hover:text-[#f8fafc] transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
