
import * as XLSX from 'xlsx';
import { PlanningData, CellMerge } from '../types';

export const parseExcelFile = async (file: File): Promise<PlanningData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellStyles: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Get raw rows
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        
        // Extract merges
        const merges: CellMerge[] = worksheet['!merges'] ? worksheet['!merges'].map(m => ({
          s: { r: m.s.r, c: m.s.c },
          e: { r: m.e.r, c: m.e.c }
        })) : [];

        resolve({
          id: crypto.randomUUID(),
          name: file.name,
          uploadDate: new Date().toISOString(),
          rows,
          merges,
          headers: rows[0] ? rows[0].map(h => String(h)) : []
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};
