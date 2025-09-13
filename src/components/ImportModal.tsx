// src/components/buyers/ImportModal.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
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
    const errorListRef = useRef<HTMLDivElement | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [preview, setPreview] = useState<Record<string, string>[]>([]);
    const [clientParseErrors, setClientParseErrors] = useState<string[]>([]);
    const [serverErrors, setServerErrors] = useState<ServerError[]>([]);
    const [insertedCount, setInsertedCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    // Focus errors area when errors change
    useEffect(() => {
        if (serverErrors.length > 0 && errorListRef.current) {
            errorListRef.current.focus();
        }
    }, [serverErrors.length]);

    function openFilePicker() {
        inputRef.current?.click();
    }

    function resetState() {
        setFileName(null);
        setPreview([]);
        setClientParseErrors([]);
        setServerErrors([]);
        setInsertedCount(null);
        setStatusMessage(null);
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
        setStatusMessage(null);

        Papa.parse<Record<string, string>>(f, {
            header: true,
            skipEmptyLines: true,
            preview: 20,
            complete: (result) => {
                if (result.errors && result.errors.length > 0) {
                    setClientParseErrors(result.errors.map((er) => `Row ${er.row}: ${er.message}`));
                    setPreview([]);
                    setStatusMessage("CSV parse errors detected on the client.");
                } else {
                    setPreview(result.data.slice(0, 10));
                    setStatusMessage(`${result.data.length} rows detected (previewing up to 10).`);
                }
            },
            error: (err) => {
                setClientParseErrors([err.message]);
                setStatusMessage("CSV parse failed on the client.");
            },
        });
    }

    function unifyErrorsFromPayload(payload: any) {
        // keep same unifier used earlier (compact)
        if (!payload) return [] as ServerError[];
        const out: ServerError[] = [];
        const arrays: any[] = [];
        if (Array.isArray(payload.errors)) arrays.push(payload.errors);
        if (Array.isArray(payload.invalid)) arrays.push(payload.invalid);
        if (Array.isArray(payload.warnings)) arrays.push(payload.warnings);
        if (arrays.length === 0 && Array.isArray(payload)) arrays.push(payload);

        arrays.forEach((arr) => {
            arr.forEach((item: any) => {
                const rowNum = item?.rowNum ?? item?.row ?? 0;
                const errs: RowError[] = [];
                if (Array.isArray(item.errors)) {
                    item.errors.forEach((e: any) => {
                        if (typeof e === "string") errs.push({ path: "row", message: e });
                        else errs.push({ path: String(e.path ?? "row"), message: String(e.message ?? JSON.stringify(e)) });
                    });
                } else if (item?.error) {
                    errs.push({ path: "row", message: String(item.error) });
                } else {
                    errs.push({ path: "row", message: JSON.stringify(item) });
                }
                const existing = out.find((x) => x.rowNum === rowNum);
                if (existing) existing.errors.push(...errs);
                else out.push({ rowNum, errors: errs });
            });
        });

        out.sort((a, b) => a.rowNum - b.rowNum);
        return out;
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
        setStatusMessage("Uploading & validating...");

        try {
            const text = await f.text();

            // Rate limit: this route should also have server-side check but we keep request client-side thin.
            const res = await fetch("/api/buyers/import", {
                method: "POST",
                headers: { "Content-Type": "text/csv" },
                body: text,
            });

            let payload: any = null;
            try {
                payload = await res.json();
            } catch (jsonErr) {
                const textResp = await res.text();
                throw new Error(`Server returned non-JSON response: ${textResp || res.statusText}`);
            }

            if (!res.ok) {
                const unified = unifyErrorsFromPayload(payload);
                if (unified.length > 0) {
                    setServerErrors(unified);
                    setStatusMessage(`Import finished with ${unified.length} rows having issues.`);
                } else {
                    alert("Import failed: " + (payload?.error || res.statusText || "Unknown error"));
                }
            } else {
                const inserted = Number(payload?.inserted ?? 0);
                setInsertedCount(inserted);
                const unified = unifyErrorsFromPayload(payload);
                setServerErrors(unified);
                if (inserted > 0) setStatusMessage(`Inserted ${inserted} buyer${inserted === 1 ? "" : "s"}.`);
                else setStatusMessage("No rows were inserted.");
            }
        } catch (err: any) {
            setServerErrors([{ rowNum: 0, errors: [{ path: "exception", message: String(err?.message ?? err) }] }]);
            setStatusMessage("Import failed with an exception.");
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
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg w-full max-w-2xl" role="dialog" aria-labelledby="import-title" aria-modal="true">
            <div className="flex justify-between items-center mb-4">
                <h3 id="import-title" className="text-lg font-semibold text-gray-900 dark:text-white">Import buyers (CSV)</h3>
            </div>

            {/* Hidden accessible label for file input */}
            <label htmlFor="csvFileInput" className="sr-only">Choose CSV file to import</label>
            <input id="csvFileInput" ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={handleFileChange} />

            <div className="flex gap-2 mb-3">
                <button onClick={openFilePicker} className="px-3 py-2 bg-blue-600 text-white rounded" aria-label="Choose CSV file">Choose CSV</button>
                <button onClick={handleImport} disabled={loading} className="px-3 py-2 bg-green-600 text-white rounded" aria-disabled={loading} aria-label="Import CSV">
                    {loading ? "Importing…" : "Import"}
                </button>
                <button onClick={resetState} className="px-3 py-2 border rounded">Reset</button>
            </div>

            {/* status announce to screen readers */}
            <div aria-live="polite" className="sr-only">{statusMessage ?? ""}</div>

            {fileName && <div className="text-sm mb-2">Selected file: {fileName}</div>}

            {clientParseErrors.length > 0 && (
                <div className="mb-3 text-sm text-red-600" role="alert" aria-live="assertive">
                    <div className="font-semibold">CSV parse errors (client)</div>
                    <ul className="list-disc pl-5">
                        {clientParseErrors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                </div>
            )}

            {preview.length > 0 && (
                <div className="mb-3">
                    <div className="text-sm font-medium mb-1">Preview (first {preview.length} rows)</div>
                    <div className="max-h-48 overflow-auto border rounded p-2 bg-slate-50 dark:bg-slate-900 text-xs" tabIndex={0}>
                        <table className="w-full" role="table" aria-label="CSV preview">
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
                <div className={`mb-3 text-sm ${insertedCount > 0 ? "text-green-600" : "text-yellow-600"}`} role="status">
                    {insertedCount > 0 ? `✅ Successfully inserted ${insertedCount} buyer${insertedCount === 1 ? "" : "s"}` : "⚠️ No buyers were inserted."}
                </div>
            )}

            {serverErrors && serverErrors.length > 0 && (
                <div className="mb-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-red-600">Errors / Warnings ({serverErrors.length} rows)</div>
                        <div className="flex items-center gap-2">
                            <button onClick={downloadErrorsCsv} className="px-2 py-1 border rounded text-sm">Download errors CSV</button>
                            <button onClick={() => errorListRef.current?.focus()} className="px-2 py-1 border rounded text-sm">Focus errors</button>
                        </div>
                    </div>

                    <div ref={errorListRef} tabIndex={-1} aria-live="polite" className="max-h-64 overflow-auto mt-2 text-xs border rounded p-2 bg-slate-50 dark:bg-slate-900">
                        <table className="w-full" role="table" aria-label="Import errors">
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
