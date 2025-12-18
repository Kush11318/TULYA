'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface Alert {
    id: string;
    type: AlertType;
    message: string;
}

interface AlertContextType {
    showAlert: (type: AlertType, message: string) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function useAlert() {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
}

// Alias for a toast-style hook name
export function useToast() {
    return useAlert();
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [alerts, setAlerts] = useState<Alert[]>([]);

    const removeAlert = useCallback((id: string) => {
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    }, []);

    const showAlert = useCallback(
        (type: AlertType, message: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        setAlerts((prev) => [...prev, { id, type, message }]);

        setTimeout(() => {
            removeAlert(id);
            }, 3800);
        },
        [removeAlert],
    );

    const contextValue = useMemo(
        () => ({
        showAlert,
        success: (message: string) => showAlert('success', message),
        error: (message: string) => showAlert('error', message),
        info: (message: string) => showAlert('info', message),
        warning: (message: string) => showAlert('warning', message),
        }),
        [showAlert],
    );

    return (
        <AlertContext.Provider value={contextValue}>
            {children}
            <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className="pointer-events-auto relative flex min-w-[280px] max-w-sm items-start gap-3 overflow-hidden rounded-md border border-slate-100 bg-white px-4 py-3 text-slate-900 shadow-sm animate-in slide-in-from-right fade-in duration-300"
                    >
                        <div
                            className={`absolute inset-y-0 left-0 w-1
                ${
                    alert.type === 'success'
                        ? 'bg-emerald-400/70'
                        : alert.type === 'error'
                        ? 'bg-rose-400/70'
                        : alert.type === 'info'
                        ? 'bg-sky-500/70'
                        : 'bg-amber-400/70'
                }`}
                        />

                        <div className="ml-2 flex-1 text-sm font-light">
                            <p>{alert.message}</p>
                        </div>

                        <button
                            type="button"
                            onClick={() => removeAlert(alert.id)}
                            className="ml-2 text-xs text-slate-400 transition-colors hover:text-slate-700"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </AlertContext.Provider>
    );
}
