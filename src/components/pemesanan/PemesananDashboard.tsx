import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Asumsi path import sudah benar
import { type Pemesanan, type Status } from '@/hooks/usePemesanan'; // Impor tipe dari hook

// =================================================================
// --- KOMPONEN UI STUBS & ICONS --- (Salin dari kode sebelumnya)
// =================================================================
// Fungsi cn (classnames)
function cn(...inputs: (string | number | boolean | null | undefined | (string | number | boolean | null | undefined)[] | Record<string, unknown>)[]) {
    const classes = new Set<string>();
    inputs.forEach(arg => {
        if (!arg) return;
        if (typeof arg === 'string' || typeof arg === 'number') { classes.add(String(arg)); }
        else if (Array.isArray(arg)) { arg.forEach(c => c && classes.add(String(c))); }
        else if (typeof arg === 'object') { Object.keys(arg).forEach(key => arg[key] && classes.add(key)); }
    });
    return Array.from(classes).join(' ');
}

// Komponen Button, Card, CardHeader, CardTitle, CardContent (Salin dari kode sebelumnya)
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }> = ({ children, className, ...props }) => {
    return (
        <button
            className={cn(`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none`, className || 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-gray-700 dark:text-gray-50 dark:hover:bg-gray-600')}
            {...props}>
            {children}
        </button>
    );
};

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => <div className={cn("rounded-lg border bg-white text-slate-900 shadow-sm transition-colors duration-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700", className)} {...props}>{children}</div>;
const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => <div className={cn("flex flex-col space-y-1.5 p-6 transition-colors duration-300", className)} {...props}>{children}</div>;
const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => <h3 className={cn("text-lg font-semibold leading-none tracking-tight transition-colors duration-300", className)} {...props}>{children}</h3>;
const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => <div className={cn("p-6 pt-0 transition-colors duration-300", className)} {...props}>{children}</div>;


// --- IKON BANTUAN (Salin semua ikon dari kode sebelumnya) ---
type IconProps = { className?: string };
const PlusCircle = ({className = ""}: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>;
const ClockIcon = ({className = ""}: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const CheckCircle2 = ({className = ""}: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const XCircleIcon = ({className = ""}: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
const Download = ({className = ""}: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;
const Eye = ({className = ""}: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const FileTextIcon = ({className = ""}: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>;
const Trash2 = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>;
const CalendarIcon = ({className = ""}: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const MapPinIcon = ({className = ""}: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="12" r="3"/></svg>;
const ListIcon = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>;
const GridIcon = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>;
const XIcon = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const AlertTriangleIcon = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const SunIcon = ({className = ""}: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>;
const MoonIcon = ({className = ""}: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>;
const Hourglass = ({className = ""}: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 21.6V16a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v5.6"/><path d="M17 2.4V8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V2.4"/><path d="M6 16h12"/><path d="M6 8h12"/></svg>;
const CheckCircle = ({className = ""}: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const XOctagon = ({className = ""}: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const CheckSquare = ({className = ""}: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1 2-3h11"/></svg>;


// --- KOMPONEN STATCARD --- (Salin dari kode sebelumnya)
const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: number; onClick: () => void; }> = ({ icon, title, value, onClick }) => {
    let iconColorClass = '';
    let badgeColor = '';
    let borderColorClass = '';

    switch (title.toUpperCase()) {
        case 'MENUNGGU':
            iconColorClass = 'text-yellow-500 dark:text-yellow-400';
            badgeColor = 'bg-yellow-500';
            borderColorClass = 'border-yellow-500';
            break;
        case 'DISETUJUI':
            iconColorClass = 'text-green-600 dark:text-green-500';
            badgeColor = 'bg-green-600';
            borderColorClass = 'border-green-600';
            break;
        case 'SELESAI':
            iconColorClass = 'text-blue-600 dark:text-blue-500';
            badgeColor = 'bg-blue-600';
            borderColorClass = 'border-blue-600';
            break;
        case 'DITOLAK':
            iconColorClass = 'text-red-600 dark:text-red-500';
            badgeColor = 'bg-red-600';
            borderColorClass = 'border-red-600';
            break;
        default:
            iconColorClass = 'text-gray-500 dark:text-gray-400';
            badgeColor = 'bg-gray-500';
            borderColorClass = 'border-gray-500';
    }

    return (
        <motion.div
            className={`flex flex-col items-center p-4 text-center cursor-pointer bg-white dark:bg-gray-800 rounded-xl border-t-4 shadow-md hover:shadow-xl transition-all duration-300 min-w-[70px] ${borderColorClass} border-b-2`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
        >
            <div className="relative mb-2">
                <div className={`text-4xl ${iconColorClass} transition-colors duration-300`}>{icon}</div>
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
            <p className="text-xs font-semibold uppercase text-slate-700 dark:text-gray-300 mt-1">{title}</p>
        </motion.div>
    );
};


// --- KOMPONEN DETAIL & MODALS --- (Salin dari kode sebelumnya)
const getStatusIconAndColor = (status: Status) => {
    switch(status) {
        case 'Disetujui': return { Icon: CheckCircle2, color: 'bg-green-500' };
        case 'Ditolak': return { Icon: XCircleIcon, color: 'bg-red-500' };
        case 'Selesai': return { Icon: CheckSquare, color: 'bg-blue-600' };
        case 'Menunggu': default: return { Icon: ClockIcon, color: 'bg-yellow-500' };
    }
}

const StatusTimeline: React.FC<{ history: Pemesanan['statusHistory'] }> = ({ history }) => (
  <div className="mt-6">
    <h4 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-100 transition-colors duration-300">Status Riwayat</h4>
    <div className="relative border-l-2 border-slate-200 dark:border-gray-600 ml-3 transition-colors duration-300">
      {Array.isArray(history) && history.length > 0 ? (
        history.map((item, index) => {
            const validStatus = ['Menunggu', 'Disetujui', 'Ditolak', 'Selesai'].includes(item.status) ? item.status : 'Menunggu';
            const { Icon, color } = getStatusIconAndColor(validStatus as Status);
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
    const statusBadgeClasses: Record<Status, string> = { /* ... Salin dari kode sebelumnya ... */
        Disetujui: 'bg-green-100 text-green-800 border-green-500 dark:bg-green-900 dark:text-green-200 dark:border-green-700', // Pastikan dark:border benar
        Ditolak: 'bg-red-100 text-red-800 border-red-500 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
        Menunggu: 'bg-yellow-100 text-yellow-800 border-yellow-500 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700',
        Selesai: 'bg-blue-100 text-blue-800 border-blue-500 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
    };
    const ModalReviewItem = ({ label, value }: { label: string, value: string | undefined }) => (<div><strong className="block text-slate-500 dark:text-gray-400 text-sm">{label}:</strong><span className="text-gray-800 dark:text-gray-100 text-base">{value || '-'}</span></div>);

    return ( <AnimatePresence>{/* ... Salin JSX lengkap PemesananDetailModal dari kode sebelumnya ... */}</AnimatePresence> ); // Placeholder singkat
};

const DeleteConfirmationModal: React.FC<{ isOpen: boolean, onClose: () => void, onConfirm: () => void, orderAcara: string | undefined }> = ({ isOpen, onClose, onConfirm, orderAcara }) => {
    if (!isOpen) return null;
    return ( <AnimatePresence>{/* ... Salin JSX lengkap DeleteConfirmationModal dari kode sebelumnya ... */}</AnimatePresence> ); // Placeholder singkat
};


// --- KOMPONEN DASHBOARD UTAMA ---
interface DashboardActions {
  setSearchDate: (date: string) => void;
  setFilterStatus: (status: 'Semua' | Status | 'Aktif') => void;
  setSortOrder: (order: 'Terbaru' | 'Terlama') => void;
  updateOrderStatus: (id: string, newStatus: 'Disetujui' | 'Ditolak') => void;
  markAsDone: (id: string) => void;
  deleteOrder: (id: string, acara: string) => void;
  exportCSV: () => void;
}

interface PemesananDashboardProps {
    isLoading: boolean;
    filteredAndSortedRiwayat: Pemesanan[];
    counts: { Menunggu: number; Disetujui: number; Ditolak: number; Selesai: number };
    searchDate: string;
    filterStatus: 'Semua' | Status | 'Aktif';
    sortOrder: 'Terbaru' | 'Terlama';
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    actions: DashboardActions;
    onNewOrderClick: () => void;
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
    onNewOrderClick,
}) => {

    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPemesanan, setSelectedPemesanan] = useState<Pemesanan | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<{id: string, acara: string} | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // State baru untuk mengatasi hydration mismatch
    const [isClient, setIsClient] = useState(false); // Default false

    const finalRiwayat = filteredAndSortedRiwayat;

    // useEffect untuk set isClient dan timer waktu
    useEffect(() => {
        setIsClient(true); // Set true hanya di client setelah mount

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer); // Cleanup timer saat unmount
    }, []); // Dependency array kosong

    // useEffect untuk handle Esc key
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleCloseModal();
                handleCloseDeleteModal();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []); // Dependency array kosong


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


    const formControlClasses = "h-10 border border-slate-300 dark:border-gray-600 rounded-md px-3 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100 transition-colors duration-300";

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 sm:p-6 md:p-8 transition-colors duration-300"
            >
                {/* HEADER UTAMA */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                    {/* Container Kiri: Logo dan Judul */}
                    <div className="flex items-start space-x-3 flex-grow">
                        <div className="w-20 h-20 flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 bg-white shadow-xl mt-[-5px]">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img
                                src="/kujang.png"
                                alt="Logo Kujang"
                                className="w-full h-full object-cover"
                                onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/CCCDDD/808080?text=KUJANG'}
                            />
                        </div>
                        <div className="flex flex-col space-y-0.5">
                            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-50 transition-colors duration-300 tracking-tight leading-none">
                                Selamat Datang <span className="text-blue-600 dark:text-blue-400">Sobat</span>
                            </h2>
                            <p className="text-base font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
                                Semua Pesanan Ada Dalam Genggamanmu.
                            </p>
                        </div>
                    </div>

                    {/* Container Kanan: Waktu, Dark Mode, Tombol Baru */}
                    <div className="flex flex-col items-end gap-2 w-full md:w-auto mt-4 md:mt-0">
                        {/* Waktu/Tanggal */}
                        <motion.div
                            className="flex items-center px-4 py-2 rounded-full bg-slate-200/60 dark:bg-gray-700/60 text-slate-700 dark:text-gray-200 text-sm font-semibold shadow-inner transition-colors duration-300 whitespace-nowrap"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {/* ======================================= */}
                            {/* === PERBAIKAN HYDRATION DISINI === */}
                            {/* ======================================= */}
                            {isClient ? (
                                <>
                                    {currentTime.toLocaleString('id-ID', {
                                        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                                    })}
                                    <span className='ml-2 font-bold text-blue-700 dark:text-blue-300'>
                                        {currentTime.toLocaleString('id-ID', {
                                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                                        })}
                                    </span>
                                </>
                            ) : (
                                // Placeholder saat SSR atau sebelum client mount
                                <span>Memuat waktu...</span>
                            )}
                            {/* ======================================= */}
                            {/* === AKHIR PERBAIKAN HYDRATION === */}
                            {/* ======================================= */}
                        </motion.div>

                        {/* Dark Mode Toggle */}
                        <motion.button
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
                        </motion.button>

                        {/* Tombol Buat Pesanan Baru */}
                        <Button onClick={onNewOrderClick} className="w-full md:w-auto transform hover:scale-105 transition-transform duration-300 bg-blue-600 text-white hover:bg-blue-700 h-11 px-8 rounded-lg shadow-lg shadow-blue-500/30">
                            <PlusCircle className="mr-2 h-5 w-5" /> Buat Pesanan Baru
                        </Button>
                    </div>
                </div>

                {/* STATCARD */}
                <div className="flex flex-row justify-between items-start mb-8 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 overflow-x-auto gap-4">
                    <div className="flex space-x-2 w-full justify-between sm:justify-around">
                        <StatCard icon={<Hourglass className="w-8 h-8"/>} title="MENUNGGU" value={counts.Menunggu} onClick={() => actions.setFilterStatus('Menunggu')} />
                        <StatCard icon={<CheckCircle className="w-8 h-8"/>} title="DISETUJUI" value={counts.Disetujui} onClick={() => actions.setFilterStatus('Disetujui')} />
                        <StatCard icon={<CheckSquare className="w-8 h-8"/>} title="SELESAI" value={counts.Selesai} onClick={() => actions.setFilterStatus('Selesai')} />
                        <StatCard icon={<XOctagon className="w-8 h-8"/>} title="DITOLAK" value={counts.Ditolak} onClick={() => actions.setFilterStatus('Ditolak')} />
                    </div>
                </div>

                {/* RIWAYAT / DAFTAR PESANAN */}
                <Card className="rounded-xl border shadow-lg overflow-hidden">
                    <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center p-6 gap-4">
                        {/* ... (Konten CardHeader: Judul, Tombol List/Grid) ... */}
                        <div>
                             <CardTitle className="text-2xl font-semibold dark:text-gray-50">
                                {filterStatus === 'Aktif' ? 'Pesanan Aktif' :
                                 filterStatus === 'Semua' ? 'Semua Riwayat Pemesanan' :
                                `Riwayat Status: ${filterStatus}`}
                            </CardTitle>
                        </div>
                        <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-gray-700 p-1 transition-colors duration-300">
                             <Button onClick={() => setViewMode('list')} className={`h-8 w-8 inline-flex items-center justify-center rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-md text-blue-600 dark:bg-gray-800 dark:text-blue-400' : 'bg-transparent text-slate-500 hover:bg-slate-200 dark:text-gray-400 dark:hover:bg-gray-600'}`}> <ListIcon className="w-5 h-5" /> </Button>
                             <Button onClick={() => setViewMode('grid')} className={`h-8 w-8 inline-flex items-center justify-center rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow-md text-blue-600 dark:bg-gray-800 dark:text-blue-400' : 'bg-transparent text-slate-500 hover:bg-slate-200 dark:text-gray-400 dark:hover:bg-gray-600'}`}> <GridIcon className="w-5 h-5" /> </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                        {/* Filter & Export */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
                            {/* ... (Konten Filter: Input Tanggal, Select Status, Select Sort) ... */}
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                 <div className="relative flex-grow sm:flex-grow-0">
                                     <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"> <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 transition-colors duration-300" /> </div>
                                     <input type="date" value={searchDate} onChange={(e) => actions.setSearchDate(e.target.value)} className={`flex w-full pl-9 ${formControlClasses}`} />
                                 </div>
                                 <select value={filterStatus} onChange={(e) => actions.setFilterStatus(e.target.value as 'Semua' | Status | 'Aktif')} className={`w-full sm:w-[180px] ${formControlClasses}`}>
                                     <option value="Aktif">Aktif (Menunggu & Disetujui)</option>
                                     <option value="Semua">Semua Status</option>
                                     <option value="Menunggu">Menunggu</option>
                                     <option value="Disetujui">Disetujui</option>
                                     <option value="Selesai">Selesai</option>
                                     <option value="Ditolak">Ditolak</option>
                                 </select>
                                 <select value={sortOrder} onChange={(e) => actions.setSortOrder(e.target.value as 'Terbaru' | 'Terlama')} className={`w-full sm:w-[180px] ${formControlClasses}`}>
                                     <option value="Terbaru">Terbaru</option>
                                     <option value="Terlama">Terlama</option>
                                 </select>
                             </div>
                            <Button onClick={actions.exportCSV} className="w-full sm:w-auto border dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-100 hover:bg-slate-100 dark:hover:bg-gray-600 h-10 py-2 px-4 shadow-sm hover:shadow-md">
                                <Download className="mr-2 h-4 w-4" /> Export CSV
                            </Button>
                        </div>

                        {/* Daftar Pesanan */}
                        <div className={viewMode === 'list' ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"}>
                            {/* ... (Mapping finalRiwayat seperti kode sebelumnya) ... */}
                            {isLoading ? <p className="text-center text-slate-500 dark:text-gray-400 py-8 md:col-span-2 xl:col-span-3 transition-colors duration-300">Memuat data...</p> :
                                finalRiwayat.length === 0 ? (
                                    <div className="text-center py-12 md:col-span-2 xl:col-span-3 transition-colors duration-300">
                                        <FileTextIcon className="text-gray-300 dark:text-gray-600 w-24 h-24 mx-auto transition-colors duration-300"/>
                                        <h4 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mt-4 transition-colors duration-300">Tidak Ada Pesanan Ditemukan</h4>
                                        <p className="text-gray-500 dark:text-gray-400 transition-colors duration-300">Ubah filter Anda atau buat pesanan baru.</p>
                                    </div>
                                ) : (
                                <AnimatePresence>
                                    {finalRiwayat.map((item: Pemesanan, index: number) => {
                                        // ... (Logika day, month dari item.tanggal) ...
                                        let day = '--';
                                        let month = 'N/A';
                                        try {
                                            const dateObj = new Date(item.tanggal + 'T00:00:00Z');
                                            if (!isNaN(dateObj.getTime())) {
                                                day = dateObj.getUTCDate().toString().padStart(2, '0');
                                                month = dateObj.toLocaleString('id-ID', { month: 'short', timeZone: 'UTC' }).toUpperCase();
                                            }
                                        } catch (e) { /* Abaikan error parsing */ }

                                        return (
                                            <motion.div
                                                key={item.id}
                                                // ... (props motion lainnya)
                                                layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }} exit={{ opacity: 0, scale: 0.95 }}
                                                className={cn( /* ... className untuk item ... */
                                                    "p-4 rounded-xl flex items-center gap-4 transition-all duration-300",
                                                    "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md",
                                                    viewMode === 'grid' && 'flex-col items-stretch'
                                                )}
                                            >
                                                {/* Blok Tanggal */}
                                                <div className={cn( /* ... className untuk blok tanggal ... */
                                                    "flex-shrink-0 w-16 h-16 flex flex-col items-center justify-center rounded-lg shadow",
                                                    "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700",
                                                    viewMode === 'grid' && 'mb-3 self-center'
                                                )}>
                                                    <span className="text-xs font-bold tracking-wider">{month}</span>
                                                    <span className="text-2xl font-extrabold leading-tight">{day}</span>
                                                </div>
                                                {/* Konten Utama */}
                                                <div className={cn( /* ... className untuk konten utama ... */
                                                    "flex-grow flex flex-col sm:flex-row justify-between sm:items-center gap-2",
                                                    viewMode === 'grid' && 'w-full text-center sm:text-left'
                                                )}>
                                                    {/* Detail Acara */}
                                                    <div className={cn("space-y-1", viewMode === 'grid' && 'w-full mb-2')}>
                                                        <p className="font-bold text-gray-800 dark:text-gray-50 text-lg transition-colors duration-300">{item.acara}</p>
                                                        <div className={cn( /* ... className untuk detail waktu/lokasi ... */
                                                            "text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-1",
                                                            viewMode === 'grid' && 'justify-center sm:justify-start'
                                                        )}>
                                                            <div className="flex items-center gap-1.5 transition-colors duration-300"> <ClockIcon className="w-4 h-4" /> <span>{item.waktu} ({item.jamPengiriman || '--:--'})</span> </div>
                                                            <div className="flex items-center gap-1.5 transition-colors duration-300"> <MapPinIcon className="w-4 h-4" /> <span className="truncate">{item.lokasi}</span> </div>
                                                        </div>
                                                    </div>
                                                    {/* Status & Aksi */}
                                                    <div className={cn( /* ... className untuk status/aksi ... */
                                                        "flex items-center flex-wrap gap-2 flex-shrink-0",
                                                        viewMode === 'list' ? 'justify-end' : 'justify-center w-full mt-3 pt-3 border-t border-gray-200 dark:border-gray-700'
                                                    )}>
                                                        {/* Badge Status */}
                                                        <span className={cn( /* ... className untuk badge status ... */
                                                            'flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full',
                                                            item.status === 'Disetujui' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                            item.status === 'Selesai' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                            item.status === 'Ditolak' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                                                            'transition-colors duration-300'
                                                        )}>
                                                            {item.status === 'Disetujui' ? <CheckCircle2 className="w-3 h-3" /> :
                                                            item.status === 'Selesai' ? <CheckSquare className="w-3 h-3" /> :
                                                            item.status === 'Ditolak' ? <XCircleIcon className="w-3 h-3" /> :
                                                            <ClockIcon className="w-3 h-3" />} {item.status}
                                                        </span>
                                                        {/* Tombol Aksi Kondisional */}
                                                        {item.status === 'Menunggu' && ( /* ... Tombol Setujui/Tolak ... */
                                                            <div className="flex items-center gap-1">
                                                                <Button onClick={() => handleUpdateStatus(item.id, 'Disetujui')} className="h-7 px-2 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700 dark:bg-blue-800 dark:hover:bg-blue-700">Setujui</Button>
                                                                <Button onClick={() => handleUpdateStatus(item.id, 'Ditolak')} className="h-7 px-2 rounded-md bg-red-500 text-white text-xs hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-600">Tolak</Button>
                                                            </div>
                                                        )}
                                                        {item.status === 'Disetujui' && ( /* ... Tombol Selesai ... */
                                                            <Button onClick={() => handleMarkAsDone(item.id)} className="h-7 px-2 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700 dark:bg-blue-800 dark:hover:bg-blue-700">Selesai</Button>
                                                        )}
                                                        {/* Tombol Lihat Detail & Hapus */}
                                                        <div className="flex items-center">
                                                            <Button onClick={() => handleViewDetails(item)} className="h-8 w-8 hover:bg-slate-200/50 dark:hover:bg-gray-700/50 inline-flex items-center justify-center rounded-md bg-transparent text-slate-600 dark:text-gray-300 hover:text-slate-800 dark:hover:text-gray-100 p-0"> <Eye className="w-4 h-4" /> </Button>
                                                            { (item.status === 'Menunggu' || item.status === 'Ditolak') && ( /* ... Tombol Hapus ... */
                                                                <Button className="text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50 h-8 w-8 inline-flex items-center justify-center rounded-md bg-transparent hover:text-red-700 p-0" onClick={() => handleOpenDeleteModal(item.id, item.acara)}> <Trash2 className="w-4 h-4" /> </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                                )
                            }
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Modals */}
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

export default PemesananDashboard;