import React, { useState, useEffect, useMemo, useCallback, forwardRef, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Impor hook form, zod, dll.
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import *as z from "zod"; 

// =================================================================
// --- 1. TIPE DATA & INITAL DATA & HELPERS ---
// =================================================================
interface Konsumsi {
    jenis: string;
    qty: number;
    satuan: string; 
}
type Status = 'Menunggu' | 'Disetujui' | 'Ditolak' | 'Selesai';
interface StatusHistoryItem {
    status: Status;
    timestamp: string;
    oleh: string;
}
interface Pemesanan {
    id: string;
    acara: string;
    tanggal: string; // Format YYYY-MM-DD
    waktu: string; // Format waktu Pagi/Siang/Sore/Malam
    jamPengiriman: string; // Format HH:MM
    lokasi: string;
    tamu: 'standar' | 'reguler' | 'perta' | 'vip' | 'vvip';
    yangMengajukan: string;
    untukBagian: string;
    approval: string; 
    catatan?: string;
    konsumsi: Konsumsi[];
    status: Status;
    statusHistory: StatusHistoryItem[];
    createdAt: string; 
    updatedAt: string; 
}

// Helper untuk mendapatkan timestamp saat ini
const getNowTimestamp = () => new Date().toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
}).replace(/\./g, ':');

// --- DATA MASTER FORM (Disesuaikan dari Form Anda) ---

// Daftar Approval (Dummy)
const approvalList = [
    { id: '3072491', name: 'Raden Sulistyo (3072491)' },
    { id: '3072535', name: 'Arief Darmawan (3072535)' },
    { id: '1140122', name: 'Jojok Satriadi (1140122)' },
];
const approvalNames: string[] = approvalList.map(user => user.name);

const TINGKAT_TAMU = { 'standar': 1, 'reguler': 2, 'perta': 3, 'vip': 4, 'vvip': 5 };
const MASTER_KONSUMSI = [
    { id: 'std-nasi', nama: 'Nasi Box Standar', tamuMinLevel: 1, allowedWaktu: ['Siang', 'Malam'], img: 'https://placehold.co/200x200/F0F9FF/007AFF?text=Nasi+Std', defaultSatuan: 'kotak' },
    { id: 'std-snack', nama: 'Snack Box Standar', tamuMinLevel: 1, allowedWaktu: ['Pagi', 'Sore', 'Buka Puasa'], img: 'https://placehold.co/200x200/F0F9FF/007AFF?text=Snack+Std', defaultSatuan: 'box' },
    { id: 'std-kopi', nama: 'Kopi & Teh (Sachet)', tamuMinLevel: 1, allowedWaktu: ['Pagi', 'Sore'], img: 'https://placehold.co/200x200/F0F9FF/007AFF?text=Kopi', defaultSatuan: 'pax' },
    { id: 'reg-nasi', nama: 'Nasi Box Reguler', tamuMinLevel: 2, allowedWaktu: ['Siang', 'Malam'], img: 'https://placehold.co/200x200/F0F9FF/007AFF?text=Nasi+Reg', defaultSatuan: 'kotak' },
    { id: 'reg-prasmanan', nama: 'Prasmanan Reguler', tamuMinLevel: 2, allowedWaktu: ['Siang', 'Malam', 'Buka Puasa'], img: 'https://placehold.co/200x200/F0F9FF/007AFF?text=Prasmanan', defaultSatuan: 'pax' },
    { id: 'vip-prasmanan', nama: 'Prasmanan VIP', tamuMinLevel: 4, allowedWaktu: ['Siang', 'Malam', 'Buka Puasa'], img: 'https://placehold.co/200x200/F0F9FF/007AFF?text=Prasmanan+VIP', defaultSatuan: 'pax' },
    { id: 'vvip-snack', nama: 'Snack VVIP (High Tea)', tamuMinLevel: 5, allowedWaktu: ['Pagi', 'Sore', 'Buka Puasa'], img: 'https://placehold.co/200x200/F0F9FF/007AFF?text=Snack+VVIP', defaultSatuan: 'set' },
];
const getKonsumsiById = (id: string) => id ? MASTER_KONSUMSI.find(item => item.id === id) : undefined;

