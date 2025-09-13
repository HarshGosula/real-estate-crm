"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { mapBhkToForm } from "@/lib/mappers/buyers";

export default function BuyerListClient({
    initialBuyers,
    page,
    totalPages,
    pageSize,
    total,
    searchParams,
}: any) {
    const router = useRouter();
    const sp = useSearchParams();
    const [q, setQ] = useState(() => String(searchParams.q ?? ""));
    const [debounced, setDebounced] = useState(q);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(q), 350);
        return () => clearTimeout(t);
    }, [q]);

    useEffect(() => {
        // when debounced changes, update url with page=1
        const params = new URLSearchParams(Object.fromEntries(sp.entries()));
        if (debounced) params.set("q", debounced);
        else params.delete("q");
        params.set("page", "1");
        router.push(`/buyers?${params.toString()}`);
    }, [debounced]);

    // helpers to update a single param and keep others
    function setParam(key: string, value?: string) {
        const params = new URLSearchParams(Object.fromEntries(sp.entries()));
        if (value) params.set(key, value);
        else params.delete(key);
        params.set("page", "1");
        router.push(`/buyers?${params.toString()}`);
    }

    function changePage(p: number) {
        const params = new URLSearchParams(Object.fromEntries(sp.entries()));
        params.set("page", String(p));
        router.push(`/buyers?${params.toString()}`);
    }

    // Status color helper
    const getStatusColor = (status: string) => {
        const colors = {
            'New': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50',
            'Qualified': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/50',
            'Contacted': 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800/50',
            'Visited': 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/50',
            'Negotiation': 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800/50',
            'Converted': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/50',
            'Dropped': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/50',
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800/50';
    };

    return (
        <div className="space-y-8">
            {/* Search and Filters */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center ring-1 ring-blue-200/50 dark:ring-blue-800/50">
                        <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Search & Filters</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search Input */}
                    <div className="relative lg:col-span-2">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search name, phone, or email..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="block w-full pl-12 pr-4 py-3.5 border border-gray-200/80 dark:border-slate-600/80 rounded-2xl bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                        />
                        {q && (
                            <button
                                onClick={() => setQ("")}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* City Filter */}
                    <select
                        className="block w-full px-4 py-3.5 border border-gray-200/80 dark:border-slate-600/80 rounded-2xl bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                        defaultValue={searchParams.city || ""}
                        onChange={(e) => setParam("city", e.target.value || undefined)}
                    >
                        <option value="">All cities</option>
                        <option value="Chandigarh">Chandigarh</option>
                        <option value="Mohali">Mohali</option>
                        <option value="Zirakpur">Zirakpur</option>
                        <option value="Panchkula">Panchkula</option>
                        <option value="Other">Other</option>
                    </select>

                    {/* Property Type Filter */}
                    <select
                        className="block w-full px-4 py-3.5 border border-gray-200/80 dark:border-slate-600/80 rounded-2xl bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                        defaultValue={searchParams.propertyType || ""}
                        onChange={(e) => setParam("propertyType", e.target.value || undefined)}
                    >
                        <option value="">All types</option>
                        <option value="Apartment">Apartment</option>
                        <option value="Villa">Villa</option>
                        <option value="Plot">Plot</option>
                        <option value="Office">Office</option>
                        <option value="Retail">Retail</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        className="block w-full px-4 py-3.5 border border-gray-200/80 dark:border-slate-600/80 rounded-2xl bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md md:col-span-2 lg:col-span-1"
                        defaultValue={searchParams.status || ""}
                        onChange={(e) => setParam("status", e.target.value || undefined)}
                    >
                        <option value="">All status</option>
                        <option value="New">New</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Visited">Visited</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Converted">Converted</option>
                        <option value="Dropped">Dropped</option>
                    </select>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-gray-200/60 dark:border-slate-700/60 overflow-hidden shadow-xl shadow-gray-900/5">
                {/* Table Header */}
                <div className="px-8 py-5 bg-gradient-to-r from-gray-50/90 via-blue-50/60 to-indigo-50/40 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-slate-700/60 border-b border-gray-200/60 dark:border-slate-700/60">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center ring-1 ring-blue-200/50 dark:ring-blue-800/50">
                                <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                {initialBuyers.length} {initialBuyers.length === 1 ? 'result' : 'results'}
                            </h3>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            Page {page} of {totalPages}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {initialBuyers.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">No buyers found</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                {searchParams.q || searchParams.city || searchParams.propertyType || searchParams.status ?
                                    'Try adjusting your search filters to find more buyers.' :
                                    'Get started by adding your first buyer.'}
                            </p>
                            {!(searchParams.q || searchParams.city || searchParams.propertyType || searchParams.status) && (
                                <Link
                                    href="/buyers/new"
                                    className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-105"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add Buyer
                                </Link>
                            )}
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200/60 dark:border-slate-700/60">
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Location</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Property</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">BHK</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Budget</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Timeline</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Updated</th>
                                    <th className="px-8 py-5 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200/60 dark:divide-slate-700/60">
                                {initialBuyers.map((b: any) => (
                                    <tr key={b.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/40 transition-all duration-200 group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-200">
                                                    <span className="text-white text-sm font-bold">
                                                        {b.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <Link
                                                        href={`/buyers/${b.id}`}
                                                        className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                    >
                                                        {b.fullName}
                                                    </Link>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-sm text-gray-900 dark:text-white font-medium">{b.phone}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{b.city}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                                                {b.propertyType}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-sm">
                                                {b.bhk ? (
                                                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 shadow-sm">
                                                        {mapBhkToForm(b.bhk)} 
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-sm text-gray-900 dark:text-white font-medium">
                                                {b.budgetMin && b.budgetMax ?
                                                    `₹${b.budgetMin} - ₹${b.budgetMax}` :
                                                    'Not specified'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{b.timeline}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm ${getStatusColor(b.status)}`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                                {b.updatedAtFormatted ?? (b.updatedAt ? new Date(b.updatedAt).toLocaleDateString() : "-")}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/buyers/${b.id}`}
                                                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-semibold rounded-xl text-gray-700 dark:text-gray-300 bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-600 transition-all duration-200 hover:shadow-md backdrop-blur-sm"
                                                >
                                                    <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    View
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-gray-200/60 dark:border-slate-700/60 px-8 py-5 shadow-xl shadow-gray-900/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center ring-1 ring-gray-200/50 dark:ring-gray-600/50">
                                <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 00-1-1H4a1 1 0 00-1 1v2H1a1 1 0 000 2h2v2a1 1 0 001 1h2a1 1 0 001-1V6h2a1 1 0 100-2H7z" />
                                </svg>
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                Showing page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span>
                                <span className="mx-3 text-gray-400">•</span>
                                <span className="font-bold">{total}</span> total {total === 1 ? 'buyer' : 'buyers'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => changePage(page - 1)}
                                disabled={page <= 1}
                                className="inline-flex items-center px-5 py-3 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-semibold rounded-2xl text-gray-700 dark:text-gray-300 bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md backdrop-blur-sm"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Previous
                            </button>
                            <button
                                onClick={() => changePage(page + 1)}
                                disabled={page >= totalPages}
                                className="inline-flex items-center px-5 py-3 border border-transparent shadow-sm text-sm font-semibold rounded-2xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
                            >
                                Next
                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}