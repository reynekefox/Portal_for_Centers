
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
}

const sql = postgres(process.env.DATABASE_URL);

async function resetDb() {
    console.log("Dropping tables...");
    try {
        await sql`DROP TABLE IF EXISTS chat_logs CASCADE`;
        await sql`DROP TABLE IF EXISTS chat_messages CASCADE`;
        await sql`DROP TABLE IF EXISTS profiles CASCADE`;
        console.log("Tables dropped successfully.");
    } catch (error) {
        console.error("Error dropping tables:", error);
    } finally {
        await sql.end();
    }
}

resetDb();
