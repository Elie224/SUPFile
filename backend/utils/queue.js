// Système de queue simple pour les tâches lourdes
// Pour la production, utiliser Bull ou RabbitMQ

const EventEmitter = require('events');
const logger = require('./logger');

class SimpleQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.queue = [];
    this.processing = false;
    this.concurrency = options.concurrency || 1;
    this.activeJobs = 0;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  /**
   * Ajouter une tâche à la queue
   */
  async add(job, options = {}) {
    const jobData = {
      id: options.id || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: job,
      attempts: 0,
      maxRetries: options.maxRetries || this.maxRetries,
      priority: options.priority || 0,
      createdAt: new Date(),
    };

    // Insérer selon la priorité
    if (jobData.priority > 0) {
      const index = this.queue.findIndex(j => j.priority < jobData.priority);
      if (index === -1) {
        this.queue.push(jobData);
      } else {
        this.queue.splice(index, 0, jobData);
      }
    } else {
      this.queue.push(jobData);
    }

    logger.logDebug(`Job added to queue: ${jobData.id}`, { queueLength: this.queue.length });
    this.emit('added', jobData);

    // Démarrer le traitement si pas déjà en cours
    if (!this.processing) {
      this.process();
    }

    return jobData.id;
  }

  /**
   * Traiter la queue
   */
  async process() {
    if (this.processing || this.activeJobs >= this.concurrency) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.activeJobs < this.concurrency) {
      const job = this.queue.shift();
      if (!job) break;

      this.activeJobs++;
      this.executeJob(job);
    }

    this.processing = false;
  }

  /**
   * Exécuter une tâche
   */
  async executeJob(job) {
    try {
      logger.logDebug(`Executing job: ${job.id}`, { attempts: job.attempts + 1 });
      this.emit('started', job);

      // Exécuter la tâche
      const result = await job.data();

      logger.logInfo(`Job completed: ${job.id}`);
      this.emit('completed', { job, result });

      this.activeJobs--;
      
      // Continuer le traitement
      if (this.queue.length > 0) {
        this.process();
      }
    } catch (error) {
      job.attempts++;
      logger.logError(error, { context: 'queue job', jobId: job.id, attempts: job.attempts });

      if (job.attempts < job.maxRetries) {
        // Réessayer après un délai
        logger.logWarn(`Retrying job: ${job.id}`, { attempts: job.attempts, maxRetries: job.maxRetries });
        setTimeout(() => {
          this.queue.unshift(job); // Remettre en début de queue
          this.activeJobs--;
          this.process();
        }, this.retryDelay * job.attempts); // Délai exponentiel
      } else {
        // Échec définitif
        logger.logError(new Error(`Job failed after ${job.attempts} attempts: ${job.id}`), {
          context: 'queue job failure',
          jobId: job.id,
        });
        this.emit('failed', { job, error });
        this.activeJobs--;
        
        // Continuer le traitement
        if (this.queue.length > 0) {
          this.process();
        }
      }
    }
  }

  /**
   * Obtenir les statistiques de la queue
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      activeJobs: this.activeJobs,
      processing: this.processing,
      concurrency: this.concurrency,
    };
  }

  /**
   * Vider la queue
   */
  clear() {
    this.queue = [];
    logger.logInfo('Queue cleared');
  }
}

// Instance globale de queue
const defaultQueue = new SimpleQueue({
  concurrency: 2, // Traiter 2 tâches en parallèle
  maxRetries: 3,
  retryDelay: 1000,
});

module.exports = {
  SimpleQueue,
  defaultQueue,
};