// Data dummy riwayat
const DUMMY_RIWAYAT: Pemesanan[] = [
    {
        id: 'P-001',
        acara: 'Rapat Tim Strategi Q4',
        tanggal: '2025-10-30',
        waktu: 'Siang',
        jamPengiriman: '10:00',
        lokasi: 'Ruang Meeting Alpha, Lantai 5',
        tamu: 'standar',
        yangMengajukan: 'Budi Santoso (IT)',
        untukBagian: 'Divisi IT',
        approval: 'Kepala Divisi IT',
        catatan: 'Dibutuhkan 10 set lengkap, tolong disajikan tepat waktu sebelum rapat dimulai.',
        status: 'Ditolak', 
        konsumsi: [
            { jenis: 'Nasi Box Standar', qty: 10, satuan: 'kotak' },
            { jenis: 'Kopi & Teh (Sachet)', qty: 10, satuan: 'pax' },
        ],
        statusHistory: [
            { status: 'Menunggu', timestamp: '24/10/2025 09:00:00', oleh: 'Sistem' },
            { status: 'Ditolak', timestamp: '24/10/2025 10:30:00', oleh: 'Kepala Divisi IT' } 
        ],
        createdAt: '2025-10-24T09:00:00Z',
        updatedAt: '2025-10-24T10:30:00Z',
    },
    {
        id: 'P-002',
        acara: 'Kunjungan Client Asia Raya',
        tanggal: '2025-11-05',
        waktu: 'Siang',
        jamPengiriman: '13:30',
        lokasi: 'Lounge Eksekutif, Lantai 10',
        tamu: 'vip',
        yangMengajukan: 'Dewi Lestari (Marketing)',
        untukBagian: 'Marketing',
        approval: 'Manager Marketing',
        catatan: 'Snack premium untuk 5 tamu eksternal. Hindari kacang-kacangan.',
        konsumsi: [
            { jenis: 'Prasmanan VIP', qty: 5, satuan: 'pax' },
        ],
        status: 'Selesai', 
        statusHistory: [
            { status: 'Menunggu', timestamp: '20/10/2025 14:00:00', oleh: 'Sistem' },
            { status: 'Disetujui', timestamp: '20/10/2025 16:30:00', oleh: 'Manager Marketing' },
            { status: 'Selesai', timestamp: '05/11/2025 14:00:00', oleh: 'Admin/Sistem' } 
        ],
        createdAt: '2025-10-20T14:00:00Z',
        updatedAt: '2025-11-05T14:00:00Z',
    },
    {
        id: 'P-003',
        acara: 'Serah Terima Proyek Baru',
        tanggal: '2025-10-15',
        waktu: 'Sore',
        jamPengiriman: '14:00',
        lokasi: 'Ruang Serba Guna',
        tamu: 'reguler',
        yangMengajukan: 'Andi Pratama (Proyek)',
        untukBagian: 'Proyek',
        approval: 'Manager Proyek',
        catatan: 'Acara sudah selesai. Feedback positif.',
        konsumsi: [
            { jenis: 'Kopi & Teh (Sachet)', qty: 8, satuan: 'pax' },
        ],
        status: 'Disetujui', 
        statusHistory: [
            { status: 'Menunggu', timestamp: '10/10/2025 10:00:00', oleh: 'Sistem' },
            { status: 'Disetujui', timestamp: '10/10/2025 11:00:00', oleh: 'Manager Proyek' },
        ],
        createdAt: '2025-10-10T10:00:00Z',
        updatedAt: '2025-10-15T16:00:00Z',
    },
];


// Fungsi untuk export data ke CSV (sederhana)
const exportToCSV = (data: Pemesanan[]) => {
    if (data.length === 0) return;
    const headers = [
        'ID', 'Acara', 'Tanggal', 'Waktu', 'Lokasi', 'Jenis Tamu', 'Pengaju', 'Untuk Bagian', 
        'Approval', 'Status', 'Konsumsi Detail', 'Catatan', 'Dibuat Pada'
    ].join(',');
    
    const rows = data.map(item => {
        const konsumsiDetail = item.konsumsi.map(k => `${k.qty} ${k.satuan} ${k.jenis}`).join('; ');
        return [
            `"${item.id}"`, 
            `"${item.acara.replace(/"/g, '""')}"`,
            `"${item.tanggal}"`,
            `"${item.waktu}"`,
            `"${item.lokasi.replace(/"/g, '""')}"`,
            `"${item.tamu}"`,
            `"${item.yangMengajukan.replace(/"/g, '""')}"`,
            `"${item.untukBagian}"`,
            `"${item.approval}"`,
            `"${item.status}"`,
            `"${konsumsiDetail.replace(/"/g, '""')}"`,
            `"${(item.catatan || '-').replace(/"/g, '""')}"`,
            `"${new Date(item.createdAt).toLocaleString('id-ID')}"`,
        ].join(',');
    });

    const csvContent = headers + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Riwayat_Pemesanan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('Data pesanan berhasil diexport ke CSV!');
};

