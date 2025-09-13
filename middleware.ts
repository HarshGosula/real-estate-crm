// middleware.ts (place at project root or src/middleware.ts)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    // Only protect the buyers endpoints
    if (!path.startsWith("/api/buyers")) {
        return NextResponse.next();
    }

    // Let CORS preflight through
    if (req.method === "OPTIONS") {
        return NextResponse.next();
    }

    // Accept token from Authorization header OR cookie named 'token'
    const authHeader = req.headers.get("authorization") ?? "";
    const cookieToken = req.cookies.get("token")?.value ?? "";
    const token =
        authHeader.toLowerCase().startsWith("bearer ")
            ? authHeader.split(" ")[1]
            : cookieToken;

    if (!token) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
        });
    }

    try {
        // verifyToken may be sync or async — both are supported
        const decoded = await verifyToken(token);
        if (!decoded) throw new Error("Invalid token");

        // Forward a copy of incoming headers, plus an x-user-id header so API handlers
        // don't have to re-parse the token if you don't want them to.
        const requestHeaders = new Headers(req.headers);
        if ((decoded as any).id) {
            requestHeaders.set("x-user-id", String((decoded as any).id));
        }

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    } catch (err) {
        return new NextResponse(JSON.stringify({ error: "Invalid or expired token" }), {
            status: 401,
            headers: { "content-type": "application/json" },
        });
    }
}

export const config = {
    // run only for buyers routes
    matcher: ["/api/buyers", "/api/buyers/:path*"],
};
