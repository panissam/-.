import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar, MapPin, Users, ChevronRight, Loader2, Search, Filter, CheckCircle, Clock } from 'lucide-react';
import { Training, Registration } from '../types';
import { fetchTrainingsFromSheet } from '../services/sheetService';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RegistrationModal } from '../components/RegistrationModal';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export const Home: React.FC = () => {
  const { user, profile } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Registration state
  const [userRegistrations, setUserRegistrations] = useState<Registration[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchTrainingsFromSheet();
      setTrainings(data);
      setLoading(false);
    };
    loadData();
  }, []);

  // Real-time registrations for the current user
  useEffect(() => {
    if (!profile?.staffInfo?.staffId && !user?.uid) return;
    
    // We try to query by staffId if available, otherwise by userId
    const q = profile?.staffInfo?.staffId 
      ? query(collection(db, 'registrations'), where('staffId', '==', profile.staffInfo.staffId))
      : query(collection(db, 'registrations'), where('userId', '==', user?.uid));

    const path = 'registrations';
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const regs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration));
      setUserRegistrations(regs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [profile, user]);

  const academicYears = useMemo(() => {
    const years = Array.from(new Set(trainings.map(t => t.academicYear))).sort((a, b) => b.localeCompare(a));
    return years;
  }, [trainings]);

  const filteredTrainings = useMemo(() => {
    return trainings.filter(t => {
      const matchesYear = selectedYear === 'all' || t.academicYear === selectedYear;
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesYear && matchesSearch;
    });
  }, [trainings, selectedYear, searchTerm]);

  const groupedTrainings = useMemo(() => {
    const groups: Record<string, Training[]> = {};
    filteredTrainings.forEach(t => {
      if (!groups[t.academicYear]) groups[t.academicYear] = [];
      groups[t.academicYear].push(t);
    });
    return groups;
  }, [filteredTrainings]);

  const handleRegisterClick = (training: Training) => {
    setSelectedTraining(training);
    setRegError(null);
    setIsModalOpen(true);
  };

  const handleConfirmRegistration = async () => {
    if (!selectedTraining || !profile) return;
    
    setIsSubmitting(true);
    setRegError(null);

    try {
      const staffId = profile.staffInfo?.staffId || user?.uid || '';
      const path = 'registrations';
      
      // 1. Check duplicate
      const q = query(
        collection(db, path), 
        where('staffId', '==', staffId),
        where('courseId', '==', selectedTraining.id)
      );
      
      let existing;
      try {
        existing = await getDocs(q);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
        return; // handleFirestoreError throws, but just in case
      }
      
      if (!existing.empty) {
        setRegError('คุณได้ลงทะเบียนหลักสูตรนี้ไปแล้ว');
        setIsSubmitting(false);
        return;
      }

      // 2. Check Prerequisite
      if (selectedTraining.prerequisiteId) {
        const prereqReg = userRegistrations.find(r => r.courseId === selectedTraining.prerequisiteId && r.status === 'Approved');
        if (!prereqReg) {
          setRegError(`คุณต้องผ่านการอบรมหลักสูตร "${selectedTraining.prerequisiteId}" และได้รับการอนุมัติก่อน`);
          setIsSubmitting(false);
          return;
        }
      }

      // 3. Save registration
      const newReg = {
        staffId: staffId,
        userId: user?.uid,
        userEmail: user?.email, // Added for security rules
        courseId: selectedTraining.id,
        status: 'Pending' as const,
        timestamp: serverTimestamp(),
        academicYear: selectedTraining.academicYear,
        trainingTitle: selectedTraining.title,
        userName: profile.staffInfo?.name || profile.displayName,
        userDivision: profile.staffInfo?.division || 'N/A'
      };

      await addDoc(collection(db, 'registrations'), newReg);

      // Trigger Notification
      import('../services/notificationService').then(m => 
        m.sendNotification('new_registration', { ...newReg, timestamp: new Date() })
      );

      setIsModalOpen(false);
      setSelectedTraining(null);
    } catch (error: any) {
      console.error('Registration failed:', error);
      setRegError('เกิดข้อผิดพลาดในการลงทะเบียน: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRegistrationStatus = (courseId: string) => {
    return userRegistrations.find(r => r.courseId === courseId);
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3b82f6]" />
        <p className="text-[#94a3b8]">กำลังโหลดข้อมูลหลักสูตรอบรม...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-6 md:flex-row md:items-end md:justify-between md:space-y-0">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[#f8fafc]">Explore Courses</h1>
          <p className="text-[#94a3b8]">รายการหลักสูตรอบรมที่เปิดรับสมัคร</p>
        </div>

        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              placeholder="ค้นหาหลักสูตร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl bg-[#1e293b] border border-[#334155] py-2.5 pl-10 pr-4 text-sm text-[#f8fafc] placeholder:text-[#64748b] focus:border-[#3b82f6] focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-[#64748b]" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-xl bg-[#1e293b] border border-[#334155] px-4 py-2.5 text-sm text-[#f8fafc] focus:border-[#3b82f6] focus:outline-none cursor-pointer"
            >
              <option value="all">ทุกปีการศึกษา</option>
              {academicYears.map(year => (
                <option key={year} value={year}>ปีการศึกษา {year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {Object.keys(groupedTrainings).sort((a, b) => b.localeCompare(a)).map(year => (
          <div key={year} className="space-y-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold text-[#f8fafc]">ปีการศึกษา {year}</h2>
              <div className="h-px flex-1 bg-[#1e293b]"></div>
              <span className="text-xs font-bold text-[#64748b] uppercase tracking-widest">
                {groupedTrainings[year].length} Courses
              </span>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
              {groupedTrainings[year].map((training, index) => {
                const registration = getRegistrationStatus(training.id);
                
                return (
                  <motion.div
                    key={training.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group overflow-hidden rounded-2xl bg-[#1e293b] border border-[#334155] shadow-sm transition-all hover:border-[#3b82f6] hover:shadow-blue-500/5"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-[#334155] text-[#94a3b8]">
                          BE {training.academicYear}
                        </span>
                        {registration ? (
                          <span className={cn(
                            "text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded",
                            registration.status === 'Approved' ? "bg-green-500/10 text-green-400" :
                            registration.status === 'Rejected' ? "bg-red-500/10 text-red-400" :
                            "bg-amber-500/10 text-amber-400"
                          )}>
                            {registration.status}
                          </span>
                        ) : (
                          training.capacity && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-blue-500/10 text-blue-400">
                              Open for Registration
                            </span>
                          )
                        )}
                      </div>
                      
                      <h2 className="text-xl font-bold text-[#f8fafc] leading-tight mb-2">{training.title}</h2>
                      <p className="text-sm text-[#94a3b8] line-clamp-2 mb-6">{training.description}</p>
                      
                      <div className="space-y-1 text-sm text-[#94a3b8] mb-6 flex flex-col">
                        <span className="flex items-center">
                          <span className="mr-2 text-[#3b82f6]">📅</span> {training.date} {training.time && `• ${training.time}`}
                        </span>
                        {training.location && (
                          <span className="flex items-center">
                            <span className="mr-2 text-[#3b82f6]">📍</span> {training.location}
                          </span>
                        )}
                      </div>

                      {registration ? (
                        <div className={cn(
                          "flex w-full items-center justify-center space-x-2 rounded-xl border px-4 py-3 font-semibold transition-all",
                          registration.status === 'Approved' ? "border-green-500/20 bg-green-500/5 text-green-400" :
                          registration.status === 'Rejected' ? "border-red-500/20 bg-red-500/5 text-red-400" :
                          "border-amber-500/20 bg-amber-500/5 text-amber-400"
                        )}>
                          {registration.status === 'Approved' ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                          <span>{registration.status === 'Approved' ? 'ลงทะเบียนสำเร็จแล้ว' : 'รอการอนุมัติ'}</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleRegisterClick(training)}
                          className="flex w-full items-center justify-center rounded-xl bg-[#3b82f6] px-4 py-3 font-semibold text-white transition-all hover:bg-blue-600 active:scale-[0.98]"
                        >
                          <span>Register Now</span>
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
        
        {Object.keys(groupedTrainings).length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="rounded-full bg-[#1e293b] p-6 mb-4">
              <Search className="h-10 w-10 text-[#64748b]" />
            </div>
            <h3 className="text-lg font-bold text-[#f8fafc]">ไม่พบข้อมูล</h3>
            <p className="text-[#94a3b8]">ไม่พบหลักสูตรอบรมที่ตรงกับเงื่อนไขการค้นหาของคุณ</p>
          </div>
        )}
      </div>

      <RegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmRegistration}
        training={selectedTraining}
        profile={profile}
        isSubmitting={isSubmitting}
        error={regError}
      />
    </div>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
