import React, { useState } from 'react';
import Papa from 'papaparse';
import { collection, doc, setDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { StaffInfo } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export const StaffManagement: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const path = 'staff_directory';
          const batch = writeBatch(db);
          const staffDocs = results.data.map((row: any) => ({
            staffId: row['รหัสบุคลากร'] || row['Staff ID'] || '',
            name: row['ชื่อ'] || row['Name'] || '',
            division: row['หน่วยงาน'] || row['Division'] || '',
            phone: row['เบอร์โทร'] || row['Phone'] || '',
            email: row['อีเมล'] || row['Email'] || '',
          }));

          // Validate at least email is present for mapping
          const validStaff = staffDocs.filter((s: any) => s.email && s.email.includes('@'));

          for (const staff of validStaff) {
            const staffRef = doc(collection(db, path));
            batch.set(staffRef, staff);
          }

          try {
            await batch.commit();
            setResult({ success: true, message: `อัปโหลดสำเร็จ! นำเข้าข้อมูล ${validStaff.length} รายการ` });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, path);
          }
        } catch (error: any) {
          console.error('Error saving staff directory:', error);
          setResult({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message });
        } finally {
          setIsUploading(false);
          // Reset input
          event.target.value = '';
        }
      },
      error: (error: any) => {
        setIsUploading(false);
        setResult({ success: false, message: 'เกิดข้อผิดพลาดในการอ่านไฟล์ CSV: ' + error.message });
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#f8fafc]">Staff Management</h1>
        <p className="text-[#94a3b8]">จัดการรายชื่อบุคลากรเพื่อการ Mapping ข้อมูลอัตโนมัติ</p>
      </div>

      <div className="max-w-2xl">
        <div className="rounded-3xl bg-[#1e293b] border-2 border-dashed border-[#334155] p-12 text-center transition-colors hover:border-[#3b82f6]">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-[#1e293b] p-6 border border-[#334155] text-[#3b82f6]">
              <Upload size={48} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#f8fafc]">อัปโหลดไฟล์รายชื่อบุคลากร</h3>
              <p className="mt-2 text-sm text-[#94a3b8]">
                ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์ (CSV เท่านั้น)
              </p>
            </div>

            <div className="w-full pt-4">
              <label className="inline-flex cursor-pointer items-center justify-center space-x-2 rounded-xl bg-[#3b82f6] px-8 py-4 font-semibold text-white transition-all hover:bg-blue-600 active:scale-[0.98]">
                <span>เลือกไฟล์ CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
            </div>

            <div className="pt-6 text-left">
              <p className="text-xs font-bold text-[#64748b] uppercase tracking-widest mb-3 text-center">หัวตารางที่แนะนำ (Headers)</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#94a3b8]">
                <code className="bg-[#0f172a] px-2 py-1 rounded">รหัสบุคลากร / Staff ID</code>
                <code className="bg-[#0f172a] px-2 py-1 rounded">ชื่อ / Name</code>
                <code className="bg-[#0f172a] px-2 py-1 rounded">หน่วยงาน / Division</code>
                <code className="bg-[#0f172a] px-2 py-1 rounded">เบอร์โทร / Phone</code>
                <code className="bg-[#0f172a] px-2 py-1 rounded">อีเมล / Email</code>
              </div>
            </div>
          </div>
        </div>

        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center justify-center space-x-3 rounded-2xl bg-blue-500/10 p-4 text-[#3b82f6]"
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-semibold">กำลังประมวลผลข้อมูล...</span>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 flex items-center space-x-3 rounded-2xl p-4 border ${
              result.success 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-500'
            }`}
          >
            {result.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="font-semibold">{result.message}</span>
          </motion.div>
        )}
      </div>

      <div className="rounded-3xl bg-[#1e293b] p-8 border border-[#334155]">
        <div className="flex items-center space-x-3 mb-6">
          <FileText className="text-[#3b82f6]" />
          <h2 className="text-xl font-bold text-[#f8fafc]">ทำไมต้องอัปโหลดข้อมูลนี้?</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 text-sm text-[#94a3b8]">
          <div className="space-y-2">
            <p className="font-bold text-[#f8fafc]">1. Mapping ข้อมูลอัตโนมัติ</p>
            <p>เมื่ออาจารย์เข้าสู่ระบบ ระบบจะดึงชื่อ หน่วยงาน และรหัสพนักงานมาแสดงผลให้ทันทีโดยไม่ต้องกรอกเพิ่ม</p>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-[#f8fafc]">2. รายงานการอบรมที่ครบถ้วน</p>
            <p>ช่วยให้ Admin ส่งออกรายงานการอบรมที่มีข้อมูลพื้นฐานครบถ้วน เพื่อส่งต่อไปยังแผนกบุคคลได้รวดเร็วขึ้น</p>
          </div>
        </div>
      </div>
    </div>
  );
};
