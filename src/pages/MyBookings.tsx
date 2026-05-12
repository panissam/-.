import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, MapPin, Clock, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Registration } from '../types';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export const MyBookings: React.FC = () => {
  const { user, profile } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.staffInfo?.staffId && !user?.uid) {
       setLoading(false);
       return;
    }
    
    setLoading(true);
    const path = 'registrations';
    const q = profile?.staffInfo?.staffId 
      ? query(collection(db, path), where('staffId', '==', profile.staffInfo.staffId))
      : query(collection(db, path), where('userId', '==', user?.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const regs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration));
      setRegistrations(regs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [profile, user]);

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3b82f6]" />
        <p className="text-[#94a3b8]">กำลังโหลดรายการจองของคุณ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#f8fafc]">รายการจองของฉัน</h1>
        <p className="text-[#94a3b8]">ติดตามสถานะการลงทะเบียนและการแจ้งเตือนการอบรม</p>
      </div>

      {registrations.length > 0 ? (
        <div className="space-y-4">
          {registrations.map((booking) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="group relative overflow-hidden rounded-2xl bg-[#1e293b] border border-[#334155] p-6 shadow-sm shadow-blue-500/5 transition-all hover:border-[#3b82f6]"
            >
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      booking.status === 'Approved' ? "text-green-400" :
                      booking.status === 'Rejected' ? "text-red-400" :
                      "text-amber-400"
                    )}>
                      {booking.status === 'Approved' ? 'อนุมัติแล้ว' : 
                       booking.status === 'Rejected' ? 'ปฏิเสธ' : 
                       'รอการอนุมัติ'}
                    </span>
                    <span className="text-[10px] text-[#64748b] font-bold text-slate-400 uppercase tracking-tighter">
                      • {booking.academicYear}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#f8fafc]">{booking.trainingTitle}</h3>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center text-xs text-[#94a3b8]">
                      <CalendarIcon className="mr-1 h-3.5 w-3.5 text-[#3b82f6]" />
                      <span>บันทึกเมื่อ {booking.timestamp?.toDate().toLocaleDateString('th-TH')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="hidden text-right md:block">
                    <p className="text-[10px] font-medium text-[#64748b] uppercase tracking-tighter">สถานะ</p>
                    <div className="flex items-center space-x-1">
                       {booking.status === 'Approved' ? <CheckCircle className="h-3 w-3 text-green-400" /> : <Clock className="h-3 w-3 text-amber-400" />}
                       <p className={cn(
                         "text-xs font-semibold",
                         booking.status === 'Approved' ? "text-green-400" : "text-amber-400"
                       )}>{booking.status}</p>
                    </div>
                  </div>
                  <button className="flex items-center space-x-2 rounded-xl bg-[#334155] px-4 py-2.5 text-sm font-semibold text-[#f8fafc] transition-all hover:bg-[#3b82f6]">
                    <span>ดูรายละเอียด</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-[#1e293b] p-6 border border-[#334155]">
            <CalendarIcon className="h-10 w-10 text-[#64748b]" />
          </div>
          <h3 className="text-lg font-bold text-[#f8fafc]">ไม่พบรายการจอง</h3>
          <p className="mt-2 text-[#94a3b8]">คุณยังไม่ได้ลงทะเบียนอบรมรายการใดเลย</p>
        </div>
      )}
    </div>
  );
};

const Clock = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
