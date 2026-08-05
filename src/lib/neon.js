import { neon } from '@neondatabase/serverless';

const dbUrl = import.meta.env.VITE_NEON_DATABASE_URL;

if (!dbUrl) {
  console.error("Missing VITE_NEON_DATABASE_URL environment variable!");
}

const sql = neon(dbUrl || 'postgresql://placeholder:placeholder@localhost/db');

export default sql;
