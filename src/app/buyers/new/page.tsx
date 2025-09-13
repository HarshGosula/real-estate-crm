"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBuyerSchema } from "@/lib/validations/buyer";
import type { CreateBuyerInput } from "@/lib/validations/buyer";

export default function NewBuyerPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // NOTE: we intentionally DON'T provide a generic to useForm<...>() here.
    // This avoids the "multiple react-hook-form types" mismatch that happens
    // when two copies of react-hook-form types are present in node_modules.
    // zodResolver still validates on submit and provides typed errors.
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(createBuyerSchema),
        defaultValues: { tags: [] },
    });

    const propertyType = watch("propertyType");

    // Maintain a simple text field for tags (comma-separated). We sync
    // it into the RHF form value using setValue so Zod will see the array.
    const [tagsText, setTagsText] = useState("");

    const onSubmit = async (rawData: any) => {
        setLoading(true);
        setError(null);
        try {
            // Ensure tags are an array before sending (zod preprocess on server accepts both,
            // but being explicit avoids surprises)
            const tags = tagsText
                ? tagsText
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                : rawData.tags || [];

            // Prepare payload matching createBuyerSchema expectations
            const payload: CreateBuyerInput = {
                fullName: rawData.fullName,
                email: rawData.email ?? "",
                phone: rawData.phone,
                city: rawData.city,
                propertyType: rawData.propertyType,
                bhk: rawData.bhk,
                purpose: rawData.purpose,
                budgetMin: rawData.budgetMin === undefined ? "" : rawData.budgetMin,
                budgetMax: rawData.budgetMax === undefined ? "" : rawData.budgetMax,
                timeline: rawData.timeline,
                source: rawData.source,
                notes: rawData.notes ?? "",
                tags,
            } as any; // small cast because useForm wasn't typed; server will validate with Zod

            const res = await fetch("/api/buyers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                // Try parse JSON error payload, fallback to text
                let body: any;
                try {
                    body = await res.json();
                } catch {
                    body = { error: await res.text() };
                }
                throw new Error(body?.error?.message || body?.error || JSON.stringify(body));
            }

            // success -> go to list
            window.location.href = "/buyers";
        } catch (err: any) {
            setError(err?.message || "Failed to create buyer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">Create Buyer</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Full Name */}
                <div>
                    <label className="block mb-1">Full Name</label>
                    <input {...register("fullName")} className="input" />
                    {errors.fullName && (
                        <p className="text-red-500 text-sm">{(errors.fullName as any).message}</p>
                    )}
                </div>

                {/* Email */}
                <div>
                    <label className="block mb-1">Email</label>
                    <input {...register("email")} className="input" />
                    {errors.email && (
                        <p className="text-red-500 text-sm">{(errors.email as any).message}</p>
                    )}
                </div>

                {/* Phone */}
                <div>
                    <label className="block mb-1">Phone</label>
                    <input {...register("phone")} className="input" />
                    {errors.phone && (
                        <p className="text-red-500 text-sm">{(errors.phone as any).message}</p>
                    )}
                </div>

                {/* City */}
                <div>
                    <label className="block mb-1">City</label>
                    <select {...register("city")} className="input">
                        <option value="Chandigarh">Chandigarh</option>
                        <option value="Mohali">Mohali</option>
                        <option value="Zirakpur">Zirakpur</option>
                        <option value="Panchkula">Panchkula</option>
                        <option value="Other">Other</option>
                    </select>
                    {errors.city && (
                        <p className="text-red-500 text-sm">{(errors.city as any).message}</p>
                    )}
                </div>

                {/* Property Type */}
                <div>
                    <label className="block mb-1">Property Type</label>
                    <select {...register("propertyType")} className="input">
                        <option value="Apartment">Apartment</option>
                        <option value="Villa">Villa</option>
                        <option value="Plot">Plot</option>
                        <option value="Office">Office</option>
                        <option value="Retail">Retail</option>
                    </select>
                    {errors.propertyType && (
                        <p className="text-red-500 text-sm">{(errors.propertyType as any).message}</p>
                    )}
                </div>

                {/* BHK (only Apartment/Villa) */}
                {(propertyType === "Apartment" || propertyType === "Villa") && (
                    <div>
                        <label className="block mb-1">BHK</label>
                        <select {...register("bhk")} className="input">
                            <option value="Studio">Studio</option>
                            <option value="1">1 BHK</option>
                            <option value="2">2 BHK</option>
                            <option value="3">3 BHK</option>
                            <option value="4">4 BHK</option>
                        </select>
                        {errors.bhk && (
                            <p className="text-red-500 text-sm">{(errors.bhk as any).message}</p>
                        )}
                    </div>
                )}

                {/* Purpose */}
                <div>
                    <label className="block mb-1">Purpose</label>
                    <select {...register("purpose")} className="input">
                        <option value="Buy">Buy</option>
                        <option value="Rent">Rent</option>
                    </select>
                    {errors.purpose && (
                        <p className="text-red-500 text-sm">{(errors.purpose as any).message}</p>
                    )}
                </div>

                {/* Budgets */}
                <div className="flex space-x-2">
                    <div className="flex-1">
                        <label className="block mb-1">Budget Min</label>
                        <input
                            type="number"
                            {...register("budgetMin", { valueAsNumber: true })}
                            className="input"
                        />
                        {errors.budgetMin && (
                            <p className="text-red-500 text-sm">{(errors.budgetMin as any).message}</p>
                        )}
                    </div>
                    <div className="flex-1">
                        <label className="block mb-1">Budget Max</label>
                        <input
                            type="number"
                            {...register("budgetMax", { valueAsNumber: true })}
                            className="input"
                        />
                        {errors.budgetMax && (
                            <p className="text-red-500 text-sm">{(errors.budgetMax as any).message}</p>
                        )}
                    </div>
                </div>

                {/* Timeline */}
                <div>
                    <label className="block mb-1">Timeline</label>
                    <select {...register("timeline")} className="input">
                        <option value="0-3m">0-3m</option>
                        <option value="3-6m">3-6m</option>
                        <option value=">6m">&gt;6m</option>
                        <option value="Exploring">Exploring</option>
                    </select>
                    {errors.timeline && (
                        <p className="text-red-500 text-sm">{(errors.timeline as any).message}</p>
                    )}
                </div>

                {/* Source */}
                <div>
                    <label className="block mb-1">Source</label>
                    <select {...register("source")} className="input">
                        <option value="Website">Website</option>
                        <option value="Referral">Referral</option>
                        <option value="Walk-in">Walk-in</option>
                        <option value="Call">Call</option>
                        <option value="Other">Other</option>
                    </select>
                    {errors.source && (
                        <p className="text-red-500 text-sm">{(errors.source as any).message}</p>
                    )}
                </div>

                {/* Notes */}
                <div>
                    <label className="block mb-1">Notes</label>
                    <textarea {...register("notes")} className="input" rows={3} />
                    {errors.notes && (
                        <p className="text-red-500 text-sm">{(errors.notes as any).message}</p>
                    )}
                </div>

                {/* Tags */}
                <div>
                    <label className="block mb-1">Tags (comma-separated)</label>
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
                        className="input"
                    />
                    {errors.tags && (
                        <p className="text-red-500 text-sm">{(errors.tags as any).message}</p>
                    )}
                </div>

                {error && <p className="text-red-500">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full"
                >
                    {loading ? "Creating..." : "Create Buyer"}
                </button>
            </form>
        </div>
    );
}
