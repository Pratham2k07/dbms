import app from './app.js';

export default function handler(req: any, res: any) {
  try {
    // Quick ping check
    if (req.url === '/api/ping' || req.url === '/ping') {
      return res.status(200).json({
        ok: true,
        service: 'JKLU Shuttle Transit API',
        timestamp: new Date().toISOString(),
      });
    }

    const expressApp = typeof app === 'function' ? app : (app as any)?.default;
    if (typeof expressApp === 'function') {
      return expressApp(req, res);
    }
    return res.status(500).json({
      success: false,
      message: 'Serverless backend initialization failed: expressApp is not a function',
      appModuleType: typeof app,
    });
  } catch (err: any) {
    console.error('[Vercel Serverless Invocation Error]', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Serverless invocation failed',
      stack: err?.stack,
    });
  }
}

