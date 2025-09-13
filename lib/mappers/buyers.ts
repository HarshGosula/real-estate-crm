// --- Timeline ---
export function mapTimelineToForm(
    value: string | null | undefined
): "0-3m" | "3-6m" | ">6m" | "Exploring" | undefined {
    switch (value) {
        case "ZeroTo3m": return "0-3m";
        case "ThreeTo6m": return "3-6m";
        case "GreaterThan6m": return ">6m";
        case "Exploring": return "Exploring";
        default: return undefined; // no more ""
    }
}

export function mapTimelineToDb(
    value: "0-3m" | "3-6m" | ">6m" | "Exploring" | undefined
): "ZeroTo3m" | "ThreeTo6m" | "GreaterThan6m" | "Exploring" {
    switch (value) {
        case "0-3m": return "ZeroTo3m";
        case "3-6m": return "ThreeTo6m";
        case ">6m": return "GreaterThan6m";
        case "Exploring": return "Exploring";
        default: throw new Error(`Invalid timeline value: ${value}`);
    }
}

// --- BHK ---
export function mapBhkToForm(
    value?: string | null
): "Studio" | "1" | "2" | "3" | "4" | undefined {
    switch (value) {
        case "One": return "1";
        case "Two": return "2";
        case "Three": return "3";
        case "Four": return "4";
        case "Studio": return "Studio";
        default: return undefined;
    }
}

export function mapBhkToDb(
    value?: "Studio" | "1" | "2" | "3" | "4"
): "One" | "Two" | "Three" | "Four" | "Studio" | null {
    switch (value) {
        case "1": return "One";
        case "2": return "Two";
        case "3": return "Three";
        case "4": return "Four";
        case "Studio": return "Studio";
        case undefined:
        case null:
            return null;
        default: throw new Error(`Invalid BHK value: ${value}`);
    }
}
// --- Source ---
export function mapSourceToForm(
    value: string | null | undefined
): "Website" | "Referral" | "Walk-in" | "Call" | "Other" | undefined {
    switch (value) {
        case "WalkIn": return "Walk-in";
        case "Website":
        case "Referral":
        case "Call":
        case "Other":
            return value;
        default: return undefined;
    }
}

export function mapSourceToDb(
    value: "Website" | "Referral" | "Walk-in" | "Call" | "Other" | undefined
): "Website" | "Referral" | "WalkIn" | "Call" | "Other" {
    switch (value) {
        case "Walk-in": return "WalkIn";
        case "Website":
        case "Referral":
        case "Call":
        case "Other":
            return value;
        default: throw new Error(`Invalid source value: ${value}`);
    }
}
