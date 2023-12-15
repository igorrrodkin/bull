import { Queue, QueueEvents } from "bullmq";
import IORedis, { Redis } from 'ioredis';


export const queue = new Queue('Queue', { connection: new IORedis(process.env.REDIS_URL!)});


export const queueEvent = new QueueEvents('Queue', { connection: new IORedis(process.env.REDIS_URL!)});
