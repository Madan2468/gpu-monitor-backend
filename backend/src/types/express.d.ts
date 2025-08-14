import { Request, Response } from 'express';

declare global {
  namespace Express {
    interface Request {
      file?: any;
    }
  }
}

export interface TypedRequestBody<T> extends Request {
  body: T;
}

export interface TypedResponse<T> extends Response {
  json: (body: T) => TypedResponse<T>;
}

export interface JobSubmitRequest {
  modelType: string;
  gpuType: string;
  requirements: string;
  userId?: string;
}

export interface JobStatusRequest {
  id: string;
}

export interface JobListRequest {
  userId?: string;
}

export interface JobStopRequest {
  id: string;
} 