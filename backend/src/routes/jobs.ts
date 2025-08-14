import express, { Request, Response } from 'express';
import multer from 'multer';
import { Job } from '../models/Job';
import { CloudRiftService } from '../services/cloudrift';
import { JobStatusUpdater } from '../services/jobStatusUpdater';
import { io } from '../index';

// Extend Request interface for multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const router = express.Router();
const upload = multer({ dest: 'uploads/' });
const cloudRift = new CloudRiftService();

// Submit new job
router.post('/submit-job', upload.single('file'), async (req: MulterRequest, res: Response) => {
  try {
    const { modelType, gpuType, requirements } = req.body;
    const file = req.file;

    // Create job record
    const job = new Job({
      userId: req.body.userId || 'default-user',
      modelType,
      gpuType,
      requirements: JSON.parse(requirements || '{}'),
      status: 'pending',
      filePath: file?.path,
      fileName: file?.originalname,
      createdAt: new Date()
    });

    await job.save();

    // Provision GPU instance via CloudRift
    const gpuInstance = await cloudRift.provisionGPU({
      gpuType,
      requirements: job.requirements
    });

    job.instanceId = gpuInstance.id;
    job.status = 'provisioning';
    await job.save();

    // Start job progression simulation
    const jobUpdater = JobStatusUpdater.getInstance();
    jobUpdater.startJobProgression(job._id as string);

    // Emit real-time update
    io.to(`job-${job._id}`).emit('job-update', {
      jobId: job._id,
      status: job.status,
      instanceId: gpuInstance.id
    });

    res.json({
      success: true,
      jobId: job._id,
      instanceId: gpuInstance.id,
      message: 'Job submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit job',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get job status
router.get('/job-status/:id', async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Get real-time status from CloudRift
    let instanceStatus = null;
    if (job.instanceId) {
      instanceStatus = await cloudRift.getInstanceStatus(job.instanceId);
    }

    res.json({
      success: true,
      job: {
        id: job._id,
        status: job.status,
        modelType: job.modelType,
        gpuType: job.gpuType,
        instanceId: job.instanceId,
        createdAt: job.createdAt,
        instanceStatus
      }
    });
  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all jobs for user
router.get('/list', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId || 'default-user';
    const jobs = await Job.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      jobs: jobs.map(job => ({
        id: job._id,
        modelType: job.modelType,
        gpuType: job.gpuType,
        status: job.status,
        instanceId: job.instanceId,
        createdAt: job.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Stop job
router.post('/stop/:id', async (req: Request, res: Response) => {
  try {
    const jobUpdater = JobStatusUpdater.getInstance();
    const success = await jobUpdater.stopJob(req.params.id);

    if (success) {
      res.json({
        success: true,
        message: 'Job stopped successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Job not found or cannot be stopped'
      });
    }
  } catch (error) {
    console.error('Error stopping job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop job',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
