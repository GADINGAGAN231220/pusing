import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Pastikan path ini benar
import { usePemesanan } from '../hooks/usePemesanan'; 

// Asumsi path impor komponen sudah benar
import PemesananDashboard from '../components/pemesanan/PemesananDashboard';
import PemesananForm from '../components/pemesanan/PemesananForm';

// --- Placeholder Dialog Components ---
const Dialog: React.FC<React.PropsWithChildren<{ open: boolean, onOpenChange: (open: boolean) => void }>> = ({ children, open, onOpenChange }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => onOpenChange(false)}>
            {children}
        </div>
    );
};
const DialogContent: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => (
    <div className={`bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-auto ${className}`} onClick={(e) => e.stopPropagation()}>{children}</div>
);
const DialogHeader: React.FC<React.PropsWithChildren<{}>> = ({ children }) => <div className="p-6 border-b">{children}</div>;
const DialogTitle: React.FC<React.PropsWithChildren<{}>> = ({ children }) => <h3 className="text-xl font-bold text-gray-800">{children}</h3>;


export default function PemesananPage() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'form'
  
  // Ambil semua yang dibutuhkan dari custom hook
  const {
    riwayat,
    filteredAndSortedRiwayat,
    counts,
    actions, 
    isLoading,
    toast,
    searchDate,
    filterStatus,
    sortOrder,
  } = usePemesanan();

  const handleStartNewOrder = () => setCurrentView('form');
  const returnToDashboard = () => setCurrentView('dashboard');

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl">
        <header className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Pemesanan Konsumsi</h1>
            <p className="text-lg text-gray-500 mt-1">Kelola semua pesanan konsumsi untuk acara Anda.</p>
        </header>
        
        {/* AnimatePresence untuk transisi antar tampilan */}
        <AnimatePresence mode="wait">
            {currentView === 'dashboard' ? (
                <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <PemesananDashboard 
                        isLoading={isLoading}
                        filteredAndSortedRiwayat={filteredAndSortedRiwayat}
                        counts={counts}
                        onNewOrderClick={handleStartNewOrder}
                        
                        // Teruskan state filter/sort
                        searchDate={searchDate}
                        filterStatus={filterStatus}
                        sortOrder={sortOrder}
                        
                        // Teruskan actions yang dibutuhkan Dashboard
                        actions={actions as any} // Cast as any karena tipe actions di hook lebih detail
                    />
                </motion.div>
            ) : (
                <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="max-w-xl mx-auto"
                >
                    <PemesananForm 
                        riwayat={riwayat} 
                        onFormSubmit={actions.addOrder} 
                        onReturnToDashboard={returnToDashboard}
                    />
                </motion.div>
            )}
        </AnimatePresence>
        
        {/* Toast Notifikasi Global */}
        <AnimatePresence>
            {toast.show && (
                <motion.div 
                    key="toast-notification"
                    initial={{ opacity: 0, y: 50 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 20 }} 
                    transition={{ duration: 0.3 }}
                    className="fixed bottom-5 right-5 bg-slate-900 text-white p-4 rounded-lg shadow-lg z-50 w-80"
                >
                    <p className="font-bold">{toast.title}</p>
                    <p className="text-sm text-slate-300">{toast.description}</p>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}