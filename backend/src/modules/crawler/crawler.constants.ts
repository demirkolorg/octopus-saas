export const CRAWL_QUEUE = 'crawl-queue';

export const CRAWL_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000,
  },
  removeOnComplete: {
    age: 3600, // Keep completed jobs for 1 hour
    count: 100, // Keep last 100 completed jobs
  },
  removeOnFail: {
    age: 86400, // Keep failed jobs for 24 hours
  },
};
