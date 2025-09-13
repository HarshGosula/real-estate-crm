"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBuyerSchema } from "@/lib/validations/buyer";
import type { CreateBuyerInput } from "@/lib/validations/buyer";

export default function NewBuyerPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(createBuyerSchema),
        mode: "onChange",
        defaultValues: {
            tags: [],
            email: "",
            notes: "",
            budgetMin: undefined,
            budgetMax: undefined,
        },
    });

    const propertyType = watch("propertyType");
    const [tagsText, setTagsText] = useState("");

    const onSubmit = async (rawData: any) => {
        setLoading(true);
        setError(null);
        try {
            const tags = tagsText
                ? tagsText
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                : [];

            const payload = {
                fullName: rawData.fullName,
                email: rawData.email || undefined,
                phone: rawData.phone,
                city: rawData.city,
                propertyType: rawData.propertyType,
                bhk: rawData.bhk || undefined,
                purpose: rawData.purpose,
                budgetMin: rawData.budgetMin || undefined,
                budgetMax: rawData.budgetMax || undefined,
                timeline: rawData.timeline,
                source: rawData.source,
                status: rawData.status || "New",
                notes: rawData.notes || undefined,
                tags,
            };

            const res = await fetch("/api/buyers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                let body: any;
                try {
                    body = await res.json();
                } catch {
                    body = { error: await res.text() };
                }
                throw new Error(body?.error?.message || body?.error || JSON.stringify(body));
            }

            window.location.href = "/buyers";
        } catch (err: any) {
            setError(err?.message || "Failed to create buyer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4">
            {/* Header Section */}
            <div className="max-w-4xl mx-auto mb-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        Add New Buyer Lead
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">
                        Capture and organize your buyer information
                    </p>
                </div>
            </div>

            {/* Main Form Container */}
            <div className="max-w-4xl mx-auto">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        {/* Personal Information Section */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-700">
                                Personal Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <label htmlFor="fullName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            {...register("fullName")}
                                            id="fullName"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-500"
                                            placeholder="Enter buyer's full name"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                    {errors.fullName && (
                                        <p className="text-red-500 text-sm flex items-center space-x-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span>{(errors.fullName as any).message}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <input
                                            {...register("email")}
                                            id="email"
                                            type="email"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-500"
                                            placeholder="buyer@example.com"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                            </svg>
                                        </div>
                                    </div>
                                    {errors.email && (
                                        <p className="text-red-500 text-sm flex items-center space-x-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span>{(errors.email as any).message}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            {...register("phone")}
                                            id="phone"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-500"
                                            placeholder="+91 98765 43210"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                    </div>
                                    {errors.phone && (
                                        <p className="text-red-500 text-sm flex items-center space-x-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span>{(errors.phone as any).message}</span>
                                        </p>
                                    )}
                                </div>

                                {/* City */}
                                <div className="space-y-2">
                                    <label htmlFor="city" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        City <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        {...register("city")}
                                        id="city"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-500"
                                    >
                                        <option value="">Select City</option>
                                        <option value="Chandigarh">Chandigarh</option>
                                        <option value="Mohali">Mohali</option>
                                        <option value="Zirakpur">Zirakpur</option>
                                        <option value="Panchkula">Panchkula</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {errors.city && (
                                        <p className="text-red-500 text-sm flex items-center space-x-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span>{(errors.city as any).message}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Property Requirements Section */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-700">
                                Property Requirements
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Property Type */}
                                <div className="space-y-2">
                                    <label htmlFor="propertyType" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Property Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        {...register("propertyType")}
                                        id="propertyType"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-500"
                                    >
                                        <option value="">Select Property Type</option>
                                        <option value="Apartment">Apartment</option>
                                        <option value="Villa">Villa</option>
                                        <option value="Plot">Plot</option>
                                        <option value="Office">Office</option>
                                        <option value="Retail">Retail</option>
                                    </select>
                                    {errors.propertyType && (
                                        <p className="text-red-500 text-sm flex items-center space-x-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span>{(errors.propertyType as any).message}</span>
                                        </p>
                                    )}
                                </div>

                                {/* BHK (Conditional) */}
                                {(propertyType === "Apartment" || propertyType === "Villa") && (
                                    <div className="space-y-2">
                                        <label htmlFor="bhk" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            BHK <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register("bhk")}
                                            id="bhk"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-500"
                                        >
                                            <option value="">Select BHK</option>
                                            <option value="Studio">Studio</option>
                                            <option value="1">1 BHK</option>
                                            <option value="2">2 BHK</option>
                                            <option value="3">3 BHK</option>
                                            <option value="4">4 BHK</option>
                                        </select>
                                        {errors.bhk && (
                                            <p className="text-red-500 text-sm flex items-center space-x-1">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                <span>{(errors.bhk as any).message}</span>
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Purpose */}
                                <div className="space-y-2">
                                    <label htmlFor="purpose" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Purpose <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        {...register("purpose")}
                                        id="purpose"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-500"
                                    >
                                        <option value="">Select Purpose</option>
                                        <option value="Buy">Buy</option>
                                        <option value="Rent">Rent</option>
                                    </select>
                                    {errors.purpose && (
                                        <p className="text-red-500 text-sm flex items-center space-x-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span>{(errors.purpose as any).message}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Budget Range */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="budgetMin" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Budget Min (₹)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            {...register("budgetMin", {
                                                valueAsNumber: true,
                                                setValueAs: v => v === "" ? undefined : v
                                            })}
                                            id="budgetMin"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-500"
                                            placeholder="Min budget"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <span className="text-slate-400 text-sm">₹</span>
                                        </div>
                                    </div>
                                    {errors.budgetMin && (
                                        <p className="text-red-500 text-sm flex items-center space-x-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span>{(errors.budgetMin as any).message}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="budgetMax" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Budget Max (₹)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            {...register("budgetMax", {
                                                valueAsNumber: true,
                                                setValueAs: v => v === "" ? undefined : v
                                            })}
                                            id="budgetMax"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-500"
                                            placeholder="Max budget"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <span className="text-slate-400 text-sm">₹</span>
                                        </div>
                                    </div>
                                    {errors.budgetMax && (
                                        <p className="text-red-500 text-sm flex items-center space-x-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span>{(errors.budgetMax as any).message}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Lead Information Section */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-700">
                                Lead Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Timeline */}
                                <div className="space-y-2">
                                    <label htmlFor="timeline" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Timeline <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        {...register("timeline")}
                                        id="timeline"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-500"
                                    >
                                        <option value="">Select Timeline</option>
                                        <option value="0-3m">0-3 months</option>
                                        <option value="3-6m">3-6 months</option>
                                        <option value=">6m">&gt;6 months</option>
                                        <option value="Exploring">Exploring</option>
                                    </select>
                                    {errors.timeline && (
                                        <p className="text-red-500 text-sm flex items-center space-x-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span>{(errors.timeline as any).message}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Source */}
                                <div className="space-y-2">
                                    <label htmlFor="source" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Source <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        {...register("source")}
                                        id="source"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-500"
                                    >
                                        <option value="">Select Source</option>
                                        <option value="Website">Website</option>
                                        <option value="Referral">Referral</option>
                                        <option value="Walk-in">Walk-in</option>
                                        <option value="Call">Call</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {errors.source && (
                                        <p className="text-red-500 text-sm flex items-center space-x-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span>{(errors.source as any).message}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label htmlFor="notes" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Additional Notes
                                </label>
                                <textarea
                                    {...register("notes")}
                                    id="notes"
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-500 resize-none"
                                    placeholder="Any additional information about the buyer or their requirements..."
                                />
                                {errors.notes && (
                                    <p className="text-red-500 text-sm flex items-center space-x-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <span>{(errors.notes as any).message}</span>
                                    </p>
                                )}
                            </div>

                            {/* Tags */}
                            <div className="space-y-2">
                                <label htmlFor="tags" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Tags
                                </label>
                                <input
                                    value={tagsText}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setTagsText(val);
                                        const arr = val
                                            ? val.split(",").map((t) => t.trim()).filter(Boolean)
                                            : [];
                                        setValue("tags", arr);
                                    }}
                                    id="tags"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-500"
                                    placeholder="hot-lead, premium, urgent (comma-separated)"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Separate multiple tags with commas
                                </p>
                                {errors.tags && (
                                    <p className="text-red-500 text-sm flex items-center space-x-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <span>{(errors.tags as any).message}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Hidden status field */}
                        <input type="hidden" {...register("status")} value="New" />

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-medium py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Buyer Lead...
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Create Buyer Lead
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}