"use client";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateBuyerSchema } from "@/lib/validations/buyer";
import {
    mapTimelineToForm,
    mapTimelineToDb,
    mapBhkToForm,
    mapBhkToDb,
    mapSourceToForm,
    mapSourceToDb,
} from "@/lib/mappers/buyers";
import { useRouter } from "next/navigation";

export default function BuyerEditClient({ buyer }: any) {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Delete states
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        resolver: zodResolver(updateBuyerSchema),
        defaultValues: {
            fullName: buyer.fullName,
            email: buyer.email ?? "",
            phone: buyer.phone,
            city: buyer.city,
            propertyType: buyer.propertyType,
            bhk: mapBhkToForm(buyer.bhk),
            purpose: buyer.purpose,
            budgetMin: buyer.budgetMin ?? "",
            budgetMax: buyer.budgetMax ?? "",
            timeline: mapTimelineToForm(buyer.timeline),
            source: mapSourceToForm(buyer.source),
            status: buyer.status,
            notes: buyer.notes ?? "",
            tags: (buyer.tags || []).join(", "),
            updatedAt: buyer.updatedAt instanceof Date
                ? buyer.updatedAt.toISOString()
                : buyer.updatedAt,
        },
    });

    const propertyType = watch("propertyType");

    const onSubmit = async (data: any) => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                fullName: data.fullName,
                email: data.email || undefined,
                phone: data.phone,
                city: data.city,
                propertyType: data.propertyType,
                bhk: data.bhk || undefined,
                purpose: data.purpose,
                budgetMin: data.budgetMin || undefined,
                budgetMax: data.budgetMax || undefined,
                timeline: data.timeline,
                source: data.source,
                status: data.status,
                notes: data.notes || undefined,
                tags: typeof data.tags === "string"
                    ? data.tags.split(",").map((s: string) => s.trim()).filter(Boolean)
                    : data.tags || [],
                updatedAt: data.updatedAt,
            };

            console.log("PUT payload (before API):", payload);

            const res = await fetch(`/api/buyers/${buyer.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.status === 409) throw new Error("Record changed on server. Please refresh.");
            if (!res.ok) {
                const body = await res.json().catch(() => null);
                console.error("API Error Response:", body);
                throw new Error(body?.error || "Failed to update");
            }

            // Success -> refresh or navigate (we'll reload to pick up server-rendered data)
            router.refresh();
            // Optionally navigate back to view page:
            // router.push(`/buyers/${buyer.id}`);
        } catch (err: any) {
            setError(err.message || "Failed to update");
        } finally {
            setLoading(false);
        }
    };

    // --- Delete handlers ---
    const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
    const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        // When confirm dialog opens, focus the Cancel button for safety
        if (showDeleteConfirm) {
            cancelButtonRef.current?.focus();
        }
    }, [showDeleteConfirm]);

    // inside BuyerEditClient component (client side)
    async function handleConfirmDelete() {
        setDeleteError(null);
        setDeleteLoading(true);

        try {
            const res = await fetch(`/api/buyers/${buyer.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            // Try to parse JSON body (server always returns JSON now)
            const payload = await res.json().catch(() => null);

            if (!res.ok) {
                // prefer explicit payload.error, fallback to payload.message or statusText
                const msg =
                    payload?.error ||
                    payload?.message ||
                    `Delete failed (${res.status} ${res.statusText})`;
                throw new Error(msg);
            }

            // Success -> navigate back to list
            router.push("/buyers");
        } catch (err: any) {
            console.error("Delete error (client):", err);
            setDeleteError(err?.message || "Failed to delete");
        } finally {
            setDeleteLoading(false);
            setShowDeleteConfirm(false);
        }
    }


    function handleCancelDelete() {
        setShowDeleteConfirm(false);
        setDeleteError(null);
    }

    const inputClasses = "w-full px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-100 dark:focus:shadow-blue-900/20";

    const selectClasses = "w-full px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-100 dark:focus:shadow-blue-900/20 cursor-pointer";

    const labelClasses = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2";

    const ErrorIcon = () => (
        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
    );

    const SectionIcon = ({ color, children }: { color: string, children: React.ReactNode }) => (
        <div className={`flex items-center justify-center w-10 h-10 ${color} rounded-xl mr-4 shadow-lg`}>{children}</div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Edit Buyer Profile</h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">Update buyer information and preferences</p>
                        </div>
                    </div>
                </div>

                {/* Main Form Card */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
                    <form onSubmit={handleSubmit(onSubmit)} className="p-8" aria-describedby={error ? "update-error" : undefined}>
                        <div className="space-y-10">
                            {/* Personal Information Section */}
                            <section>
                                <div className="flex items-center mb-8">
                                    <SectionIcon color="bg-gradient-to-r from-blue-500 to-blue-600">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </SectionIcon>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Personal Information</h2>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">Basic contact details and identification</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Full Name */}
                                    <div className="space-y-2">
                                        <label className={labelClasses}>
                                            Full Name <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                {...register("fullName")}
                                                className={`${inputClasses} ${errors.fullName ? 'border-red-300 focus:ring-red-500' : ''}`}
                                                placeholder="Enter full name"
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                        </div>
                                        {errors.fullName && (
                                            <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                                <ErrorIcon />
                                                {errors.fullName.message}
                                            </div>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-2">
                                        <label className={labelClasses}>
                                            Phone Number <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                {...register("phone")}
                                                className={`${inputClasses} ${errors.phone ? 'border-red-300 focus:ring-red-500' : ''}`}
                                                placeholder="Enter phone number"
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                            </div>
                                        </div>
                                        {errors.phone && (
                                            <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                                <ErrorIcon />
                                                {errors.phone.message}
                                            </div>
                                        )}
                                    </div>

                                    {/* ... the rest of form remains the same ... */}
                                    {/* For brevity, the rest of the form inputs (Email, City, Property Preferences, Budget, Lead Management, etc.)
                                        remain unchanged from your original implementation and are omitted here in the snippet for readability.
                                        In your actual file, keep the entire form content exactly as before. */}
                                </div>
                            </section>

                            {/* rest of the sections ... */}
                        </div>

                        {/* Hidden concurrency check */}
                        <input
                            type="hidden"
                            {...register("updatedAt")}
                            value={buyer.updatedAt instanceof Date
                                ? buyer.updatedAt.toISOString()
                                : buyer.updatedAt}
                        />

                        {/* Error Display */}
                        {(error || deleteError) && (
                            <div id="update-error" className="mt-8 p-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-lg">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center">
                                            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-red-800 dark:text-red-200 font-bold text-lg">Action Errors</h3>
                                        <p className="text-red-700 dark:text-red-300 mt-1">{error ?? deleteError}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-6 pt-8 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                All changes are automatically saved
                            </div>

                            <div className="flex items-center space-x-4">
                                <button
                                    type="button"
                                    onClick={() => window.history.back()}
                                    className="px-6 py-3 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                                >
                                    Cancel
                                </button>

                                {/* Delete Button */}
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-4 py-3 bg-white dark:bg-slate-800 text-red-600 border border-red-200 dark:border-red-700 rounded-xl font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                                >
                                    Delete
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-10 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Saving…" : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm && (
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-dialog-title"
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/50" onClick={handleCancelDelete} aria-hidden />
                        <div className="relative max-w-lg w-full bg-white dark:bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
                            <h3 id="delete-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white">Confirm delete</h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                Are you sure you want to delete <strong>{buyer.fullName}</strong>? This action cannot be undone.
                            </p>

                            <div className="mt-6 flex items-center justify-end space-x-3">
                                <button
                                    ref={cancelButtonRef}
                                    onClick={handleCancelDelete}
                                    className="px-4 py-2 bg-white dark:bg-slate-700 border rounded text-sm"
                                >
                                    Cancel
                                </button>

                                <button
                                    ref={confirmButtonRef}
                                    onClick={handleConfirmDelete}
                                    disabled={deleteLoading}
                                    className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-60"
                                >
                                    {deleteLoading ? "Deleting…" : "Delete"}
                                </button>
                            </div>

                            {deleteError && (
                                <div className="mt-4 text-sm text-red-600">
                                    {deleteError}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Additional Info Cards */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-xl p-6 text-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2">Validated Data</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">All fields are validated before submission</p>
                    </div>

                    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-xl p-6 text-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2">Auto-Sync</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Changes sync automatically with your CRM</p>
                    </div>

                    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-xl p-6 text-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2">Secure</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">All data is encrypted and securely stored</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
