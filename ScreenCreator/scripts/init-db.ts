
import postgres from "postgres";

const sql = postgres("postgresql://postgres:postgre@localhost:5432/postgres");

async function init() {
  try {
    await sql`CREATE DATABASE neurotrainer`;
    console.log("Database 'neurotrainer' created successfully.");
  } catch (error) {
      // 42P04: database already exists
      if (error instanceof Error && (error as any).code === '42P04') {
          console.log("Database 'neurotrainer' already exists.");
      } else {
        console.error("Error creating database:", error);
        process.exit(1);
      }
  }
  await sql.end();
}

init();
