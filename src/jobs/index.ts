import { startExpiryCheckJob } from '@/jobs/expiryCheck.job';
import { startStockAlertJob } from '@/jobs/stockAlert.job';

export function startAllJobs(): void {
  startExpiryCheckJob();
  startStockAlertJob();
}
