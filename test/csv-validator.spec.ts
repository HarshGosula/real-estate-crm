// test/csv-validator.spec.ts
import { describe, it, expect } from "vitest";
import { parseCsvRowRaw, validateCsvRow } from "../lib/csv/buyers";

// We import type CreateBuyerInput if needed (not strictly required)
import { createBuyerSchema } from "@/lib/validations/buyer";

describe("CSV row validator (budget/bhk) - unit tests", () => {
    it("fails when budgetMax < budgetMin", () => {
        const candidate = {
            fullName: "Test User",
            phone: "9876543210",
            city: "Chandigarh",
            propertyType: "Plot",
            purpose: "Buy",
            budgetMin: 5000,
            budgetMax: 1000, // invalid
            timeline: "0-3m",
            source: "Website",
            status: "New",
            tags: [],
        };

        const result = validateCsvRow(candidate as any, 2);
        expect(result.success).toBe(false);
        if (!result.success) {
            const messages = result.errors.map((e) => e.message).join(" | ");
            expect(messages).toContain("budgetMax must be ≥ budgetMin");
        }
    });

    it("requires BHK for Apartment/Villa", () => {
        const candidate = {
            fullName: "A User",
            phone: "9876543210",
            city: "Chandigarh",
            propertyType: "Apartment", // needs bhk
            purpose: "Buy",
            // bhk missing
            timeline: "0-3m",
            source: "Website",
            status: "New",
            tags: [],
        };

        const result = validateCsvRow(candidate as any, 3);
        expect(result.success).toBe(false);
        if (!result.success) {
            const found = result.errors.find((e) => e.path.includes("bhk"));
            expect(found).toBeDefined();
            expect(found!.message).toMatch(/BHK is required/);
        }
    });
});
