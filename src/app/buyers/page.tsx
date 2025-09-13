import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import BuyerListClient from "@/src/components/BuyerListClient";
import BuyerActions from "@/src/components/BuyerActions";

const PAGE_SIZE = 10;

// server component - reads searchParams for SSR
export default async function BuyersPage({ searchParams }: { searchParams: any }) {
    const params = await searchParams;
    const page = Math.max(1, Number(params.page || 1));
    const skip = (page - 1) * PAGE_SIZE;

    const where: any = {};

    // filters: city, propertyType, status, timeline
    if (params.city) where.city = params.city;
    if (params.propertyType) where.propertyType = params.propertyType;
    if (params.status) where.status = params.status;
    if (params.timeline) where.timeline = params.timeline;

    // search across fullName, phone, email
    if (params.q) {
        const q = String(params.q).trim();
        if (q.length) {
            where.OR = [
                { fullName: { contains: q, mode: "insensitive" } },
                { phone: { contains: q } },
                { email: { contains: q, mode: "insensitive" } },
            ];
        }
    }

    const [total, buyers] = await Promise.all([
        prisma.buyer.count({ where }),
        prisma.buyer.findMany({
            where,
            orderBy: { updatedAt: "desc" },
            skip,
            take: PAGE_SIZE,
            select: {
                id: true,
                fullName: true,
                phone: true,
                city: true,
                propertyType: true,
                budgetMin: true,
                budgetMax: true,
                timeline: true,
                status: true,
                bhk: true, // Added bhk field
                updatedAt: true,
                ownerId: true,
            },
        }),
    ]);
    const buyersPrepared = buyers.map((b: any) => ({
        ...b,
        // deterministic formatted string (server-side)
        updatedAtFormatted: b.updatedAt ? format(new Date(b.updatedAt), "yyyy-MM-dd HH:mm") : "",
    }));

    const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full"></div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Buyers
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Manage and track your buyer leads
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            {/* Stats Badge */}
                            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-slate-700/50 shadow-sm">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {total} {total === 1 ? 'buyer' : 'buyers'}
                                </span>
                                {totalPages > 1 && (
                                    <>
                                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Page {page}/{totalPages}
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                {/* Action Buttons */}
                                <div className="flex items-center gap-3">
                                    {/* Stats Badge (keep unchanged) */}
                                    <div className="flex items-center gap-2">
                                        <BuyerActions />
                                    </div>
                                </div>


                                {/* New Buyer Button */}
                                <Link
                                    href="/buyers/new"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 focus-ring"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span className="hidden sm:inline">New Buyer</span>
                                    <span className="sm:hidden">New</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Stats */}
                    <div className="sm:hidden mt-4 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-slate-700/50">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {total} {total === 1 ? 'buyer' : 'buyers'}
                            </span>
                        </div>
                        {totalPages > 1 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                Page {page} of {totalPages}
                            </span>
                        )}
                    </div>
                </div>

                {/* Main Content Container */}
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-slate-700/60 shadow-xl shadow-gray-900/5 overflow-hidden">
                    {/* Content Header */}
                    <div className="px-6 py-4 border-b border-gray-200/60 dark:border-slate-700/60 bg-gray-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Buyer Directory
                                    </h2>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Browse and manage your buyer leads
                                    </p>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="hidden md:flex items-center gap-1">
                                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Client Component Container */}
                    <div className="p-6">
                        <BuyerListClient
                            initialBuyers={buyersPrepared}
                            page={page}
                            totalPages={totalPages}
                            pageSize={PAGE_SIZE}
                            total={total}
                            searchParams={params}
                        />
                    </div>
                </div>

                {/* Empty State (when no buyers) */}
                {total === 0 && !params.q && !params.city && !params.propertyType && !params.status && !params.timeline && (
                    <div className="mt-12 text-center py-12">
                        <div className="relative">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/10">
                                <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="absolute top-4 right-1/2 translate-x-8 w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                            <div className="absolute top-8 left-1/2 -translate-x-8 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-150"></div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Welcome to Buyers Management
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            Get started by adding your first buyer lead. Track their requirements, budget, and timeline all in one place.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link
                                href="/buyers/new"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 focus-ring"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Your First Buyer
                            </Link>
                            <button className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 focus-ring">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                                Import from CSV
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}