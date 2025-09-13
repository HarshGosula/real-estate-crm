"use client";

import React from "react";
import { useSearchParams } from "next/navigation";

export default function ExportButton({ filters }: { filters?: Record<string, string | undefined> }) {
    const searchParams = useSearchParams();

    async function handleExport() {
        try {
            const params = new URLSearchParams();

            if (filters) {
                for (const [k, v] of Object.entries(filters)) {
                    if (v) params.set(k, v);
                }
            } else if (searchParams) {
                for (const key of Array.from(searchParams.keys())) {
                    if (key === "page" || key === "limit") continue;
                    const v = searchParams.get(key);
                    if (v) params.set(key, v);
                }
            }

            const url = "/api/buyers/export" + (params.toString() ? `?${params.toString()}` : "");
            const res = await fetch(url);
            if (!res.ok) {
                const payload = await res.json().catch(() => null);
                alert("Export failed: " + (payload?.error ?? res.statusText));
                return;
            }

            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = "buyers-export.csv";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err: any) {
            alert("Export failed: " + (err?.message ?? String(err)));
        }
    }

    return (
        <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 focus-ring"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Export</span>
        </button>
    );
}
