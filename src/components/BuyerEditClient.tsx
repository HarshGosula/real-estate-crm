"use client";
import React, { useState } from "react";
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

export default function BuyerEditClient({ buyer }: any) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            // Prepare the payload with proper transformations
            const payload = {
                fullName: data.fullName,
                email: data.email || undefined,
                phone: data.phone,
                city: data.city,
                propertyType: data.propertyType,
                bhk: data.bhk || undefined, // Let the validation schema handle BHK requirement
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

            window.location.reload();
        } catch (err: any) {
            setError(err.message || "Failed to update");
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-100 dark:focus:shadow-blue-900/20";

    const selectClasses = "w-full px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:shadow-lg focus:shadow-blue-100 dark:focus:shadow-blue-900/20 cursor-pointer";

    const labelClasses = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2";

    const ErrorIcon = () => (
        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
    );

    const SectionIcon = ({ color, children }: { color: string, children: React.ReactNode }) => (
        <div className={`flex items-center justify-center w-10 h-10 ${color} rounded-xl mr-4 shadow-lg`}>
            {children}
        </div>
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
                    <form onSubmit={handleSubmit(onSubmit)} className="p-8">
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

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label className={labelClasses}>Email Address</label>
                                        <div className="relative">
                                            <input
                                                {...register("email")}
                                                type="email"
                                                className={`${inputClasses} ${errors.email ? 'border-red-300 focus:ring-red-500' : ''}`}
                                                placeholder="Enter email address"
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                                </svg>
                                            </div>
                                        </div>
                                        {errors.email && (
                                            <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                                <ErrorIcon />
                                                {errors.email.message}
                                            </div>
                                        )}
                                    </div>

                                    {/* City */}
                                    <div className="space-y-2">
                                        <label className={labelClasses}>
                                            City <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                {...register("city")}
                                                className={`${selectClasses} ${errors.city ? 'border-red-300 focus:ring-red-500' : ''}`}
                                            >
                                                <option value="Chandigarh">Chandigarh</option>
                                                <option value="Mohali">Mohali</option>
                                                <option value="Zirakpur">Zirakpur</option>
                                                <option value="Panchkula">Panchkula</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                        {errors.city && (
                                            <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                                <ErrorIcon />
                                                {errors.city.message}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Property Preferences Section */}
                            <section>
                                <div className="flex items-center mb-8">
                                    <SectionIcon color="bg-gradient-to-r from-emerald-500 to-emerald-600">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </SectionIcon>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Property Preferences</h2>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">Preferred property type and specifications</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Property Type */}
                                    <div className="space-y-2">
                                        <label className={labelClasses}>
                                            Property Type <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <select
                                            {...register("propertyType")}
                                            className={`${selectClasses} ${errors.propertyType ? 'border-red-300 focus:ring-red-500' : ''}`}
                                        >
                                            <option value="Apartment">🏢 Apartment</option>
                                            <option value="Villa">🏡 Villa</option>
                                            <option value="Plot">🏞️ Plot</option>
                                            <option value="Office">🏢 Office</option>
                                            <option value="Retail">🏪 Retail</option>
                                        </select>
                                        {errors.propertyType && (
                                            <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                                <ErrorIcon />
                                                {errors.propertyType.message}
                                            </div>
                                        )}
                                    </div>

                                    {/* BHK only for Apartment/Villa */}
                                    {["Apartment", "Villa"].includes(propertyType) && (
                                        <div className="space-y-2">
                                            <label className={labelClasses}>BHK Configuration</label>
                                            <select
                                                {...register("bhk")}
                                                className={`${selectClasses} ${errors.bhk ? 'border-red-300 focus:ring-red-500' : ''}`}
                                            >
                                                <option value="">Select BHK</option>
                                                <option value="Studio">🏠 Studio</option>
                                                <option value="1">🏠 1 BHK</option>
                                                <option value="2">🏡 2 BHK</option>
                                                <option value="3">🏘️ 3 BHK</option>
                                                <option value="4">🏰 4 BHK</option>
                                            </select>
                                            {errors.bhk && (
                                                <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                                    <ErrorIcon />
                                                    {errors.bhk.message}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Purpose */}
                                    <div className="space-y-2">
                                        <label className={labelClasses}>
                                            Purpose <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <select
                                            {...register("purpose")}
                                            className={`${selectClasses} ${errors.purpose ? 'border-red-300 focus:ring-red-500' : ''}`}
                                        >
                                            <option value="Buy">💰 Buy</option>
                                            <option value="Rent">🏠 Rent</option>
                                        </select>
                                        {errors.purpose && (
                                            <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                                <ErrorIcon />
                                                {errors.purpose.message}
                                            </div>
                                        )}
                                    </div>

                                    {/* Timeline */}
                                    <div className="space-y-2">
                                        <label className={labelClasses}>
                                            Timeline <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <select
                                            {...register("timeline")}
                                            className={`${selectClasses} ${errors.timeline ? 'border-red-300 focus:ring-red-500' : ''}`}
                                        >
                                            <option value="0-3m">⏰ 0–3 months</option>
                                            <option value="3-6m">⏳ 3–6 months</option>
                                            <option value=">6m">📅 More than 6 months</option>
                                            <option value="Exploring">🔍 Exploring</option>
                                        </select>
                                        {errors.timeline && (
                                            <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                                <ErrorIcon />
                                                {errors.timeline.message}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Budget Range */}
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Budget Range</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className={labelClasses}>Minimum Budget (₹)</label>
                                            <div className="relative">
                                                <input
                                                    {...register("budgetMin")}
                                                    className={`${inputClasses} ${errors.budgetMin ? 'border-red-300 focus:ring-red-500' : ''}`}
                                                    type="number"
                                                    placeholder="Minimum budget"
                                                />
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <span className="text-slate-500 text-sm font-medium">₹</span>
                                                </div>
                                            </div>
                                            {errors.budgetMin && (
                                                <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                                    <ErrorIcon />
                                                    {errors.budgetMin.message}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className={labelClasses}>Maximum Budget (₹)</label>
                                            <div className="relative">
                                                <input
                                                    {...register("budgetMax")}
                                                    className={`${inputClasses} ${errors.budgetMax ? 'border-red-300 focus:ring-red-500' : ''}`}
                                                    type="number"
                                                    placeholder="Maximum budget"
                                                />
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <span className="text-slate-500 text-sm font-medium">₹</span>
                                                </div>
                                            </div>
                                            {errors.budgetMax && (
                                                <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                                    <ErrorIcon />
                                                    {errors.budgetMax.message}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Lead Management Section */}
                            <section>
                                <div className="flex items-center mb-8">
                                    <SectionIcon color="bg-gradient-to-r from-purple-500 to-purple-600">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </SectionIcon>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Lead Management</h2>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">Source, status, and additional information</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Source */}
                                    <div className="space-y-2">
                                        <label className={labelClasses}>
                                            Source <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <select
                                            {...register("source")}
                                            className={`${selectClasses} ${errors.source ? 'border-red-300 focus:ring-red-500' : ''}`}
                                        >
                                            <option value="Website">🌐 Website</option>
                                            <option value="Referral">👥 Referral</option>
                                            <option value="Walk-in">🚶 Walk-in</option>
                                            <option value="Call">📞 Call</option>
                                            <option value="Other">➕ Other</option>
                                        </select>
                                        {errors.source && (
                                            <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                                <ErrorIcon />
                                                {errors.source.message}
                                            </div>
                                        )}
                                    </div>

                                    {/* Status */}
                                    <div className="space-y-2">
                                        <label className={labelClasses}>
                                            Status <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <select
                                            {...register("status")}
                                            className={`${selectClasses} ${errors.status ? 'border-red-300 focus:ring-red-500' : ''}`}
                                        >
                                            <option value="New">🆕 New</option>
                                            <option value="Qualified">✅ Qualified</option>
                                            <option value="Contacted">📞 Contacted</option>
                                            <option value="Visited">👁️ Visited</option>
                                            <option value="Negotiation">💬 Negotiation</option>
                                            <option value="Converted">🎉 Converted</option>
                                            <option value="Dropped">❌ Dropped</option>
                                        </select>
                                        {errors.status && (
                                            <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                                <ErrorIcon />
                                                {errors.status.message}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="mt-6 space-y-2">
                                    <label className={labelClasses}>Notes</label>
                                    <div className="relative">
                                        <textarea
                                            {...register("notes")}
                                            className={`${inputClasses} resize-none ${errors.notes ? 'border-red-300 focus:ring-red-500' : ''}`}
                                            rows={4}
                                            placeholder="Add any additional notes or comments about this buyer..."
                                        />
                                        <div className="absolute top-3 right-3 pointer-events-none">
                                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </div>
                                    </div>
                                    {errors.notes && (
                                        <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                            <ErrorIcon />
                                            {errors.notes.message}
                                        </div>
                                    )}
                                </div>

                                {/* Tags */}
                                <div className="mt-6 space-y-2">
                                    <label className={labelClasses}>Tags</label>
                                    <div className="relative">
                                        <input
                                            {...register("tags")}
                                            className={`${inputClasses} ${errors.tags ? 'border-red-300 focus:ring-red-500' : ''}`}
                                            placeholder="Enter tags separated by commas (e.g., hot-lead, premium, urgent)"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-2">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        Separate multiple tags with commas for better organization
                                    </p>
                                    {errors.tags && (
                                        <div className="flex items-center text-red-600 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                            <ErrorIcon />
                                            {errors.tags.message}
                                        </div>
                                    )}
                                </div>
                            </section>
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
                        {error && (
                            <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-lg">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center">
                                            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-red-800 dark:text-red-200 font-bold text-lg">Update Failed</h3>
                                        <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
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

                            <div className="flex space-x-4">
                                <button
                                    type="button"
                                    onClick={() => window.history.back()}
                                    className="px-8 py-3.5 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                                >
                                    <span className="flex items-center">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        Cancel
                                    </span>
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-10 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
                                >
                                    <span className="flex items-center">
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span className="text-lg">Saving Changes...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span className="text-lg">Save Changes</span>
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

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