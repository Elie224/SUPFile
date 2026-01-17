// Tests unitaires pour le système de queue

const { SimpleQueue } = require('../utils/queue');

describe('SimpleQueue', () => {
  let queue;

  beforeEach(() => {
    queue = new SimpleQueue({ concurrency: 2 });
  });

  afterEach(() => {
    queue.clear();
  });

  it('should add jobs to the queue', async () => {
    const job = async () => 'test';
    const jobId = await queue.add(job);
    
    expect(jobId).toBeDefined();
    expect(queue.getStats().queueLength).toBeGreaterThan(0);
  });

  it('should process jobs', async () => {
    const results = [];
    const job = async () => {
      results.push('completed');
      return 'done';
    };

    await queue.add(job);
    
    // Attendre que le job soit traité
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(results.length).toBe(1);
  });

  it('should retry failed jobs', async () => {
    let attempts = 0;
    const job = async () => {
      attempts++;
      if (attempts < 2) {
        throw new Error('Test error');
      }
      return 'success';
    };

    await queue.add(job, { maxRetries: 3 });
    
    // Attendre que le job soit traité avec retry
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    expect(attempts).toBeGreaterThan(1);
  });

  it('should respect concurrency limit', async () => {
    const activeJobs = [];
    const job = async () => {
      activeJobs.push(1);
      await new Promise(resolve => setTimeout(resolve, 100));
      activeJobs.pop();
    };

    // Ajouter plus de jobs que la limite de concurrence
    for (let i = 0; i < 5; i++) {
      await queue.add(job);
    }

    // Vérifier que le nombre de jobs actifs ne dépasse pas la limite
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(activeJobs.length).toBeLessThanOrEqual(queue.concurrency);
  });
});


