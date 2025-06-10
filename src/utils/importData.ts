
import { supabase } from "@/integrations/supabase/client";

interface ImportResult {
  success: boolean;
  message: string;
  details?: any;
}

export const importDataFromLocalStorage = async (): Promise<ImportResult> => {
  try {
    console.log("Starting data import from localStorage...");
    
    // Clear existing data first to avoid conflicts
    console.log("Clearing existing data...");
    const clearPromises = [
      supabase.from('salary_costs').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('costs').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('revenues').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('exchange_rates').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('divisions').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('companies').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('project_types').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('resources').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('currencies').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    ];
    
    await Promise.all(clearPromises);
    console.log("Existing data cleared successfully");

    // Step 1: Import Master Data Tables (no foreign key dependencies)
    console.log("Starting import of master data tables...");
    
    // Import Customers
    const customers = JSON.parse(localStorage.getItem('settings_customers') || '[]');
    if (customers.length > 0) {
      console.log(`Importing ${customers.length} customers...`);
      const { error: customersError } = await supabase
        .from('customers')
        .insert(customers.map((item: any) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          description: item.description || null
        })));
      
      if (customersError) {
        console.error('Error importing customers:', customersError);
        return { success: false, message: 'Failed to import customers', details: customersError };
      }
      console.log(`Successfully imported ${customers.length} customers`);
    }

    // Import Companies
    const companies = JSON.parse(localStorage.getItem('settings_companies') || '[]');
    if (companies.length > 0) {
      console.log(`Importing ${companies.length} companies...`);
      const { error: companiesError } = await supabase
        .from('companies')
        .insert(companies.map((item: any) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          description: item.description || null
        })));
      
      if (companiesError) {
        console.error('Error importing companies:', companiesError);
        return { success: false, message: 'Failed to import companies', details: companiesError };
      }
      console.log(`Successfully imported ${companies.length} companies`);
    }

    // Import Project Types
    const projectTypes = JSON.parse(localStorage.getItem('settings_projectTypes') || '[]');
    if (projectTypes.length > 0) {
      console.log(`Importing ${projectTypes.length} project types...`);
      const { error: projectTypesError } = await supabase
        .from('project_types')
        .insert(projectTypes.map((item: any) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          description: item.description || null
        })));
      
      if (projectTypesError) {
        console.error('Error importing project types:', projectTypesError);
        return { success: false, message: 'Failed to import project types', details: projectTypesError };
      }
      console.log(`Successfully imported ${projectTypes.length} project types`);
    }

    // Import Resources
    const resources = JSON.parse(localStorage.getItem('settings_resources') || '[]');
    if (resources.length > 0) {
      console.log(`Importing ${resources.length} resources...`);
      const { error: resourcesError } = await supabase
        .from('resources')
        .insert(resources.map((item: any) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          description: item.description || null
        })));
      
      if (resourcesError) {
        console.error('Error importing resources:', resourcesError);
        return { success: false, message: 'Failed to import resources', details: resourcesError };
      }
      console.log(`Successfully imported ${resources.length} resources`);
    }

    // Import Currencies
    const currencies = JSON.parse(localStorage.getItem('settings_currencies') || '[]');
    if (currencies.length > 0) {
      console.log(`Importing ${currencies.length} currencies...`);
      const { error: currenciesError } = await supabase
        .from('currencies')
        .insert(currencies.map((item: any) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          description: item.description || null
        })));
      
      if (currenciesError) {
        console.error('Error importing currencies:', currenciesError);
        return { success: false, message: 'Failed to import currencies', details: currenciesError };
      }
      console.log(`Successfully imported ${currencies.length} currencies`);
    }

    // Step 2: Import tables with foreign key dependencies
    console.log("Starting import of dependent tables...");

    // Import Divisions (depends on Companies)
    const divisions = JSON.parse(localStorage.getItem('settings_divisions') || '[]');
    if (divisions.length > 0) {
      console.log(`Importing ${divisions.length} divisions...`);
      const { error: divisionsError } = await supabase
        .from('divisions')
        .insert(divisions.map((item: any) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          description: item.description || null,
          company_id: item.companyID || null
        })));
      
      if (divisionsError) {
        console.error('Error importing divisions:', divisionsError);
        return { success: false, message: 'Failed to import divisions', details: divisionsError };
      }
      console.log(`Successfully imported ${divisions.length} divisions`);
    }

    // Import Projects (depends on Customers)
    const projects = JSON.parse(localStorage.getItem('settings_projects') || '[]');
    if (projects.length > 0) {
      console.log(`Importing ${projects.length} projects...`);
      const { error: projectsError } = await supabase
        .from('projects')
        .insert(projects.map((item: any) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          description: item.description || null,
          customer_id: item.customerID || null
        })));
      
      if (projectsError) {
        console.error('Error importing projects:', projectsError);
        return { success: false, message: 'Failed to import projects', details: projectsError };
      }
      console.log(`Successfully imported ${projects.length} projects`);
    }

    // Import Exchange Rates (depends on Currencies)
    const exchangeRates = JSON.parse(localStorage.getItem('settings_exchangeRates') || '[]');
    if (exchangeRates.length > 0) {
      console.log(`Importing ${exchangeRates.length} exchange rates...`);
      const { error: exchangeRatesError } = await supabase
        .from('exchange_rates')
        .insert(exchangeRates.map((item: any) => ({
          id: item.id,
          year: item.year,
          month: getMonthNumber(item.month),
          currency_id: item.currencyID,
          exchange_rate: item.exchangeRate
        })));
      
      if (exchangeRatesError) {
        console.error('Error importing exchange rates:', exchangeRatesError);
        return { success: false, message: 'Failed to import exchange rates', details: exchangeRatesError };
      }
      console.log(`Successfully imported ${exchangeRates.length} exchange rates`);
    }

    // Step 3: Import transaction data tables
    console.log("Starting import of transaction data...");

    // Import Revenues (depends on multiple master tables)
    const revenues = JSON.parse(localStorage.getItem('revenues') || '[]');
    if (revenues.length > 0) {
      console.log(`Importing ${revenues.length} revenues...`);
      const { error: revenuesError } = await supabase
        .from('revenues')
        .insert(revenues.map((item: any) => ({
          id: item.id,
          year: item.year,
          month: item.month,
          customer_id: item.customerID || null,
          company_id: item.companyID || null,
          division_id: item.divisionID || null,
          project_id: item.projectID || null,
          project_type_id: item.projectTypeID || null,
          resource_id: item.resourceID || null,
          currency_id: item.currencyID || null,
          unit_price: item.unitPrice || null,
          quantity: item.quantity || null,
          original_amount: item.originalAmount || 0,
          vnd_revenue: item.vndRevenue || 0,
          notes: item.notes || null
        })));
      
      if (revenuesError) {
        console.error('Error importing revenues:', revenuesError);
        return { success: false, message: 'Failed to import revenues', details: revenuesError };
      }
      console.log(`Successfully imported ${revenues.length} revenues`);
    }

    // Import Costs (depends on multiple master tables)
    const costs = JSON.parse(localStorage.getItem('costs') || '[]');
    if (costs.length > 0) {
      console.log(`Importing ${costs.length} costs...`);
      const { error: costsError } = await supabase
        .from('costs')
        .insert(costs.map((item: any) => ({
          id: item.id,
          year: item.year,
          month: item.month,
          cost_type: item.category || 'Infrastructure',
          company_id: item.companyID || null,
          division_id: item.divisionID || null,
          project_id: item.projectID || null,
          resource_id: item.resourceID || null,
          cost: item.cost || 0,
          description: item.description || null,
          is_cost: item.isCost !== undefined ? item.isCost : true,
          is_checked: item.checked !== undefined ? item.checked : false,
          notes: item.notes || null
        })));
      
      if (costsError) {
        console.error('Error importing costs:', costsError);
        return { success: false, message: 'Failed to import costs', details: costsError };
      }
      console.log(`Successfully imported ${costs.length} costs`);
    }

    // Import Salary Costs (depends on Companies)
    const salaryCosts = JSON.parse(localStorage.getItem('salaryCosts') || '[]');
    if (salaryCosts.length > 0) {
      console.log(`Importing ${salaryCosts.length} salary costs...`);
      const { error: salaryCostsError } = await supabase
        .from('salary_costs')
        .insert(salaryCosts.map((item: any) => ({
          id: item.id,
          year: item.year,
          month: item.month,
          company_id: item.companyID || null,
          division: item.division || null,
          customer_id: item.customerID || null,
          amount: item.amount || 0,
          notes: item.notes || null
        })));
      
      if (salaryCostsError) {
        console.error('Error importing salary costs:', salaryCostsError);
        return { success: false, message: 'Failed to import salary costs', details: salaryCostsError };
      }
      console.log(`Successfully imported ${salaryCosts.length} salary costs`);
    }

    console.log("Data import completed successfully!");
    return { 
      success: true, 
      message: 'All data imported successfully from localStorage to database!' 
    };

  } catch (error) {
    console.error('Error during data import:', error);
    return { 
      success: false, 
      message: 'Failed to import data', 
      details: error 
    };
  }
};

// Helper function to convert month name to number
const getMonthNumber = (monthName: string): number => {
  const monthMap: { [key: string]: number } = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
    'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
    'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
  };
  return monthMap[monthName] || 1;
};
