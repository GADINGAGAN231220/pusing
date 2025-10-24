import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';

const ChevronDown = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;

interface SelectContextType {
    open: boolean;
    setOpen: (open: boolean) => void;
    value: any;
    onValueChange: (value: any) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

const Select = ({ value, onValueChange, children }) => {
    const [open, setOpen] = useState(false);
    return (
        <SelectContext.Provider value={{ open, setOpen, value, onValueChange }}>
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    );
};

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ className, children, ...props }, ref) => {
    const context = useContext(SelectContext);
    if (!context) throw new Error("SelectTrigger must be used within a Select");
    const { open, setOpen } = context;
    return (
        <button ref={ref} onClick={() => setOpen(!open)} className={cn("flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}>
            {children} <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder }) => {
    const context = useContext(SelectContext);
    if (!context) throw new Error("SelectValue must be used within a Select");
    const { value } = context;
    return <span>{value || placeholder}</span>;
};
SelectValue.displayName = "SelectValue";


const SelectContent = ({ children, className }) => {
    const context = useContext(SelectContext);
    if (!context) throw new Error("SelectContent must be used within a Select");
    const { open } = context;
    if (!open) return null;
    return <div className={cn("absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border bg-white text-slate-950 shadow-md", className)}>{children}</div>;
};
SelectContent.displayName = "SelectContent";


const SelectItem = ({ value, children, className }) => {
    const context = useContext(SelectContext);
    if (!context) throw new Error("SelectItem must be used within a Select");
    const { setOpen, onValueChange } = context;
    return (
        <div onClick={() => { onValueChange(value); setOpen(false); }} className={cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-slate-100", className)}>
            {children}
        </div>
    );
};
SelectItem.displayName = "SelectItem";


export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
