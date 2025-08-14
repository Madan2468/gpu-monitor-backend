import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  userId: string;
  modelType: string;
  gpuType: string;
  requirements: any;
  status: 'pending' | 'provisioning' | 'running' | 'completed' | 'failed' | 'stopped';
  instanceId?: string;
  filePath?: string;
  fileName?: string;
  logs?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    default: 'default-user'
  },
  modelType: {
    type: String,
    required: true
  },
  gpuType: {
    type: String,
    required: true
  },
  requirements: {
    type: Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'provisioning', 'running', 'completed', 'failed', 'stopped'],
    default: 'pending'
  },
  instanceId: {
    type: String,
    sparse: true
  },
  filePath: {
    type: String
  },
  fileName: {
    type: String
  },
  logs: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for efficient queries
JobSchema.index({ userId: 1, createdAt: -1 });
JobSchema.index({ instanceId: 1 });

export const Job = mongoose.model<IJob>('Job', JobSchema);
