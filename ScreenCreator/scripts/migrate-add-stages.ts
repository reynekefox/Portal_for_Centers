
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Running migration to add completedStages column...");
    try {
        await db.execute(sql`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS completed_stages JSONB DEFAULT '{"stage1": false, "stage2": false, "stage3": false}'::jsonb;
    `);
        console.log("Migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    }
    process.exit(0);
}

main();