// =================================================================
// --- 2. HOOK LOGIC (usePemesananData) ---
// =================================================================

const usePemesananData = () => {
    const [pemesananList, setPemesananList] = useState<Pemesanan[]>(DUMMY_RIWAYAT as Pemesanan[]); 
    const [isLoading, setIsLoading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    const [searchDate, setSearchDate] = useState('');
    const [filterStatus, setFilterStatus] = useState<'Semua' | Status | 'Aktif'>('Aktif');
    const [sortOrder, setSortOrder] = useState<'Terbaru' | 'Terlama'>('Terbaru');

    // EFFECT 1: Memuat data dari Local Storage (Hanya berjalan di sisi klien)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedList = localStorage.getItem('pemesananList');
            if (savedList) {
                setPemesananList(JSON.parse(savedList));
            }
            
            const savedMode = localStorage.getItem('darkMode');
            if (savedMode !== null) {
                 setIsDarkMode(savedMode === 'true');
            }
        }
    }, []);

    // EFFECT 2: Persist data dan dark mode
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('pemesananList', JSON.stringify(pemesananList));
        }
    }, [pemesananList]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (isDarkMode) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('darkMode', 'true');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('darkMode', 'false');
            }
        }
    }
    , [isDarkMode]);

    const toggleDarkMode = useCallback(() => {
        setIsDarkMode(prev => !prev);
    }, []);

    // Filtering and Sorting Logic
    const filteredAndSortedRiwayat = useMemo(() => {
        let result = [...pemesananList];

        if (searchDate) {
            result = result.filter(p => p.tanggal === searchDate);
        }

        if (filterStatus === 'Aktif') {
            result = result.filter(p => p.status === 'Menunggu' || p.status === 'Disetujui');
        } else if (filterStatus !== 'Semua') {
            result = result.filter(p => p.status === filterStatus);
        }

        result.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            
            if (sortOrder === 'Terbaru') {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });

        return result;
    }, [pemesananList, searchDate, filterStatus, sortOrder]);

    // Status Counts Diperbarui
    const counts = useMemo(() => {
        return pemesananList.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        }, { Menunggu: 0, Disetujui: 0, Ditolak: 0, Selesai: 0 } as Record<Status, number>);
    }, [pemesananList]);

    // --- CRUD Actions ---

    const updateOrderStatus = useCallback((id: string, newStatus: 'Disetujui' | 'Ditolak') => {
        setPemesananList(prevList => prevList.map(item => {
            if (item.id === id) {
                const newHistory = {
                    status: newStatus,
                    timestamp: getNowTimestamp(),
                    oleh: 'Admin/Approver'
                };
                return {
                    ...item,
                    status: newStatus,
                    statusHistory: [...item.statusHistory, newHistory],
                    updatedAt: new Date().toISOString(),
                };
            }
            return item;
        }));
    }, []);

    const markAsDone = useCallback((id: string) => {
        setPemesananList(prevList => prevList.map(item => {
            if (item.id === id && item.status === 'Disetujui') {
                const newStatus: Status = 'Selesai';
                const newHistory = {
                    status: newStatus,
                    timestamp: getNowTimestamp(),
                    oleh: 'Admin/Sistem'
                };
                return {
                    ...item,
                    status: newStatus,
                    statusHistory: [...item.statusHistory, newHistory],
                    updatedAt: new Date().toISOString(),
                };
            }
            return item;
        }));
    }, []);

    const deleteOrder = useCallback((id: string, acara: string) => {
        setIsLoading(true);
        setTimeout(() => {
            setPemesananList(prevList => prevList.filter(item => item.id !== id));
            setIsLoading(false);
            console.log(`Pesanan "${acara}" (ID: ${id}) telah berhasil dihapus.`);
        }, 500);
    }, []);

    const exportCSV = useCallback(() => {
        exportToCSV(filteredAndSortedRiwayat);
    }, [filteredAndSortedRiwayat]);
    
    // Fungsi addOrder yang dibutuhkan oleh Form (diaktifkan kembali)
    const addOrder = useCallback((formValues: any) => {
        setIsLoading(true);
        const newIdNumber = pemesananList.length > 0 
            ? Math.max(...pemesananList.map(p => parseInt(p.id.split('-')[1]) || 0)) + 1
            : 1;
        const newId = `P-${String(newIdNumber).padStart(3, '0')}`;
        const now = new Date().toISOString();
        const timestampId = getNowTimestamp();
        
        // MAPPING/PARSING DATA DARI FORMAT FORM KE FORMAT PEMESANAN
        const newPemesanan: Pemesanan = {
            id: newId,
            acara: formValues.acara,
            tanggal: formValues.tanggalPengiriman, // Mapping tglPengiriman ke tanggal
            waktu: formValues.waktu,
            jamPengiriman: formValues.jamPengiriman,
            lokasi: formValues.lokasi,
            tamu: formValues.tamu,
            yangMengajukan: formValues.yangMengajukan,
            untukBagian: formValues.untukBagian,
            approval: formValues.approval,
            catatan: formValues.catatan,
            status: 'Menunggu',
            statusHistory: [{ 
                status: 'Menunggu', 
                timestamp: timestampId, 
                oleh: formValues.yangMengajukan 
            }],
            createdAt: now,
            updatedAt: now,
            // KONVERSI QTY STRING KE NUMBER dan TAMBAH SATUAN
            konsumsi: formValues.konsumsi.map((k: any) => ({
                jenis: k.jenis, // Sudah difill oleh form
                qty: parseInt(k.qty, 10), // Konversi ke Number
                satuan: k.id ? (k.id.includes('nasi') ? 'kotak' : k.id.includes('snack') ? 'box' : 'pax') : 'unit', // Dummy satuan
            }))
        };

        setTimeout(() => {
            setPemesananList(prevList => [newPemesanan, ...prevList]);
            setIsLoading(false);
            console.log(`Pesanan "${newPemesanan.acara}" berhasil diajukan dengan ID ${newId}!`);
        }, 500);
    }, [pemesananList]);


    return {
        isLoading,
        filteredAndSortedRiwayat,
        counts,
        searchDate,
        filterStatus,
        sortOrder,
        isDarkMode,
        toggleDarkMode,
        actions: {
            setSearchDate,
            setFilterStatus,
            setSortOrder,
            updateOrderStatus,
            markAsDone, 
            deleteOrder,
            exportCSV,
            addOrder, // Diaktifkan kembali
        },
    };
};

