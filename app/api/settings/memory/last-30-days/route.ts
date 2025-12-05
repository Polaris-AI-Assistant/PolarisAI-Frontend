import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE /api/settings/memory/last-30-days
 * Delete user memories from the last 30 days
 */
export async function DELETE(request: NextRequest) {
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
    const response = await fetch(`${API_BASE_URL}/api/settings/memory/last-30-days`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting last 30 days of memories:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to delete memories' },
      { status: 500 }
    );
  }
}
