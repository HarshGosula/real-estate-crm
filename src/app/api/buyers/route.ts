// src/app/api/buyers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBuyerSchema } from "@/lib/validations/buyer";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import type { BHK as BHKType, Timeline as TimelineType, Source as SourceType } from "@prisma/client";

function mapBHK(input?: string | null): BHKType | null {
    if (!input) return null;
    if (input === "Studio") return "Studio";
    if (input === "1") return "One";
    if (input === "2") return "Two";
    if (input === "3") return "Three";
    if (input === "4") return "Four";
    throw new Error("Invalid BHK");
}

function mapTimeline(input: string): TimelineType {
    switch (input) {
        case "0-3m":
            return "ZeroTo3m";
        case "3-6m":
            return "ThreeTo6m";
        case ">6m":
            return "GreaterThan6m";
        case "Exploring":
            return "Exploring";
        default:
            throw new Error("Invalid timeline");
    }
}

function mapSource(input: string): SourceType {
    if (input === "Walk-in") return "WalkIn";
    if (input === "Website") return "Website";
    if (input === "Referral") return "Referral";
    if (input === "Call") return "Call";
    if (input === "Other") return "Other";
    throw new Error("Invalid source");
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validate
        const parsed = createBuyerSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }
        const data = parsed.data;

        // Auth
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Map to Prisma enum names
        const bhkPrisma = mapBHK(data.bhk ?? null);
        const timelinePrisma = mapTimeline(data.timeline);
        const sourcePrisma = mapSource(data.source);

        // Create buyer
        const buyer = await prisma.buyer.create({
            data: {
                fullName: data.fullName,
                email: data.email ?? null,
                phone: data.phone,
                city: data.city,
                propertyType: data.propertyType,
                bhk: bhkPrisma,
                purpose: data.purpose,
                budgetMin: data.budgetMin ?? null,
                budgetMax: data.budgetMax ?? null,
                timeline: timelinePrisma,
                source: sourcePrisma,
                notes: data.notes ?? null,
                tags: data.tags ?? [],
                ownerId: session.user.id,
            },
        });

        // BuyerHistory: your Prisma schema expects buyerId, changedBy, diff
        await prisma.buyerHistory.create({
            data: {
                buyerId: buyer.id,
                changedBy: session.user.id,
                diff: { created: data },
            },
        });

        return NextResponse.json({ success: true, buyer }, { status: 201 });
    } catch (err: any) {
        console.error("create buyer error:", err);
        return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
    }
}
