export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'user';
  staffInfo?: StaffInfo;
}

export interface StaffInfo {
  staffId: string;
  name: string;
  division: string;
  phone: string;
  email: string;
}

export interface Training {
  id: string;
  title: string;
  description: string;
  date: string;
  academicYear: string;
  time?: string;
  location?: string;
  capacity?: number;
  registeredCount?: number;
  imageUrl?: string;
  prerequisiteId?: string | null;
}

export interface Booking {
  id: string;
  trainingId: string;
  trainingTitle: string;
  userId: string;
  userEmail: string;
  createdAt: any;
}

export interface Registration {
  id: string;
  staffId: string;
  courseId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp: any;
  academicYear: string;
  trainingTitle: string;
  userName: string;
  userDivision: string;
}
