// Simplified fetch hook for local development
// In production with Shopify, this would use App Bridge authentication

export function useAuthenticatedFetch() {
    // For local development without Shopify context
    // In production, this would use App Bridge for authentication

    return async (uri, options) => {
        try {
            const response = await fetch(uri, options);
            return response;
        } catch (error) {
            console.error("Fetch error:", error);
            throw error;
        }
    };
}

function checkHeadersForReauthorization(headers, app) {
    if (headers.get("X-Shopify-API-Request-Failure-Reauthorize") === "1") {
        const authUrlHeader = headers.get(
            "X-Shopify-API-Request-Failure-Reauthorize-Url"
        );

        const redirect = Redirect.create(app);
        redirect.dispatch(Redirect.Action.APP, authUrlHeader || `/api/auth`);
    }
}
