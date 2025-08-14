import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  CloudUpload,
  Dashboard,
  Memory,
  Speed
} from '@mui/icons-material';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

interface Job {
  id: string;
  modelType: string;
  gpuType: string;
  status: string;
  instanceId?: string;
  createdAt: string;
}

interface GPUPricing {
  type: string;
  pricePerHour: number;
  memory: string;
  compute: string;
}

function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [gpuPricing, setGpuPricing] = useState<GPUPricing[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newJob, setNewJob] = useState({
    modelType: '',
    gpuType: '',
    file: null as File | null
  });

  const API_BASE = 'http://localhost:5001/api';

  const loadJobs = async () => {
    try {
      const response = await axios.get(`${API_BASE}/jobs/list`);
      if (response.data.success) {
        setJobs(response.data.jobs);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const loadGPUPricing = async () => {
    try {
      const response = await axios.get(`${API_BASE}/gpu/gpu-pricing`);
      if (response.data.success) {
        setGpuPricing(response.data.pricing);
      }
    } catch (error) {
      console.error('Error loading GPU pricing:', error);
    }
  };

  useEffect(() => {
    // Initialize socket connection
    const socket = io('http://localhost:5001');
    
    // Listen for job updates
    socket.on('job-update', (update) => {
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === update.jobId 
            ? { ...job, status: update.status }
            : job
        )
      );
    });

    // Load initial data
    loadJobs();
    loadGPUPricing();

    return () => {
      socket.close();
    };
  }, []);

  const submitJob = async () => {
    if (!newJob.modelType || !newJob.gpuType) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('modelType', newJob.modelType);
    formData.append('gpuType', newJob.gpuType);
    formData.append('requirements', JSON.stringify({}));
    if (newJob.file) {
      formData.append('file', newJob.file);
    }

    try {
      const response = await axios.post(`${API_BASE}/jobs/submit-job`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setOpenDialog(false);
        setNewJob({ modelType: '', gpuType: '', file: null });
        loadJobs(); // Refresh the jobs list
        alert(`Job submitted successfully! Job ID: ${response.data.jobId}`);
      } else {
        alert(`Failed to submit job: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error submitting job:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Network error';
      alert(`Error submitting job: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const stopJob = async (jobId: string) => {
    try {
      const response = await axios.post(`${API_BASE}/jobs/stop/${jobId}`);
      if (response.data.success) {
        loadJobs();
        alert('Job stopped successfully');
      }
    } catch (error) {
      console.error('Error stopping job:', error);
      alert('Error stopping job');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'success';
      case 'pending': return 'warning';
      case 'provisioning': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'stopped': return 'default';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Dashboard sx={{ fontSize: 40, mr: 2, color: '#1976d2' }} />
        <Typography variant="h3" component="h1" gutterBottom>
          GPU Job Monitoring Dashboard
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Memory sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
              <Box>
                <Typography variant="h4">{jobs.length}</Typography>
                <Typography color="textSecondary">Total Jobs</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PlayArrow sx={{ fontSize: 40, color: '#4caf50', mr: 2 }} />
              <Box>
                <Typography variant="h4">
                  {jobs.filter(j => j.status === 'running').length}
                </Typography>
                <Typography color="textSecondary">Running</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Speed sx={{ fontSize: 40, color: '#ff9800', mr: 2 }} />
              <Box>
                <Typography variant="h4">
                  {jobs.filter(j => j.status === 'pending').length}
                </Typography>
                <Typography color="textSecondary">Pending</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CloudUpload sx={{ fontSize: 40, color: '#9c27b0', mr: 2 }} />
              <Box>
                <Typography variant="h4">{gpuPricing.length}</Typography>
                <Typography color="textSecondary">GPU Types</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayArrow />}
          onClick={() => setOpenDialog(true)}
          sx={{ mr: 2 }}
        >
          Submit New Job
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={loadJobs}
        >
          Refresh Jobs
        </Button>
      </Box>

      {/* Jobs Table */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h5" gutterBottom>
            Active Jobs
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Job ID</TableCell>
                <TableCell>Model Type</TableCell>
                <TableCell>GPU Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>{job.id.substring(0, 8)}...</TableCell>
                  <TableCell>{job.modelType}</TableCell>
                  <TableCell>{job.gpuType}</TableCell>
                  <TableCell>
                    <Chip
                      label={job.status}
                      color={getStatusColor(job.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(job.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {job.status === 'running' && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Stop />}
                        onClick={() => stopJob(job.id)}
                      >
                        Stop
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {jobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No jobs found. Submit your first job to get started!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* GPU Pricing */}
      <Paper>
        <Box sx={{ p: 2 }}>
          <Typography variant="h5" gutterBottom>
            GPU Pricing
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>GPU Type</TableCell>
                <TableCell>Price/Hour</TableCell>
                <TableCell>Memory</TableCell>
                <TableCell>Compute Power</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gpuPricing.map((gpu) => (
                <TableRow key={gpu.type}>
                  <TableCell>{gpu.type}</TableCell>
                  <TableCell>${gpu.pricePerHour.toFixed(2)}</TableCell>
                  <TableCell>{gpu.memory}</TableCell>
                  <TableCell>{gpu.compute}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Submit Job Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit New GPU Job</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Model Type"
              value={newJob.modelType}
              onChange={(e) => setNewJob({...newJob, modelType: e.target.value})}
              sx={{ mb: 2 }}
              placeholder="e.g., BERT, GPT-3, ResNet"
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>GPU Type</InputLabel>
              <Select
                value={newJob.gpuType}
                onChange={(e) => setNewJob({...newJob, gpuType: e.target.value})}
              >
                {gpuPricing.map((gpu) => (
                  <MenuItem key={gpu.type} value={gpu.type}>
                    {gpu.type} - ${gpu.pricePerHour}/hr ({gpu.memory})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ mb: 2 }}>
              <input
                type="file"
                onChange={(e) => setNewJob({...newJob, file: e.target.files?.[0] || null})}
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc' }}
              />
              <Typography variant="caption" color="textSecondary">
                Optional: Upload model file or dataset
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={submitJob} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Submit Job'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default App;
