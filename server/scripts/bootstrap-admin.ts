/**
 * Bootstrap / reset an Admin user from the CLI.
 *
 *   npm run bootstrap:admin -- --email=admin@example.com --password='YourPass123!'
 *
 * Behavior:
 *   - Idempotent. If the email already exists, resets that user's password,
 *     unlocks the account, clears must_change_password, and ensures role=Admin.
 *   - If the email does not exist, creates user + profile + user_role(Admin).
 *
 * This replaces the ad-hoc /api/auth/dev-create-admin endpoint.
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, pool } from "../db";
import { users, profiles, userRoles } from "../schema";
import { hashPassword } from "../auth/password";

function parseArgs(): { email: string; password: string } {
  const args = process.argv.slice(2);
  const out: Record<string, string> = {};
  for (const a of args) {
    const m = a.match(/^--(\w[\w-]*)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  const email = out.email?.trim().toLowerCase();
  const password = out.password;
  if (!email || !password) {
    console.error(
      "Usage: npm run bootstrap:admin -- --email=<email> --password=<pass>",
    );
    process.exit(1);
  }
  if (password.length < 6) {
    console.error("ERROR: password must be at least 6 characters.");
    process.exit(1);
  }
  return { email, password };
}

async function main() {
  const { email, password } = parseArgs();
  console.log(`=== Bootstrap admin: ${email} ===\n`);

  const passwordHash = await hashPassword(password);

  // Check for existing user
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId: string;

  if (existing) {
    console.log("→ User exists. Resetting password and elevating to Admin...");
    await db
      .update(users)
      .set({
        passwordHash,
        mustChangePassword: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
        emailConfirmedAt: existing.emailConfirmedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
    userId = existing.id;
  } else {
    console.log("→ Creating new user...");
    const [created] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        emailConfirmedAt: new Date(),
        mustChangePassword: false,
      })
      .returning();
    userId = created.id;

    await db.insert(profiles).values({
      id: userId,
      email,
      fullName: "Admin",
    });
  }

  // Upsert user_roles → Admin
  const [roleRow] = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, userId))
    .limit(1);

  if (roleRow) {
    await db
      .update(userRoles)
      .set({ role: "Admin", isActive: true })
      .where(eq(userRoles.id, roleRow.id));
  } else {
    await db.insert(userRoles).values({
      userId,
      role: "Admin",
      isActive: true,
    });
  }

  console.log("\n=== Done ===");
  console.log(`Email:    ${email}`);
  console.log(`Role:     Admin`);
  console.log(`User ID:  ${userId}`);
  console.log(
    "You can now log in. must_change_password is false — no forced reset.",
  );

  await pool.end();
}

main().catch((err) => {
  console.error("FATAL:", err);
  pool.end();
  process.exit(1);
});
