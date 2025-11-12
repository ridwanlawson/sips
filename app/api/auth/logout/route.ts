import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const response = await fetch('http://dev.skj.my.id:82/api/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Logout failed' },
        { status: response.status }
      );
    }

    // Remove the cookie
    (await cookies()).delete('auth_token');
    (await cookies()).delete('log_id');
    (await cookies()).delete('user_Afdeling');
    (await cookies()).delete('user_Fcba');
    (await cookies()).delete('user_FullName');
    (await cookies()).delete('user_Gang');
    (await cookies()).delete('user_Kode');
    (await cookies()).delete('user_Level');
    (await cookies()).delete('user_Photo');
    (await cookies()).delete('user_Position');
    (await cookies()).delete('opt_fcba');
    (await cookies()).delete('opt_section');
    (await cookies()).delete('opt_gang');
    (await cookies()).delete('opt_triplets');

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
