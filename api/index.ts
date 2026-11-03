import appModule from '../backend/src/app.js';

export default function handler(req: any, res: any) {
  try {
    const expressApp = typeof appModule === 'function' ? appModule : (appModule as any)?.default;
    if (typeof expressApp === 'function') {
      return expressApp(req, res);
    }
    return res.status(500).json({
      success: false,
      message: 'Serverless backend initialization failed: expressApp is not a function',
      appModuleType: typeof appModule,
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
