// src/components/buyers/BuyerActions.tsx
"use client";

import React, { useState, useCallback } from "react";
import ImportModal from "./ImportModal";
import ExportButton from "./ExportButton";
import { useSearchParams, useRouter } from "next/navigation";

export default function BuyerActions() {
    const [showImport, setShowImport] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();

    // Build filters object from URL search params (excluding page/limit)
    const filters: Record<string, string | undefined> = {};
    if (searchParams) {
        for (const key of Array.from(searchParams.keys())) {
            if (key === "page" || key === "limit") continue;
            const v = searchParams.get(key);
            if (v) filters[key] = v;
        }
    }

    // Called when the import modal succeeds
    const handleImportSuccess = useCallback(
        (count: number) => {
            setToast({ type: "success", message: `${count} buyers imported` });
            setShowImport(false);
            // Refresh server components and data
            try {
                router.refresh();
            } catch {
                // no-op if router.refresh not available
            }
            // hide toast after 3s
            setTimeout(() => setToast(null), 3000);
        },
        [router]
    );

    const handleImportError = useCallback((message: string) => {
        setToast({ type: "error", message });
        setTimeout(() => setToast(null), 4000);
    }, []);

    return (
        <>
            <div className="flex items-center gap-2">
                {/* Import */}
                <button
                    onClick={() => setShowImport(true)}
                    aria-label="Import buyers from CSV"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 focus-ring"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    <span className="hidden sm:inline">Import</span>
                </button>

                {/* Export (uses current filters) */}
                <ExportButton filters={filters} />
            </div>

            {/* Import modal */}
            {showImport && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowImport(false)} />
                    <div className="relative z-10 w-full max-w-2xl">
                        <ImportModal
                            onClose={() => setShowImport(false)}
                            onSuccess={(count) => handleImportSuccess(count)}
                        />
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div
                    className={`fixed right-4 bottom-6 z-60 max-w-xs px-4 py-2 rounded-lg text-sm shadow-lg ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                        }`}
                    role="status"
                >
                    {toast.message}
                </div>
            )}
        </>
    );
}
