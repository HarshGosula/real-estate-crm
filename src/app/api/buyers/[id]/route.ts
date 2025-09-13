// src/app/api/buyers/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { updateBuyerSchema } from "@/lib/validations/buyer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import {
    mapTimelineToForm,
    mapTimelineToDb,
    mapBhkToForm,
    mapBhkToDb,
    mapSourceToForm,
    mapSourceToDb,
} from "@/lib/mappers/buyers";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { id } = await params;
    const buyer = await prisma.buyer.findUnique({ where: { id } });
    if (!buyer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(buyer);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;

    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    console.log("Received body:", body);

    // Validate incoming payload
    const parsed = updateBuyerSchema.safeParse(body);
    if (!parsed.success) {
        console.log("Validation errors:", parsed.error.flatten());
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    console.log("Parsed data:", parsed.data);

    // Fetch current buyer
    const buyer = await prisma.buyer.findUnique({ where: { id } });
    if (!buyer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (String(buyer.ownerId) !== String(token.sub)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Concurrency check (without sending updatedAt to Prisma)
    const clientTs = new Date(parsed.data.updatedAt).getTime();
    const serverTs = new Date(buyer.updatedAt).getTime();
    if (clientTs !== serverTs) {
        return NextResponse.json({ error: "Stale", status: 409 });
    }

    // Prepare update data - use the mappers correctly
    const updateData = {
        fullName: parsed.data.fullName,
        email: parsed.data.email || null,
        phone: parsed.data.phone,
        city: parsed.data.city,
        propertyType: parsed.data.propertyType,
        bhk: parsed.data.bhk ? mapBhkToDb(parsed.data.bhk) : null,
        purpose: parsed.data.purpose,
        budgetMin: parsed.data.budgetMin ?? null,
        budgetMax: parsed.data.budgetMax ?? null,
        timeline: mapTimelineToDb(parsed.data.timeline),
        source: mapSourceToDb(parsed.data.source),
        status: parsed.data.status,
        notes: parsed.data.notes ?? null,
        tags: parsed.data.tags ?? [],
    };

    console.log("Update data being sent to Prisma:", updateData);

    // Update buyer (do NOT include updatedAt here)
    const updated = await prisma.buyer.update({
        where: { id },
        data: updateData,
    });

    // Save history
    await prisma.buyerHistory.create({
        data: {
            buyerId: id,
            changedBy: String(token.sub),
            diff: { updated: parsed.data },
        },
    });

    return NextResponse.json(updated);
}



export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = String(session.user.id);

        const buyer = await prisma.buyer.findUnique({ where: { id } });
        if (!buyer) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (String(buyer.ownerId) !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // delete history then buyer — all inside a transaction
        await prisma.$transaction([
            prisma.buyerHistory.deleteMany({ where: { buyerId: id } }),
            prisma.buyer.delete({ where: { id } }),
        ]);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: any) {
        console.error("DELETE /api/buyers/[id] error:", err);
        return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
    }
}
