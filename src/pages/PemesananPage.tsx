import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Pastikan path ini benar
import { usePemesanan } from '../hooks/usePemesanan'; 

// Asumsi path impor komponen sudah benar
import PemesananDashboard from '../components/pemesanan/PemesananDashboard';
import PemesananForm from '../components/pemesanan/PemesananForm';

// (Removed unused placeholder Dialog components)


export default function PemesananPage() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'form'
  
  // Ambil semua yang dibutuhkan dari custom hook
  const {
    riwayat,
    filteredAndSortedRiwayat,
    counts,
    actions, 
    isLoading,
    searchDate,
    filterStatus,
    sortOrder,
  } = usePemesanan();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    // Apply/Remove `dark` class on the root element so Tailwind's dark: utilities take effect
    useEffect(() => {
        try {
            const root = document.documentElement;
            if (isDarkMode) root.classList.add('dark');
            else root.classList.remove('dark');
        } catch {
            // ignore server-side / non-DOM environments
        }
    }, [isDarkMode]);

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
                        
                        // Dark mode
                        isDarkMode={isDarkMode}
                        toggleDarkMode={toggleDarkMode}
                        
                        // Teruskan actions yang dibutuhkan Dashboard
                        actions={actions as {
                            setSearchDate: (date: string) => void;
                            setFilterStatus: (status: string) => void;
                            setSortOrder: (order: string) => void;
                            updateOrderStatus: (id: string, status: string) => void;
                            markAsDone: (id: string) => void;
                            deleteOrder: (id: string, acara: string) => void;
                            exportCSV: () => void;
                            addOrder: (order: unknown) => void;
                        }}
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
                        riwayat={riwayat as never} 
                        onFormSubmit={(data) => actions.addOrder(data as never)} 
                        onReturnToDashboard={returnToDashboard}
                    />
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}