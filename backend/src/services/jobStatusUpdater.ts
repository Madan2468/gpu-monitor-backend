import { Job } from '../models/Job';
import { io } from '../index';

export class JobStatusUpdater {
  private static instance: JobStatusUpdater;
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): JobStatusUpdater {
    if (!JobStatusUpdater.instance) {
      JobStatusUpdater.instance = new JobStatusUpdater();
    }
    return JobStatusUpdater.instance;
  }

  startJobProgression(jobId: string) {
    // Clear existing interval if any
    this.stopJobProgression(jobId);

    let step = 0;
    const interval = setInterval(async () => {
      try {
        const job = await Job.findById(jobId);
        if (!job) {
          this.stopJobProgression(jobId);
          return;
        }

        let newStatus = job.status;
        
        switch (step) {
          case 0: // After 3 seconds: provisioning -> running
            if (job.status === 'provisioning') {
              newStatus = 'running';
              console.log(`🚀 Job ${String(jobId).substring(0, 8)} started running`);
            }
            break;
          case 1: // After 15 seconds: running -> completed (80%) or failed (20%)
            if (job.status === 'running') {
              // 80% chance of success, 20% chance of failure
              newStatus = Math.random() < 0.8 ? 'completed' : 'failed';
              console.log(`✅ Job ${String(jobId).substring(0, 8)} ${newStatus}`);
              this.stopJobProgression(jobId);
            }
            break;
          default:
            this.stopJobProgression(jobId);
            return;
        }

        if (newStatus !== job.status) {
          job.status = newStatus as any;
          await job.save();

          // Emit real-time update to frontend
          io.emit('job-update', {
            jobId: jobId,
            status: newStatus
          });
        }

        step++;
      } catch (error) {
        console.error(`Error updating job ${jobId}:`, error);
        this.stopJobProgression(jobId);
      }
    }, step === 0 ? 3000 : 12000); // 3s for provisioning->running, 12s for running->completed

    this.intervals.set(jobId, interval);
  }

  stopJobProgression(jobId: string) {
    const interval = this.intervals.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(jobId);
    }
  }

  async stopJob(jobId: string) {
    try {
      const job = await Job.findById(jobId);
      if (job && (job.status === 'running' || job.status === 'provisioning')) {
        job.status = 'stopped';
        await job.save();

        // Stop progression
        this.stopJobProgression(jobId);

        // Emit real-time update
        io.emit('job-update', {
          jobId: jobId,
          status: 'stopped'
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error stopping job ${jobId}:`, error);
      return false;
    }
  }

  // Initialize existing jobs on server restart
  async initializeExistingJobs() {
    try {
      const runningJobs = await Job.find({ 
        status: { $in: ['provisioning', 'running'] } 
      });
      
      console.log(`🔄 Resuming ${runningJobs.length} active jobs`);
      
      for (const job of runningJobs) {
        if (job.status === 'provisioning') {
          // Resume progression from provisioning
          this.startJobProgression(job._id as string);
        } else if (job.status === 'running') {
          // Running jobs will complete soon
          setTimeout(() => {
            this.startJobProgression(job._id as string);
          }, Math.random() * 5000); // Random delay 0-5 seconds
        }
      }
    } catch (error) {
      console.error('Error initializing existing jobs:', error);
    }
  }
}
