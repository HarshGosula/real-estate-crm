// src/app/api/buyers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBuyerSchema } from "@/lib/validations/buyer";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import {
    mapTimelineToDb,
    mapBhkToDb,
    mapSourceToDb,
} from "@/lib/mappers/buyers";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("Received create payload:", body);

        // Validate
        const parsed = createBuyerSchema.safeParse(body);
        if (!parsed.success) {
            console.log("Create validation errors:", parsed.error.flatten());
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }
        const data = parsed.data;
        console.log("Parsed create data:", data);

        // Auth
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // normalize email (it should already be normalized by zod, but be defensive)
        const normalizedEmail = data.email ? data.email.trim().toLowerCase() : null;

        // If email provided, ensure it doesn't already exist
        if (normalizedEmail) {
            const existing = await prisma.buyer.findUnique({
                where: { email: normalizedEmail },
            });
            if (existing) {
                return NextResponse.json({ error: "Email already exists" }, { status: 409 });
            }
        }

        // Map to Prisma enum names using your mappers
        const bhkPrisma = data.bhk ? mapBhkToDb(data.bhk) : null;
        const timelinePrisma = mapTimelineToDb(data.timeline);
        const sourcePrisma = mapSourceToDb(data.source);

        // Ensure required fields are not undefined
        if (!timelinePrisma) {
            throw new Error(`Invalid timeline value: ${data.timeline}`);
        }
        if (!sourcePrisma) {
            throw new Error(`Invalid source value: ${data.source}`);
        }

        console.log("Mapped values:", { bhkPrisma, timelinePrisma, sourcePrisma });

        // Create buyer
        const buyer = await prisma.buyer.create({
            data: {
                fullName: data.fullName,
                email: normalizedEmail, // use normalized email or null
                phone: data.phone,
                city: data.city,
                propertyType: data.propertyType,
                bhk: bhkPrisma,
                purpose: data.purpose,
                budgetMin: data.budgetMin ?? null,
                budgetMax: data.budgetMax ?? null,
                timeline: timelinePrisma,
                source: sourcePrisma,
                status: data.status,
                notes: data.notes || null,
                tags: data.tags ?? [],
                ownerId: session.user.id,
            },
        });

        // BuyerHistory
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

        // If unique constraint (race or missed check), return a 409
        if (err?.code === "P2002") {
            return NextResponse.json({ error: "Duplicate value - email already exists" }, { status: 409 });
        }

        return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
    }
}