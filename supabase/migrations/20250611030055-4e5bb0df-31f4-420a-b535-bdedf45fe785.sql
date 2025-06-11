
-- Update revenues table to ensure proper foreign key references
ALTER TABLE revenues 
ADD CONSTRAINT fk_revenues_customer 
FOREIGN KEY (customer_id) REFERENCES customers(id);

ALTER TABLE revenues 
ADD CONSTRAINT fk_revenues_project 
FOREIGN KEY (project_id) REFERENCES projects(id);

ALTER TABLE revenues 
ADD CONSTRAINT fk_revenues_company 
FOREIGN KEY (company_id) REFERENCES companies(id);

ALTER TABLE revenues 
ADD CONSTRAINT fk_revenues_division 
FOREIGN KEY (division_id) REFERENCES divisions(id);

ALTER TABLE revenues 
ADD CONSTRAINT fk_revenues_project_type 
FOREIGN KEY (project_type_id) REFERENCES project_types(id);

ALTER TABLE revenues 
ADD CONSTRAINT fk_revenues_resource 
FOREIGN KEY (resource_id) REFERENCES resources(id);

ALTER TABLE revenues 
ADD CONSTRAINT fk_revenues_currency 
FOREIGN KEY (currency_id) REFERENCES currencies(id);
