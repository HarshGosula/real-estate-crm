// src/lib/validations/buyer.ts
import { z } from "zod";

export const CityEnum = z.enum([
    "Chandigarh",
    "Mohali",
    "Zirakpur",
    "Panchkula",
    "Other",
]);

export const PropertyTypeEnum = z.enum([
    "Apartment",
    "Villa",
    "Plot",
    "Office",
    "Retail",
]);

export const BHKEnum = z.enum(["Studio", "1", "2", "3", "4"]); // matches form + Prisma @map

export const PurposeEnum = z.enum(["Buy", "Rent"]);

export const TimelineEnum = z.enum(["0-3m", "3-6m", ">6m", "Exploring"]);

export const SourceEnum = z.enum([
    "Website",
    "Referral",
    "Walk-in", // Prisma @map("Walk-in")
    "Call",
    "Other",
]);

export const StatusEnum = z.enum([
    "New",
    "Qualified",
    "Contacted",
    "Visited",
    "Negotiation",
    "Converted",
    "Dropped",
]);

export const createBuyerSchema = z
    .object({
        fullName: z
            .string()
            .min(2, "Full name must be at least 2 characters")
            .max(80),
        email: z.string().email("Invalid email").optional().or(z.literal("")),
        phone: z.string().regex(/^\d{10,15}$/, "Phone must be 10–15 digits"),
        city: CityEnum,
        propertyType: PropertyTypeEnum,
        bhk: BHKEnum.optional(),
        purpose: PurposeEnum,

        // preprocess numeric fields (accepts "" | undefined | number)
        budgetMin: z.preprocess(
            (v) => {
                if (v === "" || v === undefined || v === null) return undefined;
                const n = Number(v);
                return Number.isFinite(n) ? Math.trunc(n) : undefined;
            },
            z.number().int().positive().optional()
        ),
        budgetMax: z.preprocess(
            (v) => {
                if (v === "" || v === undefined || v === null) return undefined;
                const n = Number(v);
                return Number.isFinite(n) ? Math.trunc(n) : undefined;
            },
            z.number().int().positive().optional()
        ),

        timeline: TimelineEnum,
        source: SourceEnum,
        notes: z.string().max(1000).optional(),

        // tags: accept comma-separated string OR array, default []
        tags: z
            .preprocess((v) => {
                if (Array.isArray(v)) return v.filter(Boolean);
                if (typeof v === "string") {
                    return v
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                }
                return [];
            }, z.array(z.string()).default([])),
    })
    .refine(
        (data) =>
            !(
                ["Apartment", "Villa"].includes(data.propertyType) &&
                !data.bhk
            ),
        {
            message: "BHK is required for Apartment/Villa",
            path: ["bhk"],
        }
    )
    .refine(
        (data) =>
            !(data.budgetMin && data.budgetMax && data.budgetMax < data.budgetMin),
        {
            message: "budgetMax must be ≥ budgetMin",
            path: ["budgetMax"],
        }
    );

export type CreateBuyerInput = z.infer<typeof createBuyerSchema>;
