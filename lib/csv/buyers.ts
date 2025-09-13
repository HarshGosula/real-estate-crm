// src/lib/csv/buyers.ts
import Papa from "papaparse";
import { ZodError } from "zod";
import { createBuyerSchema, CreateBuyerInput } from "@/lib/validations/buyer";

/**
 * Helper: case-insensitive header lookup allowing "Full Name" or "fullName"
 */
function getField(row: Record<string, string>, ...names: string[]) {
    for (const n of names) {
        // direct key
        if (Object.prototype.hasOwnProperty.call(row, n) && row[n] !== undefined) return row[n];
        // case-insensitive with spaces removed
        const key = Object.keys(row).find(
            (k) => k.replace(/\s+/g, "").toLowerCase() === n.replace(/\s+/g, "").toLowerCase()
        );
        if (key) return row[key];
    }
    return undefined;
}

/**
 * Light coercions for commonly seen inputs:
 * - "3 BHK" -> "3"
 * - "studio" -> "Studio"
 * - trims strings
 */
function normalizeBhk(raw?: string | undefined): string | undefined {
    if (!raw) return undefined;
    const s = String(raw).trim();
    if (/studio/i.test(s)) return "Studio";
    const m = s.match(/\b([1-4])\b/);
    if (m) return m[1];
    // return as-is (will fail zod if invalid)
    return s;
}

function toNumberOrUndefined(v?: string | undefined): number | undefined {
    if (v === undefined || v === null) return undefined;
    const s = String(v).trim();
    if (s === "") return undefined;
    const n = Number(s.replace(/[, ]+/g, ""));
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

/**
 * Parse a single CSV row (raw strings) into a Candidate object for validation.
 * Does not mutate global mappers; keeps mapping local to CSV processing.
 */
export type CsvParseInvalid = { rowNum: number; errors: { path: string; message: string }[] };
export type CsvParseValid = { rowNum: number; data: CreateBuyerInput };

export function parseCsvRowRaw(row: Record<string, string>, rowNum: number) {
    // Accept both "Full Name" and "fullName" style headers
    const fullName = getField(row, "Full Name", "fullName")?.trim();
    const email = getField(row, "Email", "email")?.trim() ?? "";
    const phone = getField(row, "Phone", "phone")?.trim() ?? "";
    const city = getField(row, "City", "city")?.trim();
    const propertyType = getField(row, "Property Type", "propertyType")?.trim();
    const purpose = getField(row, "Purpose", "purpose")?.trim();
    const bhkRaw = getField(row, "BHK", "bhk");
    const bhk = normalizeBhk(bhkRaw);
    const budgetMin = toNumberOrUndefined(getField(row, "Budget Min", "budgetMin"));
    const budgetMax = toNumberOrUndefined(getField(row, "Budget Max", "budgetMax"));
    const timeline = getField(row, "Timeline", "timeline")?.trim();
    const source = getField(row, "Source", "source")?.trim();
    const status = getField(row, "Status", "status")?.trim();
    const notes = getField(row, "Notes", "notes")?.trim();
    const tagsRaw = getField(row, "Tags", "tags") ?? "";
    const tags = String(tagsRaw)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

    // Build candidate object matching CreateBuyerInput shape (strings/nums/arrays)
    const candidate: any = {
        fullName: fullName ?? "",
        email: email === "" ? "" : email,
        phone,
        city: city ?? undefined,
        propertyType: propertyType ?? undefined,
        purpose: purpose ?? undefined,
        bhk: bhk ?? undefined,
        budgetMin,
        budgetMax,
        timeline: timeline ?? undefined,
        source: source ?? undefined,
        status: status ?? undefined,
        notes: notes ?? undefined,
        tags,
    };

    return candidate as Partial<CreateBuyerInput>;
}

/**
 * Validate a parsed candidate row using zod schema and produce structured errors.
 */
export function validateCsvRow(
    candidate: Partial<CreateBuyerInput>,
    rowNum: number
): { success: true; data: CreateBuyerInput } | { success: false; rowNum: number; errors: { path: string; message: string }[] } {
    const parsed = createBuyerSchema.safeParse(candidate);
    if (parsed.success) {
        return { success: true, data: parsed.data };
    } else {
        // Convert Zod issues to {path,message} format
        const z = parsed.error as ZodError<any>;
        const errors = z.issues.map((issue) => ({
            path: issue.path.length > 0 ? issue.path.join(".") : "row",
            message: issue.message,
        }));
        return { success: false, rowNum, errors };
    }
}

/**
 * Parse full CSV text and return valid and invalid arrays.
 * Row numbering uses 1-based CSV + header => first data row = 2
 */
export function parseCsv(content: string): {
    valid: CsvParseValid[];
    invalid: CsvParseInvalid[];
} {
    const parsed = Papa.parse<Record<string, string>>(content, {
        header: true,
        skipEmptyLines: true,
    });

    const valid: CsvParseValid[] = [];
    const invalid: CsvParseInvalid[] = [];

    // If Papa reported parsing errors, surface them as rowNum 0
    if (parsed.errors && parsed.errors.length > 0) {
        parsed.errors.forEach((e) => {
            invalid.push({
                rowNum: e.row ?? 0,
                errors: [{ path: "parse", message: e.message }],
            });
        });
    }

    parsed.data.forEach((row, idx) => {
        const rowNum = idx + 2; // header row = 1
        try {
            const candidate = parseCsvRowRaw(row, rowNum);
            const result = validateCsvRow(candidate, rowNum);
            if (result.success) {
                valid.push({ rowNum, data: result.data });
            } else {
                invalid.push({ rowNum, errors: result.errors });
            }
        } catch (err: any) {
            invalid.push({
                rowNum,
                errors: [{ path: "exception", message: String(err?.message ?? err) }],
            });
        }
    });

    return { valid, invalid };
}
