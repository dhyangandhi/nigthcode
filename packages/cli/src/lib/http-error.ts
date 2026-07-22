import { toErrorString } from "@nightcode/shared";

type ErrorResponse = {
    json: () => Promise<unknown>;
    status: number;
    statusText: string;
};

export async function getErrorMessage(response: ErrorResponse): Promise<string> {
    try {
        const data = await response.json();
        const str = toErrorString(data);
        if (str && str !== "An unexpected error occurred") {
            return str;
        }
    } catch {
        
    }

    return response.statusText || `Request failed with status ${response.status}`;
}