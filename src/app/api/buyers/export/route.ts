// src/app/api/buyers/export/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";
import {
    mapBhkToForm,
    mapTimelineToForm,
    mapSourceToForm,
} from "@/lib/mappers/buyers";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const q = url.searchParams;

        // free-text search only against name, phone, email
        const search = q.get("q") ?? undefined;

        // explicit filters (optional)
        const city = q.get("city") ?? undefined;
        const propertyType = q.get("propertyType") ?? undefined;
        const status = q.get("status") ?? undefined;

        // sorting (optional)
        const sortBy = (q.get("sortBy") as string) || "updatedAt";
        const sortOrder = q.get("sortOrder") === "asc" ? "asc" : "desc";

        const where: any = {};

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
            ];
        }

        if (city) where.city = city;
        if (propertyType) where.propertyType = propertyType;
        if (status) where.status = status;

        // fetch full filtered set (no pagination)
        const buyers = await prisma.buyer.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
        });

        // map DB values -> CSV-friendly using your mappers
        const rows = buyers.map((b) => ({
            fullName: b.fullName,
            email: b.email ?? "",
            phone: b.phone,
            city: b.city,
            propertyType: b.propertyType,
            bhk: b.bhk ? mapBhkToForm(b.bhk) ?? "" : "",
            purpose: b.purpose,
            budgetMin: b.budgetMin ?? "",
            budgetMax: b.budgetMax ?? "",
            timeline: mapTimelineToForm(b.timeline) ?? "",
            source: mapSourceToForm(b.source) ?? "",
            notes: b.notes ?? "",
            tags: (b.tags ?? []).join(","),
            status: b.status,
        }));

        const headers = [
            "fullName",
            "email",
            "phone",
            "city",
            "propertyType",
            "bhk",
            "purpose",
            "budgetMin",
            "budgetMax",
            "timeline",
            "source",
            "notes",
            "tags",
            "status",
        ];

        const csv = Papa.unparse({ fields: headers, data: rows });

        return new NextResponse(csv, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="buyers-export.csv"`,
            },
        });
    } catch (err: any) {
        console.error("Export error:", err);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}
