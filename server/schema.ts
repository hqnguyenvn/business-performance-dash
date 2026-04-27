import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  pgEnum,
  unique,
  index,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// -----------------------------------------------------------------------------
// Enum: app_role  (Supabase: public.app_role)
// -----------------------------------------------------------------------------
export const appRoleEnum = pgEnum("app_role", ["Admin", "Manager", "User"]);

// -----------------------------------------------------------------------------
// Auth event type enum
// -----------------------------------------------------------------------------
export const authEventTypeEnum = pgEnum("auth_event_type", [
  "login_success",
  "login_failed",
  "logout",
  "password_change",
  "password_reset_by_admin",
  "role_change",
  "user_created",
  "user_deleted",
]);

// -----------------------------------------------------------------------------
// Users table — replaces Supabase auth.users
// -----------------------------------------------------------------------------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailConfirmedAt: timestamp("email_confirmed_at", { withTimezone: true }),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// =============================================================================
// MASTER DATA (8 bảng)
// =============================================================================

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const divisions = pgTable("divisions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull(),
  name: varchar("name").notNull(),
  companyId: uuid("company_id").references(() => companies.id),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull(),
  name: varchar("name").notNull(),
  customerId: uuid("customer_id").references(() => customers.id),
  /**
   * Free-text grouping/portfolio code shared by sibling sub-projects.
   * Example: code="GUI_KhoaND" + group_code="GUI". Optional.
   */
  groupCode: varchar("group_code"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const projectTypes = pgTable("project_types", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const resources = pgTable("resources", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const costTypes = pgTable("cost_types", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const currencies = pgTable("currencies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// -----------------------------------------------------------------------------
// Roles (lookup table for employees.role_id — khác với enum app_role)
// -----------------------------------------------------------------------------
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// =============================================================================
// FINANCIAL / OPERATIONAL (8 bảng)
// =============================================================================

export const revenues = pgTable(
  "revenues",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    projectName: varchar("project_name").notNull(),
    originalAmount: numeric("original_amount").notNull(),
    vndRevenue: numeric("vnd_revenue").notNull(),
    quantity: numeric("quantity"),
    unitPrice: numeric("unit_price"),
    notes: text("notes"),
    companyId: uuid("company_id").references(() => companies.id),
    divisionId: uuid("division_id").references(() => divisions.id),
    customerId: uuid("customer_id").references(() => customers.id),
    projectId: uuid("project_id").references(() => projects.id),
    projectTypeId: uuid("project_type_id").references(() => projectTypes.id),
    resourceId: uuid("resource_id").references(() => resources.id),
    currencyId: uuid("currency_id").references(() => currencies.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    yearMonthIdx: index("idx_revenues_year_month").on(t.year, t.month),
    yearMonthCompanyIdx: index("idx_revenues_year_month_company").on(t.year, t.month, t.companyId),
    yearMonthCustomerIdx: index("idx_revenues_year_month_customer").on(t.year, t.month, t.customerId),
    yearMonthDivisionIdx: index("idx_revenues_year_month_division").on(t.year, t.month, t.divisionId),
  }),
);

export const annualPlans = pgTable(
  "annual_plans",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    bmm: numeric("bmm").notNull().default("0"),
    revenue: numeric("revenue").notNull().default("0"),
    currencyId: uuid("currency_id").references(() => currencies.id),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    yearMonthCompanyUq: unique("uq_annual_plans_year_month_company").on(
      t.year,
      t.month,
      t.companyId,
    ),
    yearMonthIdx: index("idx_annual_plans_year_month").on(t.year, t.month),
  }),
);

export const costs = pgTable(
  "costs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    cost: numeric("cost").notNull(),
    costType: uuid("cost_type").references(() => costTypes.id),
    companyId: uuid("company_id").references(() => companies.id),
    divisionId: uuid("division_id").references(() => divisions.id),
    projectId: uuid("project_id").references(() => projects.id),
    resourceId: uuid("resource_id").references(() => resources.id),
    price: numeric("price"),
    volume: numeric("volume"),
    isChecked: boolean("is_checked"),
    isCost: boolean("is_cost"),
    description: text("description"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    yearMonthIdx: index("idx_costs_year_month").on(t.year, t.month),
    yearMonthTypeIdx: index("idx_costs_year_month_type").on(t.year, t.month, t.costType),
    yearMonthCompanyIdx: index("idx_costs_year_month_company").on(t.year, t.month, t.companyId),
    yearMonthDivisionIdx: index("idx_costs_year_month_division").on(t.year, t.month, t.divisionId),
    isCostIdx: index("idx_costs_is_cost").on(t.isCost),
  }),
);

export const salaryCosts = pgTable(
  "salary_costs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    amount: numeric("amount").notNull(),
    companyId: uuid("company_id").references(() => companies.id),
    divisionId: uuid("division_id").references(() => divisions.id, { onDelete: "set null" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    yearMonthIdx: index("idx_salary_costs_year_month").on(t.year, t.month),
    yearMonthCustomerIdx: index("idx_salary_costs_year_month_customer").on(t.year, t.month, t.customerId),
    yearMonthCompanyIdx: index("idx_salary_costs_year_month_company").on(t.year, t.month, t.companyId),
  }),
);

export const bonusByC = pgTable(
  "bonus_by_c",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    year: integer("year").notNull(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    bnBmm: numeric("bn_bmm").notNull().default("0"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    yearIdx: index("idx_bonus_by_c_year").on(t.year),
    companyIdx: index("idx_bonus_by_c_company_id").on(t.companyId),
    yearCompanyIdx: index("idx_bonus_by_c_year_company").on(t.year, t.companyId),
  }),
);

export const bonusByD = pgTable(
  "bonus_by_d",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    year: integer("year").notNull(),
    divisionId: uuid("division_id").notNull().references(() => divisions.id, { onDelete: "cascade" }),
    bnBmm: numeric("bn_bmm").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    yearDivisionIdx: index("idx_bonus_by_d_year_division").on(t.year, t.divisionId),
  }),
);

