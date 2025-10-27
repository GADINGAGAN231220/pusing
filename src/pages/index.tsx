// src/pages/index.tsx

import React, { useState } from 'react';
import Head from "next/head";
import { motion, AnimatePresence } from 'framer-motion';
// Pastikan path hook sudah benar
import { usePemesanan } from '@/hooks/usePemesanan'; 
// Import Dashboard dan Form
import PemesananDashboard from '@/components/pemesanan/PemesananDashboard';
import PemesananForm from '@/components/pemesanan/PemesananForm';
import { Toaster } from '@/components/ui/toaster'; // Diperlukan untuk menampilkan toast

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

  // Logic Dark Mode (Dipertahankan dari file PemesananDashboard lama)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    () => typeof window !== 'undefined' && (localStorage.getItem('theme') === 'dark' || 
          (window.matchMedia('(prefers-color-scheme: dark)').matches))
  );

  React.useEffect(() => {
    const root = document.documentElement;
    // Tambahkan transisi CSS agar perubahan mode gelap halus
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
  
  const handleStartNewOrder = () => setCurrentView('form');
  const returnToDashboard = () => setCurrentView('dashboard');

  return (
    <>
      <Head>
        <title>Pemesanan Konsumsi</title>
        <meta name="description" content="Aplikasi Pemesanan Konsumsi menggunakan Next.js dan Tailwind CSS" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Container utama dengan background dan font */}
      <div className="bg-slate-50 dark:bg-gray-900 min-h-screen font-sans text-slate-900 dark:text-gray-100 transition-colors duration-300">
        
        {/* Konten Aplikasi */}
        <div className="container mx-auto p-0 max-w-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-6xl mx-auto" 
            >
              {currentView === 'dashboard' ? (
                  <PemesananDashboard 
                      isLoading={isLoading}
                      filteredAndSortedRiwayat={filteredAndSortedRiwayat}
                      counts={counts}
                      onNewOrderClick={handleStartNewOrder}
                      
                      searchDate={searchDate}
                      filterStatus={filterStatus}
                      sortOrder={sortOrder}
                      isDarkMode={isDarkMode} // Teruskan state dark mode
                      toggleDarkMode={toggleDarkMode} // Teruskan toggler dark mode
                      
                      actions={actions as any}
                  />
              ) : (
                  <PemesananForm 
                      riwayat={riwayat} 
                      onFormSubmit={(data) => {
                        actions.addOrder(data); 
                        returnToDashboard(); // Kembali ke dashboard setelah submit
                      }}
                      onReturnToDashboard={returnToDashboard}
                  />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Toaster untuk menampilkan notifikasi dari useToast */}
      <Toaster />
    </>
  );
}