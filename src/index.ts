import 'dotenv/config';
import express, { Application, Router } from 'express';
import cors from 'cors';
import AWS from 'aws-sdk';
import { Worker } from 'bullmq';
import { table } from './database/tables/table';
import { PgConnector, PGDatabase } from 'drizzle-orm-pg';
import { connect, migrate } from 'drizzle-orm';
import { Pool } from 'pg';
import IORedis, { Redis } from 'ioredis';
import { queue, queueEvent } from './queues';
import { v4 } from 'uuid';
import { eq } from 'drizzle-orm/expressions';

process.on('unhandledRejection', function (reason, p) {
	console.log('Unhandled!');
	console.log(reason);
	p.catch(error => error);
  });

export const schema = {
	table: table,

};

export const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


export const app = express() as Application;

export type DB = PGDatabase<typeof schema>;

export const main = async () => {
	try {
		const connectionString = process.env.DATABASE_URL
		const pool = new Pool({ connectionString });
		const connector = new PgConnector(pool, schema);
		const db = await connect(connector);
		await migrate(connector, { migrationsFolder: './drizzle' });


		// TODO remove test worker
        const worker = new Worker('Queue', async job => {
            // console.log(job.id)
            console.log(job)
            const minutes = job.data.minutes
            await db.table.insert({ id: +job.id!, data: "started", status: "active"}).execute()
            for (let i = 0; i < minutes; i++) {
                await sleep(60* 1000)
                console.log(i)
                await db.table.update().set({data: `${i+1} minutes processed`}).where(eq(table.id, +job.id!)).execute()
            }


            await db.table.update().set({status: 'finished'}).where(eq(table.id, +job.id!)).execute()
            // db.table.insert({ id: +job.id!, data: })
			const response = 'job completed'
			return response
		}, {
			autorun: true, concurrency: 100, connection: new IORedis(process.env.REDIS_URL!)
		});
		
		
		const port = 5002;

        app.post('/putjob/:minutes', async (req, res) => {
            const minutes = req.params.minutes
            const job = await queue.add(`${v4()}`, { minutes })
            // const rsult = await job.waitUntilFinished(queueEvent, 500000);
            return res.status(200).json('ok')
        })
        app.use(express.json());
		app.use(express.urlencoded({ extended: true }));
		app.use(express.text());
		app.use(
			cors({
				origin: '*',
				methods: ['GET', 'PATCH', 'POST', 'DELETE', 'PUT'],
				preflightContinue: false,
				optionsSuccessStatus: 204,
				exposedHeaders: 'X-Total-Count',
			})
		);

		app.listen(port, async () => {
			
			console.log(`App listening on the port ${port}`);
		});

		return app;
	} catch (error) {
		if (error instanceof Error) {
			console.error(error.message);
			process.exit(1);
		}
	}
};

main();