export const exchangeRates = pgTable("exchange_rates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  currencyId: uuid("currency_id").notNull().references(() => currencies.id),
  exchangeRate: numeric("exchange_rate").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const parameter = pgTable(
  "parameter",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    year: integer("year").notNull(),
    code: varchar("code").notNull(),
    value: numeric("value").notNull(),
    descriptions: text("descriptions"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    yearCodeIdx: index("idx_parameter_year_code").on(t.year, t.code),
  }),
);

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    username: varchar("username").notNull().default(""),
    name: varchar("name").notNull().default(""),
    type: varchar("type").notNull().default(""),
    category: varchar("category").notNull().default(""),
    status: varchar("status").notNull().default("Working"),
    divisionId: uuid("division_id").references(() => divisions.id),
    roleId: uuid("role_id").references(() => roles.id),
    year: integer("year")
      .notNull()
      .default(sql`EXTRACT(YEAR FROM now())::int`),
    month: integer("month")
      .notNull()
      .default(sql`EXTRACT(MONTH FROM now())::int`),
    workingDay: numeric("working_day").notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    yearMonthIdx: index("idx_employees_year_month").on(t.year, t.month),
  }),
);

// =============================================================================
// AUTH (2 bảng) — reference users (new local table) thay vì auth.users
// =============================================================================

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  email: text("email"),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: appRoleEnum("role").notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => ({
    userIdUnique: unique("user_roles_user_id_key").on(t.userId),
  }),
);

// =============================================================================
// AUTH v2 — sessions, events, permissions
// =============================================================================

/**
 * Refresh-token-backed session. Access tokens are short-lived JWTs (not stored).
 *
 * `tokenLookup` = HMAC(JWT_SECRET, refreshToken) hex — indexed, O(1) equality
 * lookup. Non-reversible without the server secret. Replaces the previous
 * O(N) bcrypt-scan pattern that visited every active session on every refresh.
 */
export const userSessions = pgTable(
  "user_sessions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenLookup: text("token_lookup").notNull(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => ({
    tokenLookupIdx: index("idx_user_sessions_token_lookup").on(t.tokenLookup),
    userIdIdx: index("idx_user_sessions_user_id").on(t.userId),
    expiresIdx: index("idx_user_sessions_expires_at").on(t.expiresAt),
  }),
);

/** Audit log for auth-related events. */
export const authEvents = pgTable(
  "auth_events",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    email: text("email"),
    eventType: authEventTypeEnum("event_type").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdIdx: index("idx_auth_events_user_id").on(t.userId),
    createdAtIdx: index("idx_auth_events_created_at").on(t.createdAt),
    eventTypeIdx: index("idx_auth_events_event_type").on(t.eventType),
  }),
);

/** Permission catalog. Seeded at migration time, not edited via UI. */
export const permissions = pgTable("permissions", {
  key: text("key").primaryKey(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Audit log for data mutations (create/update/delete on financial + master data).
 * Auth-related events live in `auth_events`; this table is for CRUD over resources.
 */
export const dataEventTypeEnum = pgEnum("data_event_type", [
  "create",
  "update",
  "delete",
]);

export const dataEvents = pgTable(
  "data_events",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    resource: text("resource").notNull(), // e.g. "costs", "revenues", "users"
    resourceId: text("resource_id"), // PK of the affected row (text to handle uuid or composite)
    action: dataEventTypeEnum("action").notNull(),
    ipAddress: text("ip_address"),
    metadata: jsonb("metadata"), // row snapshot or diff
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    resourceIdx: index("idx_data_events_resource").on(t.resource),
    createdAtIdx: index("idx_data_events_created_at").on(t.createdAt),
    userIdIdx: index("idx_data_events_user_id").on(t.userId),
  }),
);

/** Role → permission mapping. Seeded at migration time. */
export const rolePermissions = pgTable(
  "role_permissions",
  {
    role: appRoleEnum("role").notNull(),
    permissionKey: text("permission_key")
      .notNull()
      .references(() => permissions.key, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.role, t.permissionKey] }),
    roleIdx: index("idx_role_permissions_role").on(t.role),
  }),
);

// =============================================================================
// Type helpers
// =============================================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type Division = typeof divisions.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectType = typeof projectTypes.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type CostType = typeof costTypes.$inferSelect;
export type Currency = typeof currencies.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Revenue = typeof revenues.$inferSelect;
export type AnnualPlan = typeof annualPlans.$inferSelect;
export type NewRevenue = typeof revenues.$inferInsert;
export type Cost = typeof costs.$inferSelect;
export type NewCost = typeof costs.$inferInsert;
export type SalaryCost = typeof salaryCosts.$inferSelect;
export type BonusByC = typeof bonusByC.$inferSelect;
export type BonusByD = typeof bonusByD.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type Parameter = typeof parameter.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
export type AuthEvent = typeof authEvents.$inferSelect;
export type NewAuthEvent = typeof authEvents.$inferInsert;
export type DataEvent = typeof dataEvents.$inferSelect;
export type NewDataEvent = typeof dataEvents.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
