import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =================================================================
// --- TIPE DATA (Simulasi dari usePemesanan hook) ---
// =================================================================
interface Konsumsi {
  jenis: string;
  qty: number;
  satuan: string;
}

type Status = 'Menunggu' | 'Disetujui' | 'Ditolak';

interface StatusHistoryItem {
  timestamp: string;
  status: Status;
  oleh: string; // The user or approver name
}

interface Pemesanan {
  id: string;
  acara: string;
  tanggal: string; // YYYY-MM-DD
  waktu: string; // HH:MM
  lokasi: string;
  tamu: 'internal' | 'eksternal';
  yangMengajukan: string;
  untukBagian: string;
  approval: string; // Nama yang menyetujui
  status: Status;
  konsumsi: Konsumsi[];
  catatan?: string;
  statusHistory: StatusHistoryItem[];
  createdAt: number; // Timestamp for sorting
}

// =================================================================
// --- DATA TIRUAN (MOCK DATA) ---
// =================================================================
const getCurrentDateFormatted = () => new Date().toISOString().slice(0, 10);
const getYesterdayDateFormatted = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

const getNowTimestamp = () => new Date().toLocaleString('id-ID');

const initialPemesananList: Pemesanan[] = [
  {
    id: 'ORD001',
    acara: 'Rapat Koordinasi Mingguan',
    tanggal: getCurrentDateFormatted(),
    waktu: '10:00',
    lokasi: 'Ruang Meeting Utama Lantai 3',
    tamu: 'internal',
    yangMengajukan: 'Budi Santoso',
    untukBagian: 'Divisi Pemasaran',
    approval: 'Dewi Rahayu',
    status: 'Menunggu',
    konsumsi: [
      { jenis: 'Nasi Kotak Ayam Geprek', qty: 30, satuan: 'Pcs' },
      { jenis: 'Air Mineral 600ml', qty: 30, satuan: 'Botol' },
    ],
    catatan: 'Permintaan teh manis hangat untuk 5 orang khusus.',
    statusHistory: [
      { timestamp: getNowTimestamp(), status: 'Menunggu', oleh: 'Sistem' },
    ],
    createdAt: Date.now() - 5000000,
  },
  {
    id: 'ORD002',
    acara: 'Kunjungan Mitra Internasional',
    tanggal: getCurrentDateFormatted(),
    waktu: '14:30',
    lokasi: 'Lounge Eksekutif',
    tamu: 'eksternal',
    yangMengajukan: 'Siti Aminah',
    untukBagian: 'Divisi Hubungan Masyarakat',
    approval: 'Agus Salim',
    status: 'Disetujui',
    konsumsi: [
      { jenis: 'Snack Box Premium', qty: 15, satuan: 'Box' },
      { jenis: 'Kopi dan Teh', qty: 15, satuan: 'Set' },
    ],
    catatan: 'Harap sediakan makanan bebas gluten untuk satu tamu.',
    statusHistory: [
      { timestamp: getNowTimestamp(), status: 'Menunggu', oleh: 'Siti Aminah' },
      { timestamp: new Date(Date.now() - 100000).toLocaleString('id-ID'), status: 'Disetujui', oleh: 'Agus Salim' },
    ],
    createdAt: Date.now() - 10000000,
  },
  {
    id: 'ORD003',
    acara: 'Pelatihan Keamanan Siber',
    tanggal: getYesterdayDateFormatted(),
    waktu: '09:00',
    lokasi: 'Aula Serbaguna',
    tamu: 'internal',
    yangMengajukan: 'Joko Prabowo',
    untukBagian: 'Divisi IT',
    approval: 'Dewi Rahayu',
    status: 'Ditolak',
    konsumsi: [
      { jenis: 'Coffee Break (Pagi)', qty: 50, satuan: 'Porsi' },
      { jenis: 'Lunch Box', qty: 50, satuan: 'Pcs' },
    ],
    catatan: 'Anggaran melebihi batas, ajukan ulang dengan menu standar.',
    statusHistory: [
      { timestamp: getNowTimestamp(), status: 'Menunggu', oleh: 'Joko Prabowo' },
      { timestamp: new Date(Date.now() - 200000).toLocaleString('id-ID'), status: 'Ditolak', oleh: 'Dewi Rahayu' },
    ],
    createdAt: Date.now() - 20000000,
  },
    {
    id: 'ORD004',
    acara: 'Perayaan Ulang Tahun Perusahaan',
    tanggal: getCurrentDateFormatted(),
    waktu: '19:00',
    lokasi: 'Restoran The Valley',
    tamu: 'internal',
    yangMengajukan: 'Ratna Sari',
    untukBagian: 'Divisi SDM',
    approval: 'Agus Salim',
    status: 'Menunggu',
    konsumsi: [
      { jenis: 'Dinner Buffet VVIP', qty: 100, satuan: 'Porsi' },
      { jenis: 'Minuman Soda', qty: 100, satuan: 'Kaleng' },
    ],
    catatan: 'Acara di luar kantor, pastikan logistik pengiriman lancar.',
    statusHistory: [
      { timestamp: getNowTimestamp(), status: 'Menunggu', oleh: 'Ratna Sari' },
    ],
    createdAt: Date.now() - 50000,
  },
];


