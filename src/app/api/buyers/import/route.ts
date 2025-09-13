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
        if (!csvText || csvText.trim() === "") {
            return NextResponse.json({ error: "Empty CSV" }, { status: 400 });
        }

        // Parse and validate rows (per-row zod validation done in parseCsv)
        const { valid: parsedValid, invalid } = parseCsv(csvText);

        // Collect errors from parseCsv (parse/zod validation)
        const errors: { rowNum: number; errors: { path: string; message: string }[] }[] = [
            ...invalid,
        ];

        // If no valid rows at all, return early with the validation errors
        if (!parsedValid || parsedValid.length === 0) {
            return NextResponse.json({ inserted: 0, buyers: [], errors }, { status: 200 });
        }

        // Create a mutable list of rows to attempt inserting; each item has shape { rowNum, data }
        const rowsToInsert = parsedValid.map((r) => ({ ...r })); // shallow copy

        // --- Stage A: detect duplicate emails *within* CSV and record errors ---
        const seen = new Map<string, number>(); // email -> first index in parsedValid
        for (const r of parsedValid) {
            const emailRaw = r.data.email ? String(r.data.email).trim().toLowerCase() : null;
            if (!emailRaw) continue;
            if (!seen.has(emailRaw)) {
                seen.set(emailRaw, r.rowNum);
            } else {
                // mark error for duplicate occurrence (this row)
                errors.push({
                    rowNum: r.rowNum,
                    errors: [{ path: "email", message: `Duplicate email in CSV: ${emailRaw}` }],
                });
                // remove it from rowsToInsert
                const idx = rowsToInsert.findIndex((x) => x.rowNum === r.rowNum);
                if (idx !== -1) rowsToInsert.splice(idx, 1);
            }
        }

        // --- Stage B: check against DB for existing emails (unique constraint).
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

        // --- Stage C: attempt to map form values to Prisma enums safely ---
        // We MUST not call mappers inside transaction if they throw; wrap them and treat mapping throws as per-row errors.
        // For each row, try to get mapped values; if mapping fails, record an error and remove the row.
        const preparedRows: {
            rowNum: number;
            data: any; // original parsed CreateBuyerInput
            mapped: { bhk: any; timeline: any; source: any };
        }[] = [];

        for (const r of [...rowsToInsert]) {
            const d = r.data;
            let bhkPrisma: any = null;
            let timelinePrisma: any = null;
            let sourcePrisma: any = null;
            let mappingError = false;

            // mapBhkToDb may throw on invalid; wrap
            try {
                bhkPrisma = d.bhk ? mapBhkToDb(d.bhk) : null;
            } catch (merr: any) {
                errors.push({
                    rowNum: r.rowNum,
                    errors: [{ path: "bhk", message: `Invalid bhk value: ${String(d.bhk)}` }],
                });
                mappingError = true;
            }

            // timeline
            try {
                // mapTimelineToDb throws on invalid inputs
                timelinePrisma = d.timeline ? mapTimelineToDb(d.timeline) : undefined;
                if (timelinePrisma === undefined || timelinePrisma === null) {
                    // mapper may not throw but return undefined — treat as mapping error
                    errors.push({
                        rowNum: r.rowNum,
                        errors: [{ path: "timeline", message: `Invalid timeline value: ${String(d.timeline)}` }],
                    });
                    mappingError = true;
                }
            } catch (merr: any) {
                errors.push({
                    rowNum: r.rowNum,
                    errors: [{ path: "timeline", message: `Invalid timeline value: ${String(d.timeline)}` }],
                });
                mappingError = true;
            }

            // source
            try {
                sourcePrisma = d.source ? mapSourceToDb(d.source) : undefined;
                if (sourcePrisma === undefined || sourcePrisma === null) {
                    errors.push({
                        rowNum: r.rowNum,
                        errors: [{ path: "source", message: `Invalid source value: ${String(d.source)}` }],
                    });
                    mappingError = true;
                }
            } catch (merr: any) {
                errors.push({
                    rowNum: r.rowNum,
                    errors: [{ path: "source", message: `Invalid source value: ${String(d.source)}` }],
                });
                mappingError = true;
            }

            if (mappingError) {
                // remove offending row
                const idx = rowsToInsert.findIndex((x) => x.rowNum === r.rowNum);
                if (idx !== -1) rowsToInsert.splice(idx, 1);
                continue;
            }

            // all mapping ok → push to preparedRows with mapped enum names
            preparedRows.push({
                rowNum: r.rowNum,
                data: d,
                mapped: { bhk: bhkPrisma, timeline: timelinePrisma, source: sourcePrisma },
            });
        }

        // If nothing remains to insert after mapping checks, return with the collected errors
        if (preparedRows.length === 0) {
            return NextResponse.json({ inserted: 0, buyers: [], errors }, { status: 200 });
        }

        // --- Stage D: insert remaining rows in a single transaction
        const insertedBuyers: any[] = [];
        try {
            await prisma.$transaction(async (tx) => {
                for (const r of preparedRows) {
                    const d = r.data;
                    const mapped = r.mapped;
                    const buyer = await tx.buyer.create({
                        data: {
                            fullName: d.fullName,
                            email: d.email ? String(d.email).trim().toLowerCase() : null,
                            phone: d.phone,
                            city: d.city,
                            propertyType: d.propertyType,
                            bhk: mapped.bhk ?? null,
                            purpose: d.purpose,
                            budgetMin: d.budgetMin ?? null,
                            budgetMax: d.budgetMax ?? null,
                            timeline: mapped.timeline,
                            source: mapped.source,
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
            // transaction-level unique constraint or other DB error
            if (err?.code === "P2002") {
                // return an informative response — include DB error details if possible
                return NextResponse.json({ error: "Duplicate constraint during insert", details: err }, { status: 409 });
            }
            // General server error
            return NextResponse.json({ error: err?.message ?? "Transaction failed" }, { status: 500 });
        }

        // Return inserted count and all row-level errors collected
        return NextResponse.json({ inserted: insertedBuyers.length, buyers: insertedBuyers, errors }, { status: 200 });
    } catch (err: any) {
        console.error("Import route error:", err);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}
