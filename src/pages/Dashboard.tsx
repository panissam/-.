import React, { useEffect, useState, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  Activity, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Registration } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export const Dashboard: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');

  useEffect(() => {
    const path = 'registrations';
    const q = query(collection(db, path), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration));
      setRegistrations(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (regId: string, newStatus: 'Approved' | 'Rejected' | 'Pending') => {
    const path = `registrations/${regId}`;
    try {
      await updateDoc(doc(db, 'registrations', regId), {
        status: newStatus
      });

      // Trigger Notification
      const reg = registrations.find(r => r.id === regId);
      if (reg) {
        import('../services/notificationService').then(m => 
          m.sendNotification('status_update', { ...reg, status: newStatus })
        );
      }
    } catch (error: any) {
      console.error('Failed to update status:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ: ' + error.message);
    }
  };

  const filteredRegistrations = useMemo(() => {
    return registrations.filter(r => {
      const matchesSearch = 
        r.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.trainingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.staffId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [registrations, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = registrations.filter(r => {
      const date = r.timestamp?.toDate();
      return date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    const courseCounts: Record<string, number> = {};
    registrations.forEach(r => {
      courseCounts[r.trainingTitle] = (courseCounts[r.trainingTitle] || 0) + 1;
    });
    
    const topCourse = Object.entries(courseCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return [
      { name: 'ผู้ลงทะเบียนทั้งหมด', value: registrations.length.toString(), icon: Users, color: 'bg-blue-600' },
      { name: 'รายการจองเดือนนี้', value: thisMonth.toString(), icon: Calendar, color: 'bg-emerald-600' },
      { name: 'หลักสูตรยอดนิยม', value: topCourse, icon: TrendingUp, color: 'bg-amber-600', isScale: true },
      { name: 'รอการอนุมัติ', value: registrations.filter(r => r.status === 'Pending').length.toString(), icon: Activity, color: 'bg-indigo-600' },
    ];
  }, [registrations]);

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3b82f6]" />
        <p className="text-[#94a3b8]">กำลังโหลดข้อมูล Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#f8fafc]">Admin Dashboard</h1>
        <p className="text-[#94a3b8]">ระบบจัดการการลงทะเบียนและสถิติภาพรวม</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-3xl bg-[#1e293b] p-6 shadow-sm border border-[#334155]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={stat.color + " rounded-2xl p-3 text-white shadow-lg"}>
                <stat.icon size={20} />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">Real-time</span>
            </div>
            <div>
              <h3 className="text-xs font-medium text-[#64748b] uppercase tracking-wider">{stat.name}</h3>
              <p className={cn("mt-1 font-bold text-[#f8fafc]", stat.isScale ? "text-sm line-clamp-1" : "text-2xl")}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-[#1e293b] border border-[#334155] overflow-hidden">
        <div className="p-6 border-b border-[#334155] flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <h2 className="text-xl font-bold text-[#f8fafc]">รายการจองอบรมล่าสุด</h2>
          
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
              <input
                type="text"
                placeholder="ค้นหารายชื่อ/หลักสูตร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-xl bg-[#0f172a] border border-[#334155] py-2 pl-10 pr-4 text-sm text-[#f8fafc] focus:border-[#3b82f6] outline-none w-full sm:w-64"
              />
            </div>
            
            <div className="flex items-center space-x-2 bg-[#0f172a] border border-[#334155] rounded-xl px-3 outline-none">
              <Filter size={14} className="text-[#64748b]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent py-2 text-xs text-[#f8fafc] focus:outline-none cursor-pointer"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f172a]/50 text-[10px] font-bold uppercase tracking-widest text-[#64748b]">
                <th className="px-6 py-4">ผู้ลงทะเบียน</th>
                <th className="px-6 py-4">หลักสูตร</th>
                <th className="px-6 py-4">วันที่ลงทะเบียน</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]">
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-[#1e293b]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#f8fafc]">{reg.userName}</span>
                      <span className="text-[10px] text-[#64748b]">{reg.staffId} • {reg.userDivision}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#94a3b8] max-w-xs truncate">
                    {reg.trainingTitle}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#94a3b8]">
                    {reg.timestamp ? reg.timestamp.toDate().toLocaleString('th-TH') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-1 rounded",
                      reg.status === 'Approved' ? "bg-green-500/10 text-green-400" :
                      reg.status === 'Rejected' ? "bg-red-500/10 text-red-500" :
                      "bg-amber-500/10 text-amber-400"
                    )}>
                      {reg.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      {reg.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(reg.id, 'Approved')}
                            className="bg-green-500/20 text-green-400 p-2 rounded-lg hover:bg-green-500 hover:text-white transition-all"
                            title="อนุมัติ"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(reg.id, 'Rejected')}
                            className="bg-red-500/20 text-red-500 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                            title="ยกเลิก"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      {(reg.status === 'Approved' || reg.status === 'Rejected') && (
                        <button
                          onClick={() => handleUpdateStatus(reg.id, 'Pending')}
                          className="bg-[#334155] text-[#94a3b8] p-2 rounded-lg hover:bg-[#3b82f6] hover:text-white transition-all"
                          title="เปลี่ยนกลับเป็นกําลังรอ"
                        >
                          <Clock size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredRegistrations.length === 0 && (
            <div className="py-12 flex flex-col items-center text-center">
              <Activity className="h-12 w-12 text-[#334155] mb-4" />
              <p className="text-[#64748b]">ไม่พบรายการข้อมูลการลงทะเบียน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