// =================================================================
// --- KOMPONEN UI STUB (Disesuaikan untuk Dark Mode) ---
// =================================================================
// Menggunakan motion.button untuk efek klik yang halus
const MotionButton = motion.button;
const Button = ({ children, className, ...props }) => <MotionButton 
    whileTap={{ scale: 0.95 }}
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${className || 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-gray-700 dark:text-gray-50 dark:hover:bg-gray-600'}`} 
    {...props}>
        {children}
    </MotionButton>;

// Card diperbarui untuk mode gelap dan transisi warna
const Card = ({ children, className, ...props }) => <div className={`rounded-lg border bg-white text-slate-900 shadow-sm transition-colors duration-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 ${className}`} {...props}>{children}</div>;
const CardHeader = ({ children, className, ...props }) => <div className={`flex flex-col space-y-1.5 p-6 transition-colors duration-300 ${className}`} {...props}>{children}</div>;
const CardTitle = ({ children, className, ...props }) => <h3 className={`text-lg font-semibold leading-none tracking-tight transition-colors duration-300 ${className}`} {...props}>{children}</h3>;
const CardContent = ({ children, className, ...props }) => <div className={`p-6 pt-0 transition-colors duration-300 ${className}`} {...props}>{children}</div>;

// --- IKON BANTUAN (Tidak Berubah) ---
const PlusCircle = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>;
const ClockIcon = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const CheckCircle2 = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const XCircleIcon = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
const Download = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;
const Eye = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const FileTextIcon = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>;
const Trash2 = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>;
const CalendarIcon = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const MapPinIcon = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const ListIcon = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>;
const GridIcon = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>;
const XIcon = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const AlertTriangleIcon = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" x2="12" y1="9" y2="13"></line><line x1="12" x2="12.01" y1="17" y2="17"></line></svg>;
// Ikon Dark Mode/Light Mode
const SunIcon = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>;
const MoonIcon = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>;


// --- KOMPONEN BARU: TIMELINE STATUS (Diperbarui untuk ikon yang lebih dinamis) ---
const getStatusIconAndColor = (status: Status) => {
    switch(status) {
        case 'Disetujui':
            return { Icon: CheckCircle2, color: 'bg-green-500' };
        case 'Ditolak':
            return { Icon: XCircleIcon, color: 'bg-red-500' };
        case 'Menunggu':
        default:
            return { Icon: ClockIcon, color: 'bg-yellow-500' };
    }
}

const StatusTimeline: React.FC<{ history: Pemesanan['statusHistory'] }> = ({ history }) => (
  <div className="mt-6">
    <h4 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-100 transition-colors duration-300">Status Riwayat</h4>
    <div className="relative border-l-2 border-slate-200 dark:border-gray-600 ml-3 transition-colors duration-300">
      {Array.isArray(history) && history.length > 0 ? (
        history.map((item, index) => {
            const { Icon, color } = getStatusIconAndColor(item.status);
            return (
          <div key={index} className="mb-8 flex items-start transition-colors duration-300">
            <div className={`absolute -left-4 top-1 h-7 w-7 ${color} rounded-full flex items-center justify-center text-white shadow-md transition-colors duration-300`}>
              <Icon className="w-4 h-4" />
              
            </div>
            <div className="ml-8">
              <p className="font-semibold text-gray-700 dark:text-gray-200 text-base transition-colors duration-300">{item.status}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">[{item.timestamp}] oleh {item.oleh}</p>
            </div>
          </div>
            );
        })
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 ml-8 transition-colors duration-300">Tidak ada riwayat status yang tersedia.</p>
      )}
    </div>
  </div>
);

// --- KOMPONEN BARU: MODAL DETAIL PEMESANAN ---
const PemesananDetailModal: React.FC<{ pesanan: Pemesanan | null, onClose: () => void }> = ({ pesanan, onClose }) => {
  if (!pesanan) return null;

  const statusBadgeClasses = {
    Disetujui: 'bg-green-100 text-green-800 border-green-500 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
    Ditolak: 'bg-red-100 text-red-800 border-red-500 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
    Menunggu: 'bg-yellow-100 text-yellow-800 border-yellow-500 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 transition-colors duration-300"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-colors duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10 transition-colors duration-300">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate transition-colors duration-300">Detail Pesanan ({pesanan.id})</h3>
            <Button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-gray-700 bg-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-100">
              <XIcon className="w-5 h-5" />
            </Button>
          </div>
          <div className="overflow-y-auto p-6 flex-grow">
            {/* Status Badge */}
            <div className={`inline-flex items-center rounded-full px-4 py-1.5 text-base font-bold mb-6 border-2 ${statusBadgeClasses[pesanan.status]} transition-colors duration-300`}>
              Status: {pesanan.status}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-4">
              <div><strong className="block text-slate-500 dark:text-gray-400 text-sm transition-colors duration-300">Acara:</strong> <span className="text-gray-800 dark:text-gray-100 font-medium transition-colors duration-300">{pesanan.acara}</span></div>
              <div><strong className="block text-slate-500 dark:text-gray-400 text-sm transition-colors duration-300">Tanggal Pengiriman:</strong> <span className="text-gray-800 dark:text-gray-100 font-medium transition-colors duration-300">{pesanan.tanggal}</span></div>
              <div><strong className="block text-slate-500 dark:text-gray-400 text-sm transition-colors duration-300">Waktu:</strong> <span className="text-gray-800 dark:text-gray-100 font-medium transition-colors duration-300">{pesanan.waktu}</span></div>
              <div><strong className="block text-slate-500 dark:text-gray-400 text-sm transition-colors duration-300">Lokasi:</strong> <span className="text-gray-800 dark:text-gray-100 font-medium transition-colors duration-300">{pesanan.lokasi}</span></div>
              <div><strong className="block text-slate-500 dark:text-gray-400 text-sm transition-colors duration-300">Jenis Tamu:</strong> <span className="text-gray-800 dark:text-gray-100 font-medium capitalize transition-colors duration-300">{pesanan.tamu}</span></div>
              <div><strong className="block text-slate-500 dark:text-gray-400 text-sm transition-colors duration-300">Yang Mengajukan:</strong> <span className="text-gray-800 dark:text-gray-100 font-medium transition-colors duration-300">{pesanan.yangMengajukan}</span></div>
              <div><strong className="block text-slate-500 dark:text-gray-400 text-sm transition-colors duration-300">Untuk Bagian:</strong> <span className="text-gray-800 dark:text-gray-100 font-medium transition-colors duration-300">{pesanan.untukBagian}</span></div>
              <div><strong className="block text-slate-500 dark:text-gray-400 text-sm transition-colors duration-300">Approval:</strong> <span className="text-gray-800 dark:text-gray-100 font-medium transition-colors duration-300">{pesanan.approval}</span></div>
            </div>
            
            <div className="mt-6 border-t dark:border-gray-700 pt-4 transition-colors duration-300">
              <h4 className="font-semibold text-lg mb-3 text-gray-800 dark:text-gray-100 transition-colors duration-300">Detail Konsumsi</h4>
              {pesanan.konsumsi && pesanan.konsumsi.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border dark:border-gray-700 transition-colors duration-300">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-300">
                      <thead className="bg-slate-50 dark:bg-gray-700 transition-colors duration-300">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">Jenis</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-300">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-300">
                        {pesanan.konsumsi.map((k, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-300">
                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors duration-300">{k.jenis}</td>
                            <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-gray-700 dark:text-gray-200 transition-colors duration-300">{k.qty} {k.satuan}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              ) : <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Tidak ada detail konsumsi.</p>}
              {pesanan.catatan && (
                  <div className="mt-6 p-4 bg-slate-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 transition-colors duration-300">
                      <strong className="block text-slate-600 dark:text-gray-300 text-sm mb-1 transition-colors duration-300">Catatan Tambahan:</strong> 
                      <p className="text-gray-800 dark:text-gray-100 text-sm italic transition-colors duration-300">{pesanan.catatan}</p>
                  </div>
              )}
            </div>

            <StatusTimeline history={pesanan.statusHistory} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// --- KOMPONEN BARU: MODAL KONFIRMASI HAPUS ---
const DeleteConfirmationModal: React.FC<{ isOpen: boolean, onClose: () => void, onConfirm: () => void, orderAcara: string | undefined }> = ({ isOpen, onClose, onConfirm, orderAcara }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex items-center justify-center p-4 transition-colors duration-300"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: -20, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 text-center transition-colors duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 transition-colors duration-300">
            <AlertTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="mt-5 text-2xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">Hapus Pesanan</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-300 transition-colors duration-300">
            Apakah Anda yakin ingin menghapus pesanan <strong className="font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-300">"{orderAcara}"</strong>? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button onClick={onClose} className="w-full rounded-lg bg-slate-200 dark:bg-gray-700 px-6 py-3 text-base font-semibold text-gray-800 dark:text-gray-100 hover:bg-slate-300 dark:hover:bg-gray-600 transition-colors">
              Batalkan
            </Button>
            <Button onClick={onConfirm} className="w-full rounded-lg bg-red-600 px-6 py-3 text-base font-semibold text-white hover:bg-red-700 transition-colors">
              Ya, Hapus
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};


// --- KOMPONEN STATCARD ---
const StatCard = ({ icon, title, value, colorClass }) => (
  <div className={`p-5 rounded-xl shadow-lg flex items-center space-x-4 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${colorClass}`}>
    <div className="text-4xl opacity-80">{icon}</div>
    <div>
      <p className="font-bold text-2xl">{value}</p>
      <p className="text-sm uppercase font-semibold opacity-70 tracking-wider">{title}</p>
      
    </div>
  </div>
);

// --- TIPE PROPS DASHBOARD ---
interface PemesananDashboardProps {
  isLoading: boolean;
  filteredAndSortedRiwayat: Pemesanan[];
  counts: { Menunggu: number; Disetujui: number; Ditolak: number };
  onNewOrderClick: () => void;
  searchDate: string;
  filterStatus: 'Semua' | 'Menunggu' | 'Disetujui' | 'Ditolak';
  sortOrder: 'Terbaru' | 'Terlama';
  isDarkMode: boolean; // New prop
  toggleDarkMode: () => void; // New prop
  actions: {
    setSearchDate: (date: string) => void;
    setFilterStatus: (status: 'Semua' | 'Menunggu' | 'Disetujui' | 'Ditolak') => void;
    setSortOrder: (order: 'Terbaru' | 'Terlama') => void;
    updateOrderStatus: (id: string, newStatus: 'Disetujui' | 'Ditolak') => void;
    deleteOrder: (id: string, acara: string) => void;
    exportCSV: () => void;
  };
}


// --- KOMPONEN UTAMA DASHBOARD (Dari Input User) ---
const PemesananDashboard: React.FC<PemesananDashboardProps> = ({
  isLoading,
  filteredAndSortedRiwayat,
  counts,
  onNewOrderClick,
  searchDate,
  filterStatus,
  sortOrder,
  isDarkMode, // New prop
  toggleDarkMode, // New prop
  actions,
}) => {

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPemesanan, setSelectedPemesanan] = useState<Pemesanan | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<{id: string, acara: string} | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const finalRiwayat = filteredAndSortedRiwayat; 

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleViewDetails = (pemesanan: Pemesanan) => {
    setSelectedPemesanan(pemesanan);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPemesanan(null);
  };

  const handleUpdateStatus = (id: string, newStatus: 'Disetujui' | 'Ditolak') => {
    actions.updateOrderStatus(id, newStatus);
  };

  const handleOpenDeleteModal = (id: string, acara: string) => {
    setOrderToDelete({ id, acara });
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setOrderToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (!orderToDelete) return;
    actions.deleteOrder(orderToDelete.id, orderToDelete.acara); 
    handleCloseDeleteModal();
  };
    
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseModal();
        handleCloseDeleteModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const statusClasses = {
    Disetujui: 'border-green-500 bg-green-100 hover:bg-green-200 shadow-sm dark:bg-green-900/50 dark:hover:bg-green-900/70',
    Ditolak: 'border-red-500 bg-red-100 hover:bg-red-200 shadow-sm dark:bg-red-900/50 dark:hover:bg-red-900/70',
    Menunggu: 'border-yellow-500 bg-yellow-100 hover:bg-yellow-200 shadow-sm dark:bg-yellow-900/50 dark:hover:bg-yellow-900/70',
  };
  
  // Classes for Input and Select fields
  const formControlClasses = "h-10 border border-slate-300 dark:border-gray-600 rounded-md px-3 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100 transition-colors duration-300";


  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        // Main background container has transition-colors duration-300
        className="p-4 sm:p-6 md:p-8 bg-slate-50 dark:bg-gray-900 min-h-screen font-sans transition-colors duration-300"
      >
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-50 transition-colors duration-300">Dasbor Pesanan</h2>
            <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">Selamat datang! Berikut ringkasan pesanan Anda.</p>
            <div className='flex items-center gap-4 mt-2'>
              <p className="text-lg text-gray-700 dark:text-gray-200 font-semibold transition-colors duration-300">
                {currentTime.toLocaleString('id-ID', {
                  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit', second: '2-digit'
                })}
              </p>
              {/* Dark Mode Toggle Button menggunakan MotionButton untuk efek klik dan transisi ikon */}
              <MotionButton 
                onClick={toggleDarkMode} 
                className={`h-10 w-10 p-0 rounded-full bg-transparent ${isDarkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-slate-700 hover:bg-slate-200'}`}
                aria-label="Toggle Dark Mode"
                whileTap={{ scale: 0.8 }} // Efek animasi saat ditekan
                transition={{ type: "spring", stiffness: 400, damping: 17 }} // Transisi halus
              >
                {/* AnimatePresence untuk transisi ikon */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isDarkMode ? "moon" : "sun"}
                    initial={{ y: -20, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-5 h-5" />}
                  </motion.div>
                </AnimatePresence>
              </MotionButton>
            </div>
          </div>
          <Button onClick={onNewOrderClick} className="w-full md:w-auto transform hover:scale-105 transition-transform duration-300 bg-blue-600 text-white hover:bg-blue-700 h-11 px-8 rounded-lg shadow-lg shadow-blue-500/30">
            <PlusCircle className="mr-2 h-5 w-5" /> Buat Pesanan Baru
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {/* StatCards have their own color classes but keep the transition-all/duration for hover effect */}
          <StatCard icon={<ClockIcon/>} title="Menunggu" value={counts.Menunggu} colorClass="bg-gradient-to-br from-yellow-400 to-orange-500 text-white" />
          <StatCard icon={<CheckCircle2/>} title="Disetujui" value={counts.Disetujui} colorClass="bg-gradient-to-br from-green-500 to-teal-600 text-white" />
          <StatCard icon={<XCircleIcon/>} title="Ditolak" value={counts.Ditolak} colorClass="bg-gradient-to-br from-red-500 to-pink-600 text-white" />
        </div>

        <Card className="rounded-xl border shadow-lg overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center p-6 gap-4">
            <div>
              <CardTitle className="text-2xl font-semibold dark:text-gray-50">Riwayat Pemesanan</CardTitle>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-gray-700 p-1 transition-colors duration-300">
              <Button onClick={() => setViewMode('list')} className={`h-8 w-8 inline-flex items-center justify-center rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-md text-blue-600 dark:bg-gray-800 dark:text-blue-400' : 'bg-transparent text-slate-500 hover:bg-slate-200 dark:text-gray-400 dark:hover:bg-gray-600'}`}>
                <ListIcon className="w-5 h-5" />
              </Button>
              <Button onClick={() => setViewMode('grid')} className={`h-8 w-8 inline-flex items-center justify-center rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow-md text-blue-600 dark:bg-gray-800 dark:text-blue-400' : 'bg-transparent text-slate-500 hover:bg-slate-200 dark:text-gray-400 dark:hover:bg-gray-600'}`}>
                <GridIcon className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <div className="relative flex-grow sm:flex-grow-0">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 transition-colors duration-300" />
                    </div>
                    <input
                      type="date"
                      value={searchDate}
                      onChange={(e) => actions.setSearchDate(e.target.value)} 
                      className={`flex w-full pl-9 ${formControlClasses}`}
                    />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => actions.setFilterStatus(e.target.value as 'Semua' | 'Menunggu' | 'Disetujui' | 'Ditolak')} 
                  className={`w-full sm:w-[180px] ${formControlClasses}`}
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
                 <select
                  value={sortOrder}
                  onChange={(e) => actions.setSortOrder(e.target.value as 'Terbaru' | 'Terlama')} 
                  className={`w-full sm:w-[180px] ${formControlClasses}`}
                >
                  <option value="Terbaru">Terbaru</option>
                  <option value="Terlama">Terlama</option>
                </select>
              </div>
              <Button onClick={actions.exportCSV} className="w-full sm:w-auto border dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-100 hover:bg-slate-100 dark:hover:bg-gray-600 h-10 py-2 px-4 shadow-sm hover:shadow-md">
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
            <div className={viewMode === 'list' ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"}>
              {isLoading ? <p className="text-center text-slate-500 dark:text-gray-400 py-8 md:col-span-2 xl:col-span-3 transition-colors duration-300">Memuat data...</p> :
                finalRiwayat.length === 0 ? (
                <div className="text-center py-12 md:col-span-2 xl:col-span-3 transition-colors duration-300">
                  <FileTextIcon className="text-gray-300 dark:text-gray-600 w-24 h-24 mx-auto transition-colors duration-300"/>
                  <h4 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mt-4 transition-colors duration-300">Tidak Ada Pesanan Ditemukan</h4>
                  <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">Ubah filter Anda atau buat pesanan baru.</p>
                </div>
                ) : (
                <AnimatePresence>
                 {finalRiwayat.map((item: Pemesanan, index: number) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-4 rounded-xl flex transition-all duration-300 border-l-4 ${statusClasses[item.status]} ${viewMode === 'list' ? 'flex-col sm:flex-row justify-between sm:items-center gap-4' : 'flex-col gap-3'}`}
                    >
                      <div className="space-y-2 w-full">
                        <p className="font-bold text-gray-800 dark:text-gray-50 text-lg transition-colors duration-300">{item.acara}</p>
                        <div className={`text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-4 gap-y-1 ${viewMode === 'grid' ? 'flex-col items-start !gap-y-2' : 'items-center'}`}>
                          <div className="flex items-center gap-1.5 transition-colors duration-300">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{item.tanggal}</span>
                          </div>
                          <div className="flex items-center gap-1.5 transition-colors duration-300">
                            <ClockIcon className="w-4 h-4" />
                            <span>{item.waktu || '--:--'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 transition-colors duration-300">
                            <MapPinIcon className="w-4 h-4" />
                            <span className="truncate">{item.lokasi}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`flex items-center flex-wrap gap-2 ${viewMode === 'list' ? 'justify-end' : 'justify-between w-full border-t border-slate-200 dark:border-gray-700 pt-3 mt-2 transition-colors duration-300'}`}>
                        <div className="flex-shrink-0">
                          {item.status === 'Menunggu' ? (
                            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-100 dark:border-gray-600 dark:bg-gray-700 p-1 shadow-inner transition-colors duration-300">
                              <span className='flex items-center gap-1.5 px-2 py-1 text-xs font-bold rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 transition-colors duration-300'>
                                <ClockIcon className="w-3 h-3" />
                                {item.status}
                              </span>
                              <div className="h-5 w-px bg-slate-300 dark:bg-gray-600 transition-colors duration-300"></div>
                              <Button onClick={() => handleUpdateStatus(item.id, 'Disetujui')} className="h-7 px-2 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700 dark:bg-blue-800 dark:hover:bg-blue-700">Setujui</Button>
                              <Button onClick={() => handleUpdateStatus(item.id, 'Ditolak')} className="h-7 px-2 rounded-md bg-red-500 text-white text-xs hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-600">Tolak</Button>
                            </div>
                          ) : (
                            <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full ${
                              item.status === 'Disetujui' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            } transition-colors duration-300`}>
                              {item.status === 'Disetujui' ? <CheckCircle2 className="w-3 h-3" /> : <XCircleIcon className="w-3 h-3" />}
                              {item.status}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Button onClick={() => handleViewDetails(item)} className="h-10 w-10 hover:bg-slate-200/50 dark:hover:bg-gray-700/50 inline-flex items-center justify-center rounded-md bg-transparent text-slate-600 dark:text-gray-300 hover:text-slate-800 dark:hover:text-gray-100">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button className="text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50 h-10 w-10 inline-flex items-center justify-center rounded-md bg-transparent hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                )
              }
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {isModalOpen && <PemesananDetailModal pesanan={selectedPemesanan} onClose={handleCloseModal} />}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        orderAcara={orderToDelete?.acara}
      />
    </>
  );
}


// =================================================================
// --- KOMPONEN APLIKASI UTAMA (Menerapkan Hook/Logic dan Dark Mode) ---
// =================================================================
const App: React.FC = () => {
  const [pemesananData, setPemesananData] = useState<Pemesanan[]>(initialPemesananList);
  const [searchDate, setSearchDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Menunggu' | 'Disetujui' | 'Ditolak'>('Semua');
  const [sortOrder, setSortOrder] = useState<'Terbaru' | 'Terlama'>('Terbaru');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    () => localStorage.getItem('theme') === 'dark' || 
          (window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  // Effect untuk mengontrol class 'dark' pada elemen HTML root
  useEffect(() => {
    const root = document.documentElement;
    // Tambahkan class Tailwind yang mengaktifkan transisi CSS global
    root.classList.add('transition-colors', 'duration-500'); 
    
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };
  
  // Simulated Actions
  const updateOrderStatus = (id: string, newStatus: 'Disetujui' | 'Ditolak') => {
    setIsLoading(true);
    setTimeout(() => {
      setPemesananData(prevData =>
        prevData.map(item => {
          if (item.id === id) {
            const newHistoryItem: StatusHistoryItem = {
              timestamp: new Date().toLocaleString('id-ID'),
              status: newStatus,
              oleh: 'Admin Dashboard', // Simulating the approver
            };
            return {
              ...item,
              status: newStatus,
              statusHistory: [...item.statusHistory, newHistoryItem],
            };
          }
          return item;
        })
      );
      setIsLoading(false);
      console.log(`Pesanan ${id} berhasil diperbarui menjadi: ${newStatus}`);
    }, 500); // Simulate API call delay
  };

  const deleteOrder = (id: string, acara: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setPemesananData(prevData => prevData.filter(item => item.id !== id));
      setIsLoading(false);
      console.log(`Pesanan ${acara} (${id}) berhasil dihapus.`);
    }, 500); // Simulate API call delay
  };
  
  const onNewOrderClick = () => {
    // Diganti dari alert ke console.log sesuai instruksi, tetapi perlu diimplementasikan
    // dalam UI modal/pesan jika ini adalah aplikasi produksi.
    console.log("Navigasi ke halaman Buat Pesanan Baru.");
  };

  const exportCSV = () => {
    const header = [
      'ID', 'Acara', 'Tanggal', 'Waktu', 'Lokasi', 'Tamu', 
      'Pengaju', 'Bagian', 'Approval', 'Status', 'Konsumsi', 
      'Catatan', 'CreatedAt'
    ];
    
    const csvContent = pemesananData.map(item => {
      const konsumsiStr = item.konsumsi.map(k => `${k.jenis} (${k.qty} ${k.satuan})`).join('; ');
      return [
        item.id,
        item.acara,
        item.tanggal,
        item.waktu,
        item.lokasi,
        item.tamu,
        item.yangMengajukan,
        item.untukBagian,
        item.approval,
        item.status,
        `"${konsumsiStr}"`,
        `"${item.catatan || ''}"`,
        new Date(item.createdAt).toISOString()
      ].join(',');
    }).join('\n');
    
    const finalCsv = [header.join(','), csvContent].join('\n');
    
    // Simple download logic
    const blob = new Blob([finalCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'riwayat_pemesanan.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log("Data berhasil diekspor ke CSV.");
  };

  // Filtering and Sorting Logic (useMemo for performance)
  const filteredAndSortedRiwayat = useMemo(() => {
    let list = [...pemesananData];

    // 1. Filtering by Status
    if (filterStatus !== 'Semua') {
      list = list.filter(item => item.status === filterStatus);
    }

    // 2. Filtering by Date
    if (searchDate) {
      list = list.filter(item => item.tanggal === searchDate);
    }
    
    // 3. Sorting by Creation Date
    list.sort((a, b) => {
      if (sortOrder === 'Terbaru') {
        return b.createdAt - a.createdAt; // Descending
      } else {
        return a.createdAt - b.createdAt; // Ascending
      }
    });

    return list;
  }, [pemesananData, filterStatus, searchDate, sortOrder]);
  
  // Calculate Counts for StatCards
  const counts = useMemo(() => {
    return pemesananData.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, { Menunggu: 0, Disetujui: 0, Ditolak: 0 });
  }, [pemesananData]);


  const actions = {
    setSearchDate,
    setFilterStatus,
    setSortOrder,
    updateOrderStatus,
    deleteOrder,
    exportCSV,
  };

  return (
    <PemesananDashboard
      isLoading={isLoading}
      filteredAndSortedRiwayat={filteredAndSortedRiwayat}
      counts={counts}
      onNewOrderClick={onNewOrderClick}
      searchDate={searchDate}
      filterStatus={filterStatus}
      sortOrder={sortOrder}
      isDarkMode={isDarkMode}
      toggleDarkMode={toggleDarkMode}
      actions={actions}
    />
  );
};

export default App;
