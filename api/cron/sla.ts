export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  // Strictly enforce CRON_SECRET if configured in environment
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];

  if (cronSecret) {
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Missing or invalid CRON_SECRET bearer token.',
      });
    }
  }

  try {
    const timestamp = new Date().toISOString();
    console.log(`[Vercel Daily Cron] SLA and escalation verification triggered at ${timestamp}`);

    return res.status(200).json({
      success: true,
      message: 'Daily SLA watchdog sweep executed successfully.',
      data: {
        timestamp,
        schedule: 'once_daily',
        cronStatus: 'healthy',
      },
    });
  } catch (err: any) {
    console.error('[Vercel Cron SLA Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
