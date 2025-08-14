import express, { Request, Response } from 'express';
import { CloudRiftService } from '../services/cloudrift';

const router = express.Router();
const cloudRift = new CloudRiftService();

// Get GPU pricing information
router.get('/gpu-pricing', async (req: Request, res: Response) => {
  try {
    const pricing = await cloudRift.getGPUPricing();
    
    res.json({
      success: true,
      pricing: pricing
    });
  } catch (error) {
    console.error('Error fetching GPU pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GPU pricing',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get available GPU types
router.get('/available', async (req: Request, res: Response) => {
  try {
    const availableGPUs = await cloudRift.getAvailableGPUs();
    
    res.json({
      success: true,
      gpus: availableGPUs
    });
  } catch (error) {
    console.error('Error fetching available GPUs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available GPUs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get GPU instance metrics
router.get('/metrics/:instanceId', async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.params;
    const metrics = await cloudRift.getGPUMetrics(instanceId);
    
    res.json({
      success: true,
      metrics: metrics
    });
  } catch (error) {
    console.error('Error fetching GPU metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GPU metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
