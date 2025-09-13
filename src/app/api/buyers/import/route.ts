// src/app/api/buyers/import/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { parseCsv } from "@/lib/csv/buyers";
import {
    mapBhkToDb,
    mapTimelineToDb,
    mapSourceToDb,
} from "@/lib/mappers/buyers";

/**
 * POST handler expects raw CSV text in the body.
 * Returns:
 *  { inserted: number, buyers: Buyer[], errors: [{ rowNum, errors: [{path,message}] }] }
 */
export async function POST(req: Request) {
    try {
        // Auth
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const ownerId = session.user.id;

        // Read CSV text
        const csvText = await req.text();
        console.log("📥 Raw CSV length:", csvText?.length ?? 0);
        if (!csvText || csvText.trim() === "") {
            return NextResponse.json({ error: "Empty CSV" }, { status: 400 });
        }

        // Parse and validate rows (per-row zod validation done in parseCsv)
        const { valid: parsedValid, invalid } = parseCsv(csvText);

        // Start with parse/validation errors reported by parseCsv
        const errors: { rowNum: number; errors: { path: string; message: string }[] }[] = [
            ...invalid,
        ];

        // If there are no validated rows, return early with errors
        if (parsedValid.length === 0) {
            return NextResponse.json({ inserted: 0, buyers: [], errors }, { status: 200 });
        }

        // Build a mutable copy for insertion
        const rowsToInsert = parsedValid.map((r) => ({ ...r })); // each: {rowNum, data}

        // 1) Detect duplicate emails within CSV (keep first occurrence)
        const seenEmail = new Map<string, number>(); // email -> index in rowsToInsert
        for (let i = 0; i < parsedValid.length; i++) {
            const r = parsedValid[i];
            const em = r.data.email ? String(r.data.email).trim().toLowerCase() : null;
            if (!em) continue;
            if (!seenEmail.has(em)) {
                seenEmail.set(em, i);
            } else {
                // duplicate in CSV => push error and remove from rowsToInsert
                errors.push({
                    rowNum: r.rowNum,
                    errors: [{ path: "email", message: `Duplicate email in CSV: ${em}` }],
                });
                const idx = rowsToInsert.findIndex((x) => x.rowNum === r.rowNum);
                if (idx !== -1) rowsToInsert.splice(idx, 1);
            }
        }

        // 2) Check against DB existing emails (unique constraint). Remove conflicting rows and add errors.
        const emailsToCheck = Array.from(
            new Set(
                rowsToInsert
                    .map((r) => (r.data.email ? String(r.data.email).trim().toLowerCase() : null))
                    .filter(Boolean) as string[]
            )
        );

        if (emailsToCheck.length > 0) {
            const found = await prisma.buyer.findMany({
                where: { email: { in: emailsToCheck } },
                select: { email: true },
            });
            const existingEmails = new Set(found.map((f) => (f.email ? f.email.toLowerCase() : "")));

            for (const r of [...rowsToInsert]) {
                const em = r.data.email ? String(r.data.email).trim().toLowerCase() : null;
                if (em && existingEmails.has(em)) {
                    errors.push({
                        rowNum: r.rowNum,
                        errors: [{ path: "email", message: `Email already exists: ${em}` }],
                    });
                    const idx = rowsToInsert.findIndex((x) => x.rowNum === r.rowNum);
                    if (idx !== -1) rowsToInsert.splice(idx, 1);
                }
            }
        }

        // Nothing left to insert?
        if (rowsToInsert.length === 0) {
            return NextResponse.json({ inserted: 0, buyers: [], errors }, { status: 200 });
        }

        // 3) Insert remaining rows in a transaction. If transaction fails unexpectedly, return a server error.
        const insertedBuyers: any[] = [];
        try {
            await prisma.$transaction(async (tx) => {
                for (const r of rowsToInsert) {
                    const d = r.data;

                    // Map CSV (form) values -> Prisma enum names using your mappers
                    const bhkPrisma = d.bhk ? mapBhkToDb(d.bhk) : null;
                    const timelinePrisma = mapTimelineToDb(d.timeline);
                    const sourcePrisma = mapSourceToDb(d.source);

                    // Defensive checks — these should have been enforced by Zod earlier.
                    if (!timelinePrisma) {
                        // record error and skip (should not usually happen because zod validated)
                        errors.push({
                            rowNum: r.rowNum,
                            errors: [{ path: "timeline", message: `Invalid timeline: ${String(d.timeline)}` }],
                        });
                        continue;
                    }
                    if (!sourcePrisma) {
                        errors.push({
                            rowNum: r.rowNum,
                            errors: [{ path: "source", message: `Invalid source: ${String(d.source)}` }],
                        });
                        continue;
                    }

                    const buyer = await tx.buyer.create({
                        data: {
                            fullName: d.fullName,
                            email: d.email ? String(d.email).trim().toLowerCase() : null,
                            phone: d.phone,
                            city: d.city,
                            propertyType: d.propertyType,
                            bhk: bhkPrisma,
                            purpose: d.purpose,
                            budgetMin: d.budgetMin ?? null,
                            budgetMax: d.budgetMax ?? null,
                            timeline: timelinePrisma,
                            source: sourcePrisma,
                            status: d.status,
                            notes: d.notes ?? null,
                            tags: d.tags ?? [],
                            ownerId,
                        },
                    });

                    await tx.buyerHistory.create({
                        data: {
                            buyerId: buyer.id,
                            changedBy: ownerId,
                            diff: { created: d },
                        },
                    });

                    insertedBuyers.push(buyer);
                }
            });
        } catch (err: any) {
            console.error("Import transaction failed:", err);
            // If transaction-level unique constraint slipped through, map to a friendly error
            if (err?.code === "P2002") {
                return NextResponse.json({ error: "Duplicate constraint during insert", details: err }, { status: 409 });
            }
            return NextResponse.json({ error: err.message ?? "Transaction failed" }, { status: 500 });
        }

        // Return inserted count and detailed error list (row-level)
        return NextResponse.json({ inserted: insertedBuyers.length, buyers: insertedBuyers, errors }, { status: 200 });
    } catch (err: any) {
        console.error("Import route error:", err);
        return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
    }
}
