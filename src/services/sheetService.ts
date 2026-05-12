import Papa from 'papaparse';
import { Training } from '../types';

const SHEET_ID = '1D2juYIOq0LHVkI1dTLbvprOIJZra7DXM9DBvNRwCNYw';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

export const fetchTrainingsFromSheet = async (): Promise<Training[]> => {
  try {
    const response = await fetch(CSV_URL);
    const csvData = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const trainings: Training[] = results.data.map((row: any, index: number) => {
            // Mapping logic based on expected columns
            // Adjust property names based on the actual CSV headers if possible
            // For now, I'll assume common names or use index-based if headers vary
            return {
              id: row['ID'] || row['รหัสหลักสูตร'] || `sheet-${index}`,
              title: row['ชื่อหลักสูตร'] || row['Title'] || 'Untitled Training',
              description: row['รายละเอียด'] || row['Description'] || '',
              date: row['วันที่'] || row['Date'] || '',
              academicYear: row['ปีการศึกษา'] || row['Academic Year'] || calculateAcademicYear(row['วันที่'] || row['Date']),
              time: row['เวลา'] || row['Time'] || '',
              location: row['สถานที่'] || row['Location'] || '',
              capacity: parseInt(row['จำนวนที่รับ'] || row['Capacity'] || '0'),
              registeredCount: 0,
              imageUrl: row['รูปภาพ'] || row['Image'] || '',
              prerequisiteId: row['Prerequisite'] || row['วิชาบังคับก่อน'] || null,
            };
          });
          resolve(trainings);
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return [];
  }
};

const calculateAcademicYear = (dateStr: string): string => {
  if (!dateStr) return '2566'; // Default
  
  // Try to parse date. Usually dates in TH sheets are like 20/05/2567 or 20/05/2024
  const parts = dateStr.split(/[/ -]/);
  if (parts.length < 3) return '2566';
  
  let year = parseInt(parts[2]);
  let month = parseInt(parts[1]);
  
  // If year is in CE, convert to BE for Thai context if needed, 
  // but let's stick to whatever is in the sheet or assume 25xx
  if (year < 2500) year += 543;

  // August is month 8
  // If month >= 8, it's the start of the academic year
  // Academic year "2566" is Aug 2566 - July 2567
  if (month < 8) {
    return (year - 1).toString();
  }
  return year.toString();
};
