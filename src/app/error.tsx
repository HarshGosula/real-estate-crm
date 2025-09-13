// app/error.tsx
"use client";

import React from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
    // This component is rendered by Next.js when a Server or Client error occurs in the route tree
    React.useEffect(() => {
        console.error("Unhandled application error (app/error.tsx):", error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-slate-50 dark:bg-slate-900">
            <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border">
                <h1 className="text-2xl font-semibold text-rose-600 mb-2">Something went wrong</h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    An unexpected error occurred while loading this page. You can try refreshing or go back to the homepage.
                </p>

                <div className="mb-4">
                    <details className="bg-slate-50 dark:bg-slate-900 p-3 rounded text-xs text-slate-700 dark:text-slate-200">
                        <summary className="cursor-pointer font-medium">Error details (click to expand)</summary>
                        <pre className="whitespace-pre-wrap mt-2 text-xs">{String(error?.message ?? "No message")}</pre>
                        {error?.stack && <pre className="mt-2 text-xs text-slate-500 dark:text-slate-400">{error.stack}</pre>}
                    </details>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow"
                    >
                        Try again
                    </button>

                    <button
                        onClick={() => (window.location.href = "/")}
                        className="px-4 py-2 border rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                    >
                        Go to Home
                    </button>

                    <a
                        href="mailto:dev@example.com?subject=App%20Error"
                        className="ml-auto text-sm text-slate-500 dark:text-slate-400 underline"
                    >
                        Report this issue
                    </a>
                </div>
            </div>
        </div>
    );
}
