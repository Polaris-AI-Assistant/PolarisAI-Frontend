import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/settings/memory
 * Fetch user's memory settings
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/api/settings/memory`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching memory settings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch memory settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/memory
 * Update user's memory settings
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const body = await request.json();
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/api/settings/memory`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating memory settings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update memory settings' },
      { status: 500 }
    );
  }
}
