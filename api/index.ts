import appModule from '../backend/src/app.js';

export default function handler(req: any, res: any) {
  const expressApp = typeof appModule === 'function' ? appModule : (appModule as any)?.default;
  if (typeof expressApp === 'function') {
    return expressApp(req, res);
  }
  return res.status(500).json({ success: false, message: 'Serverless backend initialization failed' });
}
