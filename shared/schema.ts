import { pgTable, text, serial, integer, boolean, uuid, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const appRoleEnum = pgEnum('app_role', ['Admin', 'Manager', 'User']);

// Core tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  role: appRoleEnum("role").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email"),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Master data tables
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const divisions = pgTable("divisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  companyId: uuid("company_id").references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  customerId: uuid("customer_id").references(() => customers.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectTypes = pgTable("project_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const resources = pgTable("resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const currencies = pgTable("currencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const costTypes = pgTable("cost_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exchange rates
export const exchangeRates = pgTable("exchange_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  currencyId: uuid("currency_id").notNull().references(() => currencies.id),
  exchangeRate: numeric("exchange_rate").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Revenue data
export const revenues = pgTable("revenues", {
  id: uuid("id").primaryKey().defaultRandom(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  customerId: uuid("customer_id").references(() => customers.id),
  companyId: uuid("company_id").references(() => companies.id),
  divisionId: uuid("division_id").references(() => divisions.id),
  projectId: uuid("project_id").references(() => projects.id),
  projectName: text("project_name").default(""),
  projectTypeId: uuid("project_type_id").references(() => projectTypes.id),
  resourceId: uuid("resource_id").references(() => resources.id),
  currencyId: uuid("currency_id").references(() => currencies.id),
  quantity: numeric("quantity"),
  unitPrice: numeric("unit_price"),
  originalAmount: numeric("original_amount").notNull(),
  vndRevenue: numeric("vnd_revenue").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cost data
export const costs = pgTable("costs", {
  id: uuid("id").primaryKey().defaultRandom(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  costType: text("cost_type").notNull(),
  description: text("description"),
  cost: numeric("cost").notNull(),
  price: numeric("price"),
  volume: numeric("volume"),
  isCost: boolean("is_cost").default(true),
  isChecked: boolean("is_checked").default(false),
  companyId: uuid("company_id").references(() => companies.id),
  divisionId: uuid("division_id").references(() => divisions.id),
  projectId: uuid("project_id").references(() => projects.id),
  resourceId: uuid("resource_id").references(() => resources.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Salary costs
export const salaryCosts = pgTable("salary_costs", {
  id: uuid("id").primaryKey().defaultRandom(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  companyId: uuid("company_id").references(() => companies.id),
  divisionId: uuid("division_id").references(() => divisions.id),
  customerId: uuid("customer_id").references(() => customers.id),
  amount: numeric("amount").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bonus tables
export const bonusByD = pgTable("bonus_by_d", {
  id: uuid("id").primaryKey().defaultRandom(),
  year: integer("year").notNull(),
  divisionId: uuid("division_id").notNull().references(() => divisions.id),
  bnBmm: numeric("bn_bmm").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bonusByC = pgTable("bonus_by_c", {
  id: uuid("id").primaryKey().defaultRandom(),
  year: integer("year").notNull(),
  companyId: uuid("company_id").notNull(),
  bnBmm: numeric("bn_bmm").notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Parameters
export const parameter = pgTable("parameter", {
  id: uuid("id").primaryKey().defaultRandom(),
  year: integer("year").notNull(),
  code: text("code").notNull(),
  value: numeric("value").notNull(),
  descriptions: text("descriptions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  divisions: many(divisions),
}));

export const divisionsRelations = relations(divisions, ({ one, many }) => ({
  company: one(companies, {
    fields: [divisions.companyId],
    references: [companies.id],
  }),
  revenues: many(revenues),
  salaryCosts: many(salaryCosts),
  costs: many(costs),
  bonuses: many(bonusByD),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  projects: many(projects),
  revenues: many(revenues),
  salaryCosts: many(salaryCosts),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  customer: one(customers, {
    fields: [projects.customerId],
    references: [customers.id],
  }),
  revenues: many(revenues),
  costs: many(costs),
}));

export const currenciesRelations = relations(currencies, ({ many }) => ({
  exchangeRates: many(exchangeRates),
  revenues: many(revenues),
}));

export const exchangeRatesRelations = relations(exchangeRates, ({ one }) => ({
  currency: one(currencies, {
    fields: [exchangeRates.currencyId],
    references: [currencies.id],
  }),
}));

export const revenuesRelations = relations(revenues, ({ one }) => ({
  customer: one(customers, {
    fields: [revenues.customerId],
    references: [customers.id],
  }),
  company: one(companies, {
    fields: [revenues.companyId],
    references: [companies.id],
  }),
  division: one(divisions, {
    fields: [revenues.divisionId],
    references: [divisions.id],
  }),
  project: one(projects, {
    fields: [revenues.projectId],
    references: [projects.id],
  }),
  projectType: one(projectTypes, {
    fields: [revenues.projectTypeId],
    references: [projectTypes.id],
  }),
  resource: one(resources, {
    fields: [revenues.resourceId],
    references: [resources.id],
  }),
  currency: one(currencies, {
    fields: [revenues.currencyId],
    references: [currencies.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDivisionSchema = createInsertSchema(divisions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectTypeSchema = createInsertSchema(projectTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCurrencySchema = createInsertSchema(currencies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCostTypeSchema = createInsertSchema(costTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRevenueSchema = createInsertSchema(revenues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCostSchema = createInsertSchema(costs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSalaryCostSchema = createInsertSchema(salaryCosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertParameterSchema = createInsertSchema(parameter).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Division = typeof divisions.$inferSelect;
export type InsertDivision = z.infer<typeof insertDivisionSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectType = typeof projectTypes.$inferSelect;
export type InsertProjectType = z.infer<typeof insertProjectTypeSchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type Currency = typeof currencies.$inferSelect;
export type InsertCurrency = z.infer<typeof insertCurrencySchema>;

export type CostType = typeof costTypes.$inferSelect;
export type InsertCostType = z.infer<typeof insertCostTypeSchema>;

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;

export type Revenue = typeof revenues.$inferSelect;
export type InsertRevenue = z.infer<typeof insertRevenueSchema>;

export type Cost = typeof costs.$inferSelect;
export type InsertCost = z.infer<typeof insertCostSchema>;

export type SalaryCost = typeof salaryCosts.$inferSelect;
export type InsertSalaryCost = z.infer<typeof insertSalaryCostSchema>;

export type Parameter = typeof parameter.$inferSelect;
export type InsertParameter = z.infer<typeof insertParameterSchema>;