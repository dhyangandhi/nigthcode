export function toErrorString(err: unknown): string {
    if (typeof err === "string" && err.length > 0) {
        return err === "[object Object]" ? "An unexpected error occurred" : err;
    }

    if (err && typeof err === "object") {
        const anyErr = err as Record<string, any>;

        if (typeof anyErr.message === "string" && anyErr.message !== "[object Object]" && anyErr.message.length > 0) {
            return anyErr.message;
        }

        if (anyErr.error) {
            if (typeof anyErr.error === "string" && anyErr.error !== "[object Object]") {
                return anyErr.error;
            }
            if (typeof anyErr.error === "object" && anyErr.error !== null) {
                if (typeof anyErr.error.message === "string" && anyErr.error.message !== "[object Object]") {
                    return anyErr.error.message;
                }
            }
        }

        if (anyErr.cause) {
            const causeStr = toErrorString(anyErr.cause);
            if (causeStr && causeStr !== "An unexpected error occurred") {
                return causeStr;
            }
        }

        if (typeof anyErr.responseBody === "string" && anyErr.responseBody) {
            return anyErr.responseBody;
        }

        try {
            const str = JSON.stringify(err);
            if (str && str !== "{}") return str;
        } catch {
            // fallback
        }
    }

    const fallback = String(err ?? "Unknown error");
    return fallback === "[object Object]" ? "An unexpected error occurred" : fallback;
}
