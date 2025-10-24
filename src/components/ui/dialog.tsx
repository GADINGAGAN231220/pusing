import React, { createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

const DialogContext = createContext<{ open: boolean, onOpenChange: (open: boolean) => void} | undefined>(undefined);

const Dialog = ({ open, onOpenChange, ...props }) => {
    return <DialogContext.Provider value={{ open, onOpenChange }} {...props} />;
};

const DialogContent = ({ className, children, ...props }) => {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error("DialogContent must be used within a DialogProvider");
    }
    const { open, onOpenChange } = context;

    if (!open) return null;
    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => onOpenChange(false)}>
                <motion.div initial={{ scale: 0.95, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className={cn("relative z-50 grid w-full max-w-lg gap-4 border bg-white p-6 shadow-lg rounded-b-lg md:w-full md:rounded-lg", className)} onClick={e => e.stopPropagation()} {...props}>
                    {children}
                    <button onClick={() => onOpenChange(false)} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none">
                        <XIcon className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const DialogHeader = ({ className, ...props }) => <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />;
const DialogTitle = ({ className, ...props }) => <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
const DialogDescription = ({ className, ...props }) => <p className={cn("text-sm text-slate-500", className)} {...props} />;

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription };
