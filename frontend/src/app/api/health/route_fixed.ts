import { NextResponse } from 'next/server';

interface HealthData {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  environment: string;
  backend?: {
    status: string;
    backend_status?: string;
    error?: string;
  };
}

export async function GET() {
  try {
    // Basic health check
    const healthData: HealthData = {
      status: 'healthy',
      service: 'DevIT Frontend',
      version: process.env.npm_package_version || '0.1.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };

    // Try to connect to backend if configured
    if (process.env.NEXT_PUBLIC_API_URL) {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (backendResponse.ok) {
          const backendHealth = await backendResponse.json();
          healthData.backend = {
            status: 'connected',
            backend_status: backendHealth.status,
          };
        } else {
          healthData.backend = {
            status: 'unreachable',
            error: `Backend returned ${backendResponse.status}`,
          };
        }
      } catch (error) {
        healthData.backend = {
          status: 'unreachable',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'DevIT Frontend',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
