// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
    // allow global `var` declarations
    // so PrismaClient isn't re-created in dev
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

export const prisma =
    global.prisma ||
    new PrismaClient({
        log: ["query", "error", "warn"],
    });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
