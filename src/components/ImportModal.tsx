// src/components/buyers/ImportModal.tsx
"use client";

import React, { useRef, useState } from "react";
import Papa from "papaparse";

type RowError = { path: string; message: string };
type ServerError = { rowNum: number; errors: RowError[] };

export default function ImportModal({
    onClose,
    onSuccess,
}: {
    onClose: () => void;
    onSuccess?: (count: number) => void;
}) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [preview, setPreview] = useState<Record<string, string>[]>([]);
    const [clientParseErrors, setClientParseErrors] = useState<string[]>([]);
    const [serverErrors, setServerErrors] = useState<ServerError[]>([]);
    const [insertedCount, setInsertedCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    function openFilePicker() {
        inputRef.current?.click();
    }

    function resetState() {
        setFileName(null);
        setPreview([]);
        setClientParseErrors([]);
        setServerErrors([]);
        setInsertedCount(null);
        if (inputRef.current) inputRef.current.value = "";
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) return;
        setFileName(f.name);
        setServerErrors([]);
        setInsertedCount(null);
        setClientParseErrors([]);
        setPreview([]);

        Papa.parse<Record<string, string>>(f, {
            header: true,
            skipEmptyLines: true,
            preview: 20,
            complete: (result) => {
                if (result.errors && result.errors.length > 0) {
                    setClientParseErrors(result.errors.map((er) => `Row ${er.row}: ${er.message}`));
                    setPreview([]);
                } else {
                    setPreview(result.data.slice(0, 10));
                }
            },
            error: (err) => {
                setClientParseErrors([err.message]);
            },
        });
    }

    async function handleImport() {
        const f = inputRef.current?.files?.[0];
        if (!f) {
            alert("Please choose a CSV file to import.");
            return;
        }

        setLoading(true);
        setServerErrors([]);
        setInsertedCount(null);

        try {
            const text = await f.text();

            // send raw CSV text
            const res = await fetch("/api/buyers/import", {
                method: "POST",
                headers: { "Content-Type": "text/csv" },
                body: text,
            });

            const payload = await res.json();

            if (!res.ok) {
                // server returned an error (not row-level)
                alert("Import failed: " + (payload?.error || res.statusText));
            } else {
                setInsertedCount(payload.inserted ?? 0);
                setServerErrors(payload.errors ?? []);
                if ((payload.inserted ?? 0) > 0) {
                    onSuccess?.(payload.inserted ?? 0);
                }
            }
        } catch (err: any) {
            alert("Import failed: " + (err?.message ?? String(err)));
        } finally {
            setLoading(false);
        }
    }

    function downloadErrorsCsv() {
        if (!serverErrors || serverErrors.length === 0) return;
        const rows: Array<{ rowNum: number; field: string; message: string }> = [];
        serverErrors.forEach((r) => {
            r.errors.forEach((e) => rows.push({ rowNum: r.rowNum, field: e.path, message: e.message }));
        });
        const csv = Papa.unparse(rows, { columns: ["rowNum", "field", "message"] });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "import-errors.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import buyers (CSV)</h3>
            </div>

            <input ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={handleFileChange} />

            <div className="flex gap-2 mb-3">
                <button onClick={openFilePicker} className="px-3 py-2 bg-blue-600 text-white rounded">Choose CSV</button>
                <button onClick={handleImport} disabled={loading} className="px-3 py-2 bg-green-600 text-white rounded">
                    {loading ? "Importing…" : "Import"}
                </button>
                <button onClick={resetState} className="px-3 py-2 border rounded">Reset</button>
            </div>

            {fileName && <div className="text-sm mb-2">Selected file: {fileName}</div>}

            {clientParseErrors.length > 0 && (
                <div className="mb-3 text-sm text-red-600">
                    <div className="font-semibold">CSV parse errors (client)</div>
                    <ul className="list-disc pl-5">
                        {clientParseErrors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                </div>
            )}

            {preview.length > 0 && (
                <div className="mb-3">
                    <div className="text-sm font-medium mb-1">Preview (first {preview.length} rows)</div>
                    <div className="max-h-48 overflow-auto border rounded p-2 bg-slate-50 dark:bg-slate-900 text-xs">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    {Object.keys(preview[0]).slice(0, 8).map((h) => <th key={h} className="text-left pr-2">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {preview.map((r, i) => (
                                    <tr key={i}>
                                        {Object.keys(preview[0]).slice(0, 8).map((k) => <td key={k} className="pr-2">{r[k]}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {insertedCount !== null && (
                <div className={`mb-3 text-sm ${insertedCount > 0 ? "text-green-600" : "text-yellow-600"}`}>
                    {insertedCount > 0 ? `✅ Successfully inserted ${insertedCount} buyers` : "⚠️ No buyers were inserted."}
                </div>
            )}

            {serverErrors && serverErrors.length > 0 && (
                <div className="mb-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-red-600">Errors / Warnings ({serverErrors.length} rows)</div>
                        <button onClick={downloadErrorsCsv} className="px-2 py-1 border rounded text-sm">Download errors CSV</button>
                    </div>

                    <div className="max-h-64 overflow-auto mt-2 text-xs border rounded p-2 bg-slate-50 dark:bg-slate-900">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left pr-2">Row</th>
                                    <th className="text-left pr-2">Field</th>
                                    <th className="text-left pr-2">Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {serverErrors.map((r, i) => (
                                    <React.Fragment key={i}>
                                        {r.errors.map((e, j) => (
                                            <tr key={j} className="border-b">
                                                <td className="pr-2 align-top">{r.rowNum}</td>
                                                <td className="pr-2">{e.path}</td>
                                                <td>{e.message}</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-2 mt-3">
                <button onClick={onClose} className="px-3 py-2 border rounded">Close</button>
            </div>
        </div>
    );
}
