import {
	pgTable,
	serial,
	varchar
} from 'drizzle-orm-pg';


export const table = pgTable(
	'queues',
    {
        id: serial('id').primaryKey(),
		data: varchar('text'),
		status: varchar('status')
	}
);