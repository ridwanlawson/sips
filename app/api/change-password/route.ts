import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { current_password, new_password } = await request.json();
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
        }

        const upstream = await fetch('http://dev.skj.my.id:82/api/change-password', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                current_password,
                new_password,
            }),
        });

        const data = await upstream.json();

        if (!upstream.ok) {
            return NextResponse.json({ ok: false, message: data?.message || 'Failed to change password' }, { status: upstream.status });
        }

        return NextResponse.json({ ok: true, message: data?.message || 'Password changed successfully' });
    } catch (error) {
        console.error('[CHANGE_PASSWORD]', error);
        return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
    }
}
