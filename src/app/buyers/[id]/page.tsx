import React from "react";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import BuyerEditClient from "@/src/components/BuyerEditClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import Link from "next/link";

export default async function BuyerPage(props: {
    params: Promise<{ id: string }>,
    searchParams: Promise<Record<string, string>>
}) {
    const { id } = await props.params;
    const searchParams = await props.searchParams;
    const isEditMode = searchParams.edit === '1';

    const buyer = await prisma.buyer.findUnique({ where: { id } });
    if (!buyer) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center p-6">
                <div className="text-center max-w-md mx-auto">
                    <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <svg className="w-10 h-10 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">Buyer Not Found</h2>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">The buyer you're looking for doesn't exist or has been removed from the system.</p>
                    <Link
                        href="/buyers"
                        className="inline-flex items-center mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus-ring"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Buyers
                    </Link>
                </div>
            </div>
        );
    }

    const buyerPrepared = {
        ...buyer,
        updatedAt: buyer.updatedAt.toISOString(),
        updatedAtFormatted: buyer.updatedAt ? format(new Date(buyer.updatedAt), "MMM dd, yyyy 'at' HH:mm") : "",
    };

    // fetch last 5 history entries
    const history = await prisma.buyerHistory.findMany({
        where: { buyerId: id },
        orderBy: { changedAt: "desc" },
        take: 5,
    });

    // --- Use getServerSession instead of getToken in server component ---
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const canEdit = !!userId && String(userId) === String(buyer.ownerId);

    // If in edit mode, render the edit component
    if (isEditMode) {
        if (!canEdit) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center p-6">
                    <div className="text-center max-w-md mx-auto">
                        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <svg className="w-10 h-10 text-amber-500 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">Access Denied</h2>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">You don't have permission to edit this buyer profile. Only the owner can make changes.</p>
                        <Link
                            href={`/buyers/${id}`}
                            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus-ring"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Profile
                        </Link>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header with back button */}
                    <div className="mb-8">
                        <Link
                            href={`/buyers/${id}`}
                            className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-4 focus-ring rounded-md px-2 py-1"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Profile
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                                    Edit {buyer.fullName}
                                </h1>
                                <p className="text-slate-600 dark:text-slate-400">Update buyer information and preferences</p>
                            </div>
                        </div>
                    </div>

                    <BuyerEditClient buyer={buyerPrepared} />
                </div>
            </div>
        );
    }

    // Display mode - show buyer profile
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-8 mb-8 shadow-xl">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                    {buyer.fullName}
                                </h1>
                                <p className="text-slate-600 dark:text-slate-400 text-lg">Buyer Profile</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100/80 dark:bg-slate-700/80 rounded-xl">
                                <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                                    Updated {buyerPrepared.updatedAtFormatted}
                                </span>
                            </div>
                            {canEdit && (
                                <Link
                                    href={`/buyers/${id}?edit=1`}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 focus-ring"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit Profile
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Left Column - Main Information */}
                    <div className="xl:col-span-3 space-y-8">
                        {/* Contact Information */}
                        <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-8 shadow-xl">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3">
                                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                Contact Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="group hover:scale-[1.02] transition-transform duration-200">
                                    <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide mb-1">Phone</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{buyer.phone}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="group hover:scale-[1.02] transition-transform duration-200">
                                    <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
                                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide mb-1">Email</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{buyer.email ?? "Not provided"}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="group hover:scale-[1.02] transition-transform duration-200">
                                    <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200/50 dark:border-orange-800/50">
                                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide mb-1">City</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{buyer.city}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="group hover:scale-[1.02] transition-transform duration-200">
                                    <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-teal-50 to-teal-100/50 dark:from-teal-900/20 dark:to-teal-800/20 rounded-xl border border-teal-200/50 dark:border-teal-800/50">
                                        <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide mb-1">Source</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{buyer.source}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Property Requirements */}
                        <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-8 shadow-xl">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                Property Requirements
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 hover:shadow-lg transition-shadow duration-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                                        <p className="text-sm text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wide">Property Type</p>
                                    </div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                        {buyer.propertyType} {buyer.bhk ? ` • ${buyer.bhk}` : ''}
                                    </p>
                                </div>
                                <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200/50 dark:border-purple-800/50 hover:shadow-lg transition-shadow duration-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                                        <p className="text-sm text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wide">Purpose</p>
                                    </div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{buyer.purpose}</p>
                                </div>
                                <div className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50 hover:shadow-lg transition-shadow duration-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                                        <p className="text-sm text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wide">Budget Range</p>
                                    </div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                        ₹{buyer.budgetMin ?? 'Not specified'} — ₹{buyer.budgetMax ?? 'Not specified'}
                                    </p>
                                </div>
                                <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl border border-orange-200/50 dark:border-orange-800/50 hover:shadow-lg transition-shadow duration-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                                        <p className="text-sm text-orange-700 dark:text-orange-300 font-bold uppercase tracking-wide">Timeline</p>
                                    </div>
                                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{buyer.timeline}</p>
                                </div>
                            </div>
                        </div>

                        {/* Notes and Tags */}
                        <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-8 shadow-xl">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3">
                                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                Additional Information
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide mb-3">Notes</p>
                                    <div className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200/50 dark:border-slate-600/50">
                                        <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                                            {buyer.notes || 'No additional notes provided'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide mb-3">Tags</p>
                                    <div className="flex flex-wrap gap-3">
                                        {(buyer.tags || []).length > 0 ? (
                                            buyer.tags.map((tag: string, index: number) => (
                                                <span
                                                    key={index}
                                                    className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-semibold border border-blue-200/50 dark:border-blue-800/50 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                >
                                                    {tag}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl text-sm font-medium">
                                                No tags added
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - History */}
                    <div className="xl:col-span-1">
                        <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-8 shadow-xl">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                Recent Changes
                            </h3>
                            <div className="space-y-4">
                                {history.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">No history available</p>
                                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Changes will appear here</p>
                                    </div>
                                ) : (
                                    history.map((h: any) => (
                                        <div key={h.id} className="p-5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200/50 dark:border-slate-600/50 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                    {h.changedBy}
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded-md">
                                                    {new Date(h.changedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                                                <pre className="text-xs text-slate-600 dark:text-slate-300 overflow-auto whitespace-pre-wrap font-mono">
                                                    {JSON.stringify(h.diff, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Status Card */}
                        <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-8 shadow-xl mt-8">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                Status
                            </h3>
                            <div className="space-y-4">
                                <div className={`p-4 rounded-xl border ${buyer.status === 'New' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                                        buyer.status === 'Qualified' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' :
                                            buyer.status === 'Contacted' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
                                                buyer.status === 'Visited' ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800' :
                                                    buyer.status === 'Negotiation' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
                                                        buyer.status === 'Converted' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                                                            'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${buyer.status === 'New' ? 'bg-blue-500' :
                                                buyer.status === 'Qualified' ? 'bg-purple-500' :
                                                    buyer.status === 'Contacted' ? 'bg-orange-500' :
                                                        buyer.status === 'Visited' ? 'bg-teal-500' :
                                                            buyer.status === 'Negotiation' ? 'bg-amber-500' :
                                                                buyer.status === 'Converted' ? 'bg-green-500' :
                                                                    'bg-red-500'
                                            }`}></div>
                                        <span className="font-bold text-slate-900 dark:text-slate-100">
                                            {buyer.status}
                                        </span>
                                    </div>
                                </div>

                                {!canEdit && (
                                    <div className="text-center py-4">
                                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                            Read-only access
                                        </p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                            You are not the owner
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}