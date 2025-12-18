'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

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

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [alerts, setAlerts] = useState<Alert[]>([]);

    const removeAlert = useCallback((id: string) => {
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    }, []);

    const showAlert = useCallback((type: AlertType, message: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        setAlerts((prev) => [...prev, { id, type, message }]);

        // Auto dismiss
        setTimeout(() => {
            removeAlert(id);
        }, 4000);
    }, [removeAlert]);

    const contextValue = useMemo(() => ({
        showAlert,
        success: (message: string) => showAlert('success', message),
        error: (message: string) => showAlert('error', message),
        info: (message: string) => showAlert('info', message),
        warning: (message: string) => showAlert('warning', message),
    }), [showAlert]);

    return (
        <AlertContext.Provider value={contextValue}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className={`
              pointer-events-auto
              min-w-[300px] max-w-sm
              bg-white border text-black
              px-4 py-3 shadow-sm
              animate-in slide-in-from-right fade-in duration-300
              flex items-start gap-3
              relative overflow-hidden
            `}
                    >
                        {/* Accent Line */}
                        <div
                            className={`absolute top-0 left-0 bottom-0 w-1
                ${alert.type === 'success' ? 'bg-green-400/50' : ''}
                ${alert.type === 'error' ? 'bg-red-400/50' : ''}
                ${alert.type === 'info' ? 'bg-sky-400/50' : ''}
                ${alert.type === 'warning' ? 'bg-yellow-400/50' : ''}
              `}
                        />

                        <div className="flex-1 text-sm font-light">
                            <p>{alert.message}</p>
                        </div>

                        <button
                            onClick={() => removeAlert(alert.id)}
                            className="text-gray-400 hover:text-black transition-colors"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </AlertContext.Provider>
    );
}
