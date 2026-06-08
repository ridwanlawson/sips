/**
 * Device helper utilities — shared between attendance and harvest pages.
 * Extracts device fingerprint details for form auto-fill.
 */

/**
 * Returns a human-readable OS • Browser string from the user agent.
 */
export const getReadableDevice = (): string => {
    if (typeof navigator === 'undefined') return 'Unknown • Unknown';
    const ua = navigator.userAgent;
    const os = /Windows/i.test(ua)
        ? 'Windows'
        : /Android/i.test(ua)
            ? 'Android'
            : /iPhone|iPad|iPod/i.test(ua)
                ? 'iOS'
                : /Mac OS X/i.test(ua)
                    ? 'macOS'
                    : /Linux/i.test(ua)
                        ? 'Linux'
                        : 'Unknown';
    const browser = /Edg\//i.test(ua)
        ? 'Edge'
        : /Chrome\//i.test(ua)
            ? 'Chrome'
            : /Firefox\//i.test(ua)
                ? 'Firefox'
                : /Safari\//i.test(ua)
                    ? 'Safari'
                    : 'Browser';
    return `${os} • ${browser}`;
};

/**
 * Returns a stable device ID and pseudo-MAC address persisted in localStorage.
 * Creates them on first call.
 */
export const getOrCreateDeviceIds = (): { deviceId: string; pseudoMac: string } => {
    if (typeof window === 'undefined') return { deviceId: '', pseudoMac: '' };
    const devKey = 'sips_device_id';
    const macKey = 'sips_pseudo_mac';
    let deviceId = localStorage.getItem(devKey) || '';
    let pseudoMac = localStorage.getItem(macKey) || '';

    const ensurePseudoMacFormat = (s: string): string => {
        const hex = s
            .replace(/[^a-f0-9]/gi, '')
            .padEnd(12, '0')
            .slice(0, 12);
        const formatted =
            hex
                .match(/.{1,2}/g)
                ?.join(':')
                .toUpperCase() ?? '00:00:00:00:00:00';
        return formatted;
    };

    if (!deviceId) {
        const rnd = (globalThis.crypto as Crypto | undefined)?.randomUUID?.();
        deviceId = rnd ?? String(Date.now()) + Math.random().toString(16).slice(2);
        localStorage.setItem(devKey, deviceId);
    }

    if (!pseudoMac) {
        const seed = `${navigator.userAgent}|${deviceId}|${screen.width}x${screen.height
            }|${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
        let h = 0;
        for (let i = 0; i < seed.length; i += 1) {
            h = (h * 31 + seed.charCodeAt(i)) >>> 0;
        }
        pseudoMac = ensurePseudoMacFormat(h.toString(16));
        localStorage.setItem(macKey, pseudoMac);
    }

    return { deviceId, pseudoMac };
};
