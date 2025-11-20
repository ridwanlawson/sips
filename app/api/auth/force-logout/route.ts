import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Force logout endpoint - clears all cookies regardless of token validity
 * This is used when token is invalid/expired and normal logout fails
 */
export async function POST() {
    try {
        const cookieStore = await cookies();

        // Delete all authentication and user-related cookies
        const cookiesToDelete = [
            'auth_token',
            'log_id',
            'user_Afdeling',
            'user_Fcba',
            'user_FullName',
            'user_Gang',
            'user_Kode',
            'user_Level',
            'user_Photo',
            'user_Position',
            'user_Section',
            'user_SECTION',
            'user_section',
            'user_afdeling',
            'user_FCBA',
            'user_fcba',
            'user_LEVEL',
            'user_level',
            'user_GANG',
            'user_gang',
            'opt_fcba',
            'opt_section',
            'opt_gang',
            'opt_triplets',
        ];

        // Delete each cookie
        for (const cookieName of cookiesToDelete) {
            cookieStore.delete(cookieName);
        }

        return NextResponse.json({
            success: true,
            message: 'All cookies cleared successfully'
        });
    } catch (error) {
        console.error('Force logout error:', error);
        // Even if there's an error, return success because we want to logout anyway
        return NextResponse.json({
            success: true,
            message: 'Logout completed with warnings'
        });
    }
}
