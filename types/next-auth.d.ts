// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    // extend default Session.user with id and role
    interface Session {
        user: {
            id: string;
            role: string;
        } & DefaultSession["user"];
    }

    // extend default User (if you use `user` in your authorize)
    interface User extends DefaultUser {
        id: string;
        role?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        role?: string;
    }
}