// =================================================================
// --- 3. KOMPONEN UI STUBS & ICONS ---
// =================================================================
function cn(...inputs: (string | number | boolean | null | undefined | (string | number | boolean | null | undefined)[] | { [key: string]: any })[]) {
    const classes = new Set<string>();
    inputs.forEach(arg => {
        if (!arg) return;
        if (typeof arg === 'string' || typeof arg === 'number') { classes.add(String(arg)); }
        else if (Array.isArray(arg)) { arg.forEach(c => c && classes.add(String(c))); }
        else if (typeof arg === 'object') { Object.keys(arg).forEach(key => arg[key] && classes.add(key)); }
    });
    return Array.from(classes).join(' ');
}

const MotionButton = motion.button;
const Button = ({ children, className, ...props }: any) => <MotionButton 
    whileTap={{ scale: 0.95 }}
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${className || 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-gray-700 dark:text-gray-50 dark:hover:bg-gray-600'}`} 
    {...props}>
        {children}
    </MotionButton>;

const Card = ({ children, className, ...props }: any) => <div className={`rounded-lg border bg-white text-slate-900 shadow-sm transition-colors duration-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 ${className}`} {...props}>{children}</div>;
const CardHeader = ({ children, className, ...props }: any) => <div className={`flex flex-col space-y-1.5 p-6 transition-colors duration-300 ${className}`} {...props}>{children}</div>;
const CardTitle = ({ children, className, ...props }: any) => <h3 className={`text-lg font-semibold leading-none tracking-tight transition-colors duration-300 ${className}`} {...props}>{children}</h3>;
const CardContent = ({ children, className, ...props }: any) => <div className={`p-6 pt-0 transition-colors duration-300 ${className}`} {...props}>{children}</div>;

// --- IKON BANTUAN (Didefinisikan Lokal) ---
const PlusCircle = ({className = ""}: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>;
const ClockIcon = ({className = ""}: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const CheckCircle2 = ({className = ""}: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const XCircleIcon = ({className = ""}: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
const Download = ({className = ""}: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;
const Eye = ({className = ""}: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const FileTextIcon = ({className = ""}: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>;
const Trash2 = ({ className = "" }: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>;
const CalendarIcon = ({className = ""}: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const MapPinIcon = ({className = ""}: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="12" r="3"/></svg>;
const ListIcon = ({ className = "" }: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>;
const GridIcon = ({ className = "" }: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>;
const XIcon = ({ className = "" }: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const AlertTriangleIcon = ({ className = "" }: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const SunIcon = ({className = ""}: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>;
const MoonIcon = ({className = ""}: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>;

// Ikon Status Baru (Solid)
const Hourglass = ({className = ""}: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 21.6V16a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v5.6"/><path d="M17 2.4V8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V2.4"/><path d="M6 16h12"/><path d="M6 8h12"/></svg>;
const CheckCircle = ({className = ""}: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const XOctagon = ({className = ""}: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const CheckSquare = ({className = ""}: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1 2-3h11"/></svg>;


// --- KOMPONEN STATCARD MODIFIKASI: Ikon dan Badge Minimalis (Seperti E-commerce App) ---
const StatCard = ({ icon, title, value, onClick }: any) => {
    
    let iconColorClass = '';
    let badgeColor = '';
    let borderColorClass = '';

    if (title === 'MENUNGGU') {
        iconColorClass = 'text-yellow-500 dark:text-yellow-400';
        badgeColor = 'bg-yellow-500';
        borderColorClass = 'border-yellow-500';
    } else if (title === 'DISETUJUI') {
        iconColorClass = 'text-green-600 dark:text-green-500';
        badgeColor = 'bg-green-600';
        borderColorClass = 'border-green-600';
    } else if (title === 'SELESAI') {
        iconColorClass = 'text-blue-600 dark:text-blue-500';
        badgeColor = 'bg-blue-600';
        borderColorClass = 'border-blue-600';
    } else if (title === 'DITOLAK') {
        iconColorClass = 'text-red-600 dark:text-red-500';
        badgeColor = 'bg-red-600';
        borderColorClass = 'border-red-600';
    }

    return (
        <motion.div 
            // Ubah class untuk border dan padding/shadow
            className={`flex flex-col items-center p-4 text-center cursor-pointer bg-white dark:bg-gray-800 rounded-xl border-t-4 shadow-md hover:shadow-xl transition-all duration-300 min-w-[70px] ${borderColorClass} border-b-2`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
        >
            <div className="relative mb-2">
                {/* Ikon Utama */}
                <div className={`text-4xl ${iconColorClass} transition-colors duration-300`}>{icon}</div>

                {/* Badge Notifikasi/Count */}
                {value > 0 && (
                    <motion.span
                        key={value}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`absolute top-0 right-0 -mt-1 -mr-1 transform translate-x-1/2 -translate-y-1/2 rounded-full ${badgeColor} px-2 py-0.5 text-xs font-bold text-white shadow-md transition-colors duration-300`}
                    >
                        {value > 99 ? '99+' : value}
                    </motion.span>
                )}
            </div>
            {/* Judul Status */}
            <p className="text-xs font-semibold uppercase text-slate-700 dark:text-gray-300 mt-1">{title}</p>
        </motion.div>
    );
};


// --- KOMPONEN DETAIL & MODALS ---

const getStatusIconAndColor = (status: Status) => {
    switch(status) {
        case 'Disetujui':
            return { Icon: CheckCircle2, color: 'bg-green-500' };
        case 'Ditolak':
            return { Icon: XCircleIcon, color: 'bg-red-500' };
        case 'Selesai': 
            return { Icon: CheckSquare, color: 'bg-blue-600' };
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
            const { Icon, color } = getStatusIconAndColor(item.status as Status);
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

const PemesananDetailModal: React.FC<{ pesanan: Pemesanan | null, onClose: () => void }> = ({ pesanan, onClose }) => {
    if (!pesanan) return null;

    const statusBadgeClasses = {
        Disetujui: 'bg-green-100 text-green-800 border-green-500 dark:bg-green-900 dark:text-green-200 dark:border-border-green-700',
        Ditolak: 'bg-red-100 text-red-800 border-red-500 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
        Menunggu: 'bg-yellow-100 text-yellow-800 border-yellow-500 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700',
        Selesai: 'bg-blue-100 text-blue-800 border-blue-500 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
    };
    
    const ModalReviewItem = ({ label, value }: { label: string, value: string }) => (<div><strong className="block text-slate-500 dark:text-gray-400 text-sm">{label}:</strong><span className="text-gray-800 dark:text-gray-100 text-base">{value || '-'}</span></div>);

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
                            <ModalReviewItem label="Acara" value={pesanan.acara} />
                            <ModalReviewItem label="Tanggal Pengiriman" value={pesanan.tanggal} />
                            <ModalReviewItem label="Waktu" value={`${pesanan.waktu} (${pesanan.jamPengiriman})`} />
                            <ModalReviewItem label="Lokasi" value={pesanan.lokasi} />
                            <ModalReviewItem label="Jenis Tamu" value={pesanan.tamu?.charAt(0).toUpperCase() + pesanan.tamu?.slice(1)} />
                            <ModalReviewItem label="Yang Mengajukan" value={pesanan.yangMengajukan} />
                            <ModalReviewItem label="Untuk Bagian" value={pesanan.untukBagian} />
                            <ModalReviewItem label="Approval" value={pesanan.approval} />
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


// --- KOMPONEN DASHBOARD UTAMA ---
interface PemesananDashboardProps {
    isLoading: boolean;
    filteredAndSortedRiwayat: Pemesanan[];
    counts: { Menunggu: number; Disetujui: number; Ditolak: number; Selesai: number }; 
    searchDate: string;
    filterStatus: 'Semua' | Status | 'Aktif';
    sortOrder: 'Terbaru' | 'Terlama';
    isDarkMode: boolean; 
    toggleDarkMode: () => void; 
    actions: {
        setSearchDate: (date: string) => void;
        setFilterStatus: (status: 'Semua' | Status | 'Aktif') => void;
        setSortOrder: (order: 'Terbaru' | 'Terlama') => void;
        updateOrderStatus: (id: string, newStatus: 'Disetujui' | 'Ditolak') => void;
        markAsDone: (id: string) => void; 
        deleteOrder: (id: string, acara: string) => void;
        exportCSV: () => void;
    };
    onNewOrderClick: () => void; // Diaktifkan kembali
}


const PemesananDashboard: React.FC<PemesananDashboardProps> = ({
    isLoading,
    filteredAndSortedRiwayat,
    counts,
    searchDate,
    filterStatus,
    sortOrder,
    isDarkMode, 
    toggleDarkMode, 
    actions,
    onNewOrderClick, // Diaktifkan kembali
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

    const handleMarkAsDone = (id: string) => { 
        actions.markAsDone(id);
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
        Selesai: 'border-blue-600 bg-blue-100 hover:bg-blue-200 shadow-sm dark:bg-blue-900/50 dark:hover:bg-blue-900/70',
    };
    
    const formControlClasses = "h-10 border border-slate-300 dark:border-gray-600 rounded-md px-3 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100 transition-colors duration-300";

    const handleStatClick = (status: Status | 'Aktif') => {
        actions.setFilterStatus(status);
    };


    return (
        <>
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="p-4 sm:p-6 md:p-8 transition-colors duration-300"
            >
                {/* MODIFIKASI HEADER UTAMA */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                    
                    {/* Container Kiri: Logo dan Judul */}
                    <div className="flex items-start space-x-3 flex-grow"> 
                        {/* 1. LOGO KUJANG.PNG (2x lebih besar: w-20 h-20) */}
                        <div className="w-20 h-20 flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 bg-white shadow-xl mt-[-5px]">
                            {/* Mengganti placeholder dengan /kujang.png */}
                            <img 
                                src="/kujang.png" 
                                alt="Logo Kujang" 
                                className="w-full h-full object-cover" 
                                onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/CCCDDD/808080?text=KUJANG'}
                            />
                        </div>
                        <div className="flex flex-col space-y-0.5">
                            {/* 2. TEKS JUDUL SESUAI GAMBAR BARU */}
                            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-50 transition-colors duration-300 tracking-tight leading-none">
                                Selamat Datang <span className="text-blue-600 dark:text-blue-400">Sobat</span>
                            </h2>
                            <p className="text-base font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                                Semua Pesanan Ada Dalam Genggamanmu.
                            </p>
                        </div>
                    </div>
                    
                    {/* Container Kanan: Waktu dan Dark Mode Toggle */}
                    <div className="flex flex-col items-end gap-2 w-full md:w-auto mt-4 md:mt-0">
                        {/* Waktu/Tanggal yang Diperbarui */}
                        <motion.div 
                            className="flex items-center px-4 py-2 rounded-full bg-slate-200/60 dark:bg-gray-700/60 text-slate-700 dark:text-gray-200 text-sm font-semibold shadow-inner transition-colors duration-300 whitespace-nowrap"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {currentTime.toLocaleString('id-ID', {
                                weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                            })}
                            <span className='ml-2 font-bold text-blue-700 dark:text-blue-300'>
                                {currentTime.toLocaleString('id-ID', {
                                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                                })}
                            </span>
                        </motion.div>
                        
                        <MotionButton 
                            onClick={toggleDarkMode} 
                            className={`h-10 w-10 p-0 rounded-full bg-transparent ${isDarkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-slate-700 hover:bg-slate-200'}`}
                            aria-label="Toggle Dark Mode"
                            whileTap={{ scale: 0.8 }} 
                            transition={{ type: "spring", stiffness: 400, damping: 17 }} 
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={isDarkMode ? "moon" : "sun"}
                                    initial={{ y: -20, opacity: 0, rotate: -90 }}
                                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                                    exit={{ y: 20, opacity: 0, rotate: 90 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                                </motion.div>
                            </AnimatePresence>
                        </MotionButton>

                        <Button onClick={onNewOrderClick} className="w-full md:w-auto transform hover:scale-105 transition-transform duration-300 bg-blue-600 text-white hover:bg-blue-700 h-11 px-8 rounded-lg shadow-lg shadow-blue-500/30">
                            <PlusCircle className="mr-2 h-5 w-5" /> Buat Pesanan Baru
                        </Button>
                    </div>
                </div>

                {/* MODIFIKASI STATCARD DI SINI: Layout Horizontal Ringkas */}
                <div className="flex flex-row justify-between items-start mb-8 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 overflow-x-auto gap-4">
                    
                    {/* Container Status Card */}
                    {/* Menggunakan grid-cols-4 untuk memastikan 4 kolom tetap ada (dan overflow di mobile) */}
                    <div className="flex space-x-2 w-full justify-between sm:justify-around">
                        {/* Tambahkan onClick untuk StatCard */}
                        <StatCard 
                            icon={<Hourglass className="w-8 h-8"/>} 
                            title="MENUNGGU" 
                            value={counts.Menunggu} 
                            onClick={() => actions.setFilterStatus('Menunggu')}
                        />
                        <StatCard 
                            icon={<CheckCircle className="w-8 h-8"/>} 
                            title="DISETUJUI" 
                            value={counts.Disetujui} 
                            onClick={() => actions.setFilterStatus('Disetujui')}
                        />
                        <StatCard 
                            icon={<CheckSquare className="w-8 h-8"/>}
                            title="SELESAI" 
                            value={counts.Selesai} 
                            onClick={() => actions.setFilterStatus('Selesai')}
                        />
                        <StatCard 
                            icon={<XOctagon className="w-8 h-8"/>} 
                            title="DITOLAK" 
                            value={counts.Ditolak} 
                            onClick={() => actions.setFilterStatus('Ditolak')}
                        />
                    </div>
                </div>
                {/* AKHIR MODIFIKASI STATCARD */}

                <Card className="rounded-xl border shadow-lg overflow-hidden">
                    <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center p-6 gap-4">
                        <div>
                            {/* Judul Riwayat disesuaikan berdasarkan filter yang aktif */}
                            <CardTitle className="text-2xl font-semibold dark:text-gray-50">
                                {filterStatus === 'Aktif' ? 'Pesanan Aktif' : 
                                 filterStatus === 'Semua' ? 'Semua Riwayat Pemesanan' :
                                 `Riwayat Status: ${filterStatus}`}
                            </CardTitle>
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
                                    onChange={(e) => actions.setFilterStatus(e.target.value as 'Semua' | Status | 'Aktif')} 
                                    className={`w-full sm:w-[180px] ${formControlClasses}`}
                                >
                                    <option value="Aktif">Aktif (Menunggu & Disetujui)</option> 
                                    <option value="Semua">Semua Status</option>
                                    <option value="Menunggu">Menunggu</option>
                                    <option value="Disetujui">Disetujui</option>
                                    <option value="Selesai">Selesai</option>
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
                                                    <span>{item.jamPengiriman || '--:--'}</span>
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
                                                ) : item.status === 'Disetujui' ? ( 
                                                    <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-100 dark:bg-gray-600 dark:bg-gray-700 p-1 shadow-inner transition-colors duration-300">
                                                        <span className='flex items-center gap-1.5 px-2 py-1 text-xs font-bold rounded-md bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 transition-colors duration-300'>
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            {item.status}
                                                        </span>
                                                        <div className="h-5 w-px bg-slate-300 dark:bg-gray-600 transition-colors duration-300"></div>
                                                        <Button onClick={() => handleMarkAsDone(item.id)} className="h-7 px-2 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700 dark:bg-blue-800 dark:hover:bg-blue-700">Tandai Selesai</Button>
                                                    </div>
                                                ) : ( 
                                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full ${
                                                        item.status === 'Disetujui' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                        item.status === 'Selesai' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
                                                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    } transition-colors duration-300`}>
                                                        {item.status === 'Disetujui' ? <CheckCircle2 className="w-3 h-3" /> : item.status === 'Selesai' ? <CheckSquare className="w-3 h-3" /> : <XCircleIcon className="w-3 h-3" />}
                                                        {item.status}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center">
                                                <Button onClick={() => handleViewDetails(item)} className="h-10 w-10 hover:bg-slate-200/50 dark:hover:bg-gray-700/50 inline-flex items-center justify-center rounded-md bg-transparent text-slate-600 dark:text-gray-300 hover:text-slate-800 dark:hover:text-gray-100">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button className="text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50 h-10 w-10 inline-flex items-center justify-center rounded-md bg-transparent hover:text-red-700" onClick={() => handleOpenDeleteModal(item.id, item.acara)}>
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

// --- KOMPONEN UTAMA APLIKASI (WRAPPER) ---
const App: React.FC = () => {
    
    const { 
        isLoading,
        filteredAndSortedRiwayat,
        counts,
        searchDate,
        filterStatus,
        sortOrder,
        isDarkMode,
        toggleDarkMode,
        actions,
    } = usePemesananData();
    
    // Logika Form Dihapus, tetapi kita perlu Dummy Form Component jika ingin mengaktifkan tombolnya
    const PemesananForm = ({ onReturnToDashboard, onFormSubmit, riwayat }: any) => (
         <div className="bg-gray-50 min-h-screen p-10 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg w-full text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Fitur Form Dinonaktifkan</h2>
                <p className="text-gray-600 mb-6">Untuk mengaktifkan form, silakan kembalikan kode Form Pemesanan yang lengkap.</p>
                <Button onClick={onReturnToDashboard} className="mt-4 bg-blue-600 hover:bg-blue-700">
                    Kembali ke Dasbor
                </Button>
            </div>
         </div>
    );
    
    // State untuk mengontrol view (Dashboard atau Form Penuh)
    const [currentView, setCurrentView] = useState<'dashboard' | 'form'>('dashboard');

    // Mengaktifkan kembali tombol Buat Pesanan Baru
    const handleNewOrderClick = () => {
        setCurrentView('form'); 
    };

    const handleFormSubmit = (formValues: any) => {
        // Karena form di App ini hanya dummy, kita hanya kembali ke dashboard
        actions.addOrder(formValues); // Simulasi penambahan data
        setCurrentView('dashboard'); 
    };
    
    const handleReturnToDashboard = () => {
        setCurrentView('dashboard');
    }


    return (
        <div className={`min-h-screen font-sans ${isDarkMode ? 'dark bg-gray-900' : 'bg-slate-50'}`}>
            <AnimatePresence mode="wait">
                {currentView === 'dashboard' ? (
                    <motion.div key="dashboard-view" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
                        <PemesananDashboard
                            isLoading={isLoading}
                            filteredAndSortedRiwayat={filteredAndSortedRiwayat}
                            counts={counts}
                            onNewOrderClick={handleNewOrderClick} // <-- Trigger beralih ke Form
                            searchDate={searchDate}
                            filterStatus={filterStatus}
                            sortOrder={sortOrder}
                            isDarkMode={isDarkMode}
                            toggleDarkMode={toggleDarkMode}
                            actions={actions}
                        />
                    </motion.div>
                ) : (
                    <motion.div key="form-view" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                        {/* Tampilkan Form Penuh (Saat ini Dummy Page) */}
                         <PemesananForm
                            onFormSubmit={handleFormSubmit}
                            onReturnToDashboard={handleReturnToDashboard} 
                            riwayat={DUMMY_RIWAYAT as any} 
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            
        </div>
    );
};

export default App;