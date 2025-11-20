/**
 * Force logout user by clearing all cookies (including httpOnly) and redirecting to login page.
 * This function will ALWAYS logout the user, even if the token is invalid/expired.
 * Uses a special force-logout endpoint that can delete httpOnly cookies.
 */
export const logoutAndRedirect = async () => {
    try {
        // Use force-logout endpoint which can delete httpOnly cookies
        // This works even when the token is invalid
        await fetch("/api/auth/force-logout", {
            method: "POST",
            credentials: "include"
        });
    } catch (e) {
        console.warn("Force logout API call failed:", e);
    }

    // Also clear any non-httpOnly cookies client-side as extra safety
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }

    // Force reload to login page and clear any client state
    window.location.href = "/";
};
