import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Redis client using environment variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// GET endpoint - retrieve data from Redis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key') || 'foo';

    const value = await redis.get(key);

    return NextResponse.json({
      success: true,
      key,
      value,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST endpoint - store data in Redis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, ttl } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Key and value are required' },
        { status: 400 }
      );
    }

    // Set with optional TTL (time to live)
    if (ttl) {
      await redis.set(key, value, { ex: ttl });
    } else {
      await redis.set(key, value);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully set ${key}`,
      key,
      value,
      ttl: ttl || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint - remove data from Redis
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Key is required' },
        { status: 400 }
      );
    }

    const result = await redis.del(key);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${key}`,
      key,
      deleted: result > 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}