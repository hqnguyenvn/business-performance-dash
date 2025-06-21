import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { 
  companies, customers, divisions, projects, projectTypes, 
  resources, currencies, costTypes, exchangeRates, revenues, 
  costs, salaryCosts, parameter, bonusByD, bonusByC,
  insertCompanySchema, insertCustomerSchema, insertDivisionSchema,
  insertProjectSchema, insertProjectTypeSchema, insertResourceSchema,
  insertCurrencySchema, insertCostTypeSchema, insertExchangeRateSchema,
  insertRevenueSchema, insertCostSchema, insertSalaryCostSchema,
  insertParameterSchema
} from "../shared/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Master data routes
  app.get('/api/companies', async (req, res) => {
    try {
      const data = await db.select().from(companies).orderBy(companies.code);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch companies' });
    }
  });

  app.post('/api/companies', async (req, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      const [company] = await db.insert(companies).values(validatedData).returning();
      res.json(company);
    } catch (error) {
      res.status(400).json({ error: 'Invalid company data' });
    }
  });

  app.put('/api/companies/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCompanySchema.partial().parse(req.body);
      const [company] = await db.update(companies)
        .set(validatedData)
        .where(eq(companies.id, id))
        .returning();
      res.json(company);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update company' });
    }
  });

  app.delete('/api/companies/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(companies).where(eq(companies.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Failed to delete company' });
    }
  });

  // Customers
  app.get('/api/customers', async (req, res) => {
    try {
      const data = await db.select().from(customers).orderBy(customers.code);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });

  app.post('/api/customers', async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const [customer] = await db.insert(customers).values(validatedData).returning();
      res.json(customer);
    } catch (error) {
      res.status(400).json({ error: 'Invalid customer data' });
    }
  });

  app.put('/api/customers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const [customer] = await db.update(customers)
        .set(validatedData)
        .where(eq(customers.id, id))
        .returning();
      res.json(customer);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update customer' });
    }
  });

  app.delete('/api/customers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(customers).where(eq(customers.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Failed to delete customer' });
    }
  });

  // Divisions
  app.get('/api/divisions', async (req, res) => {
    try {
      const data = await db.select().from(divisions).orderBy(divisions.code);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch divisions' });
    }
  });

  app.post('/api/divisions', async (req, res) => {
    try {
      const validatedData = insertDivisionSchema.parse(req.body);
      const [division] = await db.insert(divisions).values(validatedData).returning();
      res.json(division);
    } catch (error) {
      res.status(400).json({ error: 'Invalid division data' });
    }
  });

  // Projects
  app.get('/api/projects', async (req, res) => {
    try {
      const data = await db.select().from(projects).orderBy(projects.code);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  app.post('/api/projects', async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const [project] = await db.insert(projects).values(validatedData).returning();
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: 'Invalid project data' });
    }
  });

  // Project Types
  app.get('/api/project-types', async (req, res) => {
    try {
      const data = await db.select().from(projectTypes).orderBy(projectTypes.code);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch project types' });
    }
  });

  app.post('/api/project-types', async (req, res) => {
    try {
      const validatedData = insertProjectTypeSchema.parse(req.body);
      const [projectType] = await db.insert(projectTypes).values(validatedData).returning();
      res.json(projectType);
    } catch (error) {
      res.status(400).json({ error: 'Invalid project type data' });
    }
  });

  // Resources
  app.get('/api/resources', async (req, res) => {
    try {
      const data = await db.select().from(resources).orderBy(resources.code);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch resources' });
    }
  });

  app.post('/api/resources', async (req, res) => {
    try {
      const validatedData = insertResourceSchema.parse(req.body);
      const [resource] = await db.insert(resources).values(validatedData).returning();
      res.json(resource);
    } catch (error) {
      res.status(400).json({ error: 'Invalid resource data' });
    }
  });

  // Currencies
  app.get('/api/currencies', async (req, res) => {
    try {
      const data = await db.select().from(currencies).orderBy(currencies.code);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch currencies' });
    }
  });

  app.post('/api/currencies', async (req, res) => {
    try {
      const validatedData = insertCurrencySchema.parse(req.body);
      const [currency] = await db.insert(currencies).values(validatedData).returning();
      res.json(currency);
    } catch (error) {
      res.status(400).json({ error: 'Invalid currency data' });
    }
  });

  // Cost Types
  app.get('/api/cost-types', async (req, res) => {
    try {
      const data = await db.select().from(costTypes).orderBy(costTypes.code);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch cost types' });
    }
  });

  app.post('/api/cost-types', async (req, res) => {
    try {
      const validatedData = insertCostTypeSchema.parse(req.body);
      const [costType] = await db.insert(costTypes).values(validatedData).returning();
      res.json(costType);
    } catch (error) {
      res.status(400).json({ error: 'Invalid cost type data' });
    }
  });

  // Exchange Rates
  app.get('/api/exchange-rates', async (req, res) => {
    try {
      const data = await db.select().from(exchangeRates)
        .orderBy(desc(exchangeRates.year), desc(exchangeRates.month));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch exchange rates' });
    }
  });

  app.post('/api/exchange-rates', async (req, res) => {
    try {
      const validatedData = insertExchangeRateSchema.parse(req.body);
      const [exchangeRate] = await db.insert(exchangeRates).values(validatedData).returning();
      res.json(exchangeRate);
    } catch (error) {
      res.status(400).json({ error: 'Invalid exchange rate data' });
    }
  });

  // Revenues
  app.get('/api/revenues', async (req, res) => {
    try {
      const { page = 1, pageSize = 50, year, months } = req.query;
      let query = db.select().from(revenues);
      
      const filters = [];
      if (year) filters.push(eq(revenues.year, parseInt(year as string)));
      if (months) {
        const monthArray = (months as string).split(',').map(m => parseInt(m));
        filters.push(inArray(revenues.month, monthArray));
      }
      
      if (filters.length > 0) {
        query = query.where(and(...filters));
      }
      
      const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
      const data = await query
        .orderBy(desc(revenues.year), desc(revenues.month))
        .limit(parseInt(pageSize as string))
        .offset(offset);
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch revenues' });
    }
  });

  app.post('/api/revenues', async (req, res) => {
    try {
      const validatedData = insertRevenueSchema.parse(req.body);
      const [revenue] = await db.insert(revenues).values(validatedData).returning();
      res.json(revenue);
    } catch (error) {
      res.status(400).json({ error: 'Invalid revenue data' });
    }
  });

  app.put('/api/revenues/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertRevenueSchema.partial().parse(req.body);
      const [revenue] = await db.update(revenues)
        .set(validatedData)
        .where(eq(revenues.id, id))
        .returning();
      res.json(revenue);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update revenue' });
    }
  });

  app.delete('/api/revenues/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(revenues).where(eq(revenues.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Failed to delete revenue' });
    }
  });

  // Costs
  app.get('/api/costs', async (req, res) => {
    try {
      const { year, months } = req.query;
      let query = db.select().from(costs);
      
      const filters = [];
      if (year) filters.push(eq(costs.year, parseInt(year as string)));
      if (months) {
        const monthArray = (months as string).split(',').map(m => parseInt(m));
        filters.push(inArray(costs.month, monthArray));
      }
      
      if (filters.length > 0) {
        query = query.where(and(...filters));
      }
      
      const data = await query.orderBy(desc(costs.year), desc(costs.month));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch costs' });
    }
  });

  app.post('/api/costs', async (req, res) => {
    try {
      const validatedData = insertCostSchema.parse(req.body);
      const [cost] = await db.insert(costs).values(validatedData).returning();
      res.json(cost);
    } catch (error) {
      res.status(400).json({ error: 'Invalid cost data' });
    }
  });

  // Salary Costs
  app.get('/api/salary-costs', async (req, res) => {
    try {
      const { year, months } = req.query;
      let query = db.select().from(salaryCosts);
      
      const filters = [];
      if (year) filters.push(eq(salaryCosts.year, parseInt(year as string)));
      if (months) {
        const monthArray = (months as string).split(',').map(m => parseInt(m));
        filters.push(inArray(salaryCosts.month, monthArray));
      }
      
      if (filters.length > 0) {
        query = query.where(and(...filters));
      }
      
      const data = await query.orderBy(desc(salaryCosts.year), desc(salaryCosts.month));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch salary costs' });
    }
  });

  app.post('/api/salary-costs', async (req, res) => {
    try {
      const validatedData = insertSalaryCostSchema.parse(req.body);
      const [salaryCost] = await db.insert(salaryCosts).values(validatedData).returning();
      res.json(salaryCost);
    } catch (error) {
      res.status(400).json({ error: 'Invalid salary cost data' });
    }
  });

  // Parameters
  app.get('/api/parameters', async (req, res) => {
    try {
      const { year } = req.query;
      let query = db.select().from(parameter);
      
      if (year) {
        query = query.where(eq(parameter.year, parseInt(year as string)));
      }
      
      const data = await query.orderBy(desc(parameter.year), parameter.code);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch parameters' });
    }
  });

  app.post('/api/parameters', async (req, res) => {
    try {
      const validatedData = insertParameterSchema.parse(req.body);
      const [param] = await db.insert(parameter).values(validatedData).returning();
      res.json(param);
    } catch (error) {
      res.status(400).json({ error: 'Invalid parameter data' });
    }
  });

  // Bonus data
  app.get('/api/bonus-by-division', async (req, res) => {
    try {
      const { year } = req.query;
      let query = db.select().from(bonusByD);
      
      if (year) {
        query = query.where(eq(bonusByD.year, parseInt(year as string)));
      }
      
      const data = await query.orderBy(desc(bonusByD.year));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch division bonuses' });
    }
  });

  app.get('/api/bonus-by-company', async (req, res) => {
    try {
      const { year } = req.query;
      let query = db.select().from(bonusByC);
      
      if (year) {
        query = query.where(eq(bonusByC.year, parseInt(year as string)));
      }
      
      const data = await query.orderBy(desc(bonusByC.year));
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch company bonuses' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}