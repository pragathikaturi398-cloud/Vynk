import cron from 'node-cron';
import { AnalyticsService } from '../modules/analytics/analytics.service';

export class InsightsJob {
  static start() {
    console.log('🤖 [Insights Job] Scheduled AI insights daily aggregator at 00:00...');
    // Run daily at midnight
    cron.schedule('0 0 * * *', async () => {
      try {
        console.log('[Insights Job] Generating daily AI recurring issues summary...');
        await AnalyticsService.generateInsights();
      } catch (err) {
        console.error('[Insights Job Error]:', err);
      }
    });
  }
}
