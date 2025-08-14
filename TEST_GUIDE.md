# GPU Job Monitoring Dashboard - Testing Guide

## Overview
This guide will walk you through testing the complete job submission functionality of the GPU Job Monitoring Dashboard. The application demonstrates automated GPU job lifecycle management with real-time updates.

## Prerequisites
- Node.js (v16+)
- MongoDB running locally
- Two terminal windows

## Quick Start Testing

### 1. Start the Backend Server
```bash
cd "/Users/madan/Desktop/CLOUDRIFT ai/backend"
npm run dev
```

**Expected Output:**
```
Server running on port 5001
MongoDB connected successfully
🔄 Job status updater initialized
```

### 2. Start the Frontend (New Terminal)
```bash
cd "/Users/madan/Desktop/CLOUDRIFT ai/frontend"
npm start
```

The application will open at `http://localhost:3000`

## Testing Job Submission - Step by Step

### Test 1: Basic Job Submission

1. **Open the Dashboard**
   - Navigate to `http://localhost:3000`
   - You should see the GPU Job Monitoring Dashboard

2. **Check Initial State**
   - Stats cards show: 0 Total Jobs, 0 Running, 0 Pending, 3 GPU Types
   - Jobs table shows "No jobs found" message
   - GPU Pricing table displays 3 GPU types (RTX 4090, A100, H100)

3. **Submit Your First Job**
   - Click **"Submit New Job"** button
   - Fill in the form:
     - **Model Type**: `BERT-Large`
     - **GPU Type**: Select `RTX 4090 - $0.5/hr (24GB)`
     - **File Upload**: (Optional) Upload any file
   - Click **"Submit Job"**

4. **Observe Real-time Updates** (This happens automatically)
   - Job immediately appears with status `pending`
   - After 3 seconds: Status changes to `provisioning` → `running`
   - After 15 seconds: Status changes to `completed` (80% chance) or `failed` (20% chance)
   - Stats cards update automatically
   - No page refresh needed!

### Test 2: Multiple Job Submission

1. **Submit Multiple Jobs Quickly**
   - Submit 3-4 jobs with different configurations:
     - Job 1: `GPT-3`, `A100`
     - Job 2: `ResNet-50`, `H100`  
     - Job 3: `DALL-E`, `RTX 4090`

2. **Watch Concurrent Processing**
   - All jobs progress through statuses independently
   - Running counter updates in real-time
   - Each job has its own progression timeline

### Test 3: Job Management

1. **Stop a Running Job**
   - Wait for a job to reach `running` status
   - Click the **"Stop"** button next to the job
   - Job status immediately changes to `stopped`

2. **Refresh Jobs List**
   - Click **"Refresh Jobs"** button
   - Verify all jobs are still displayed correctly

## API Testing (Optional)

Test the backend APIs directly using curl:

### 1. Check Server Health
```bash
curl http://localhost:5001/api/health
```
**Expected:** `{"status":"OK","timestamp":"..."}`

### 2. Get GPU Pricing
```bash
curl http://localhost:5001/api/gpu/gpu-pricing
```

### 3. Submit Job via API
```bash
curl -X POST http://localhost:5001/api/jobs/submit-job \
  -F "modelType=Test-Model" \
  -F "gpuType=RTX 4090" \
  -F "requirements={}"
```

### 4. List All Jobs
```bash
curl http://localhost:5001/api/jobs/list
```

## Real-time Features Testing

### WebSocket Connection Test
1. Open browser developer tools (F12)
2. Go to Network tab, filter by WebSocket
3. You should see an active Socket.IO connection to `localhost:5001`
4. Submit a job and watch real-time messages in the WebSocket

### Auto-refresh Test
1. Keep the dashboard open
2. Submit a job from another browser tab or via API
3. The first tab should automatically show the new job without refresh

## Expected Job Lifecycle

```
Submit Job → pending (immediate)
           ↓
         provisioning (immediate)
           ↓ (3 seconds)
         running
           ↓ (15 seconds)
    completed (80%) OR failed (20%)
```

## Database Verification

Connect to MongoDB to verify data persistence:

```bash
mongosh
use gpu_dashboard
db.jobs.find().pretty()
```

## Troubleshooting

### Common Issues

1. **"Cannot connect to MongoDB"**
   - Ensure MongoDB is running: `brew services start mongodb-community`

2. **Port 5001 already in use**
   - Kill existing process: `lsof -ti:5001 | xargs kill -9`

3. **Frontend can't connect to backend**
   - Check backend is running on port 5001
   - Verify CORS is enabled

4. **Jobs not updating in real-time**
   - Check WebSocket connection in browser dev tools
   - Restart both frontend and backend

### Debug Mode

Enable debug logging by adding to backend `.env`:
```
NODE_ENV=development
```

## Success Criteria

✅ **Job Submission Works**: Jobs can be created through the UI
✅ **Real-time Updates**: Job statuses update without page refresh  
✅ **Job Progression**: Jobs automatically progress through lifecycle
✅ **Data Persistence**: Jobs are saved to MongoDB
✅ **Job Management**: Running jobs can be stopped
✅ **WebSocket Communication**: Real-time updates work via Socket.IO
✅ **API Functionality**: All REST endpoints respond correctly

## Performance Testing

### Load Testing
Submit 10 jobs rapidly and verify:
- All jobs are created successfully
- Real-time updates work for all jobs
- No memory leaks or crashes
- Database handles concurrent writes

### Browser Testing
Test in multiple browsers:
- Chrome, Firefox, Safari
- Multiple tabs with same dashboard open
- Real-time sync between tabs

## Next Steps

After successful testing, you can:
1. Deploy to production environment
2. Add user authentication
3. Implement real CloudRift integration
4. Add job logs and detailed metrics
5. Create automated test suite

---

**Note**: This application uses simulated job progression for demonstration. In production, it would integrate with actual CloudRift APIs for real GPU provisioning and job execution.
