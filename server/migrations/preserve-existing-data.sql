-- Migration script to preserve existing data when converting to localized JSON format
-- This script will run BEFORE the schema migration to preserve existing text data

-- Create temporary backup tables
CREATE TABLE companies_backup AS SELECT * FROM companies;
CREATE TABLE departments_backup AS SELECT * FROM departments;
CREATE TABLE positions_backup AS SELECT * FROM positions;
CREATE TABLE gallery_items_backup AS SELECT * FROM gallery_items;
CREATE TABLE industry_tags_backup AS SELECT * FROM industry_tags;

-- Convert existing text data to JSON format in English (default language)
UPDATE companies SET 
  name = CASE 
    WHEN name IS NOT NULL THEN json_build_object('en', name)::json 
    ELSE NULL 
  END,
  description = CASE 
    WHEN description IS NOT NULL THEN json_build_object('en', description)::json 
    ELSE NULL 
  END,
  address = CASE 
    WHEN address IS NOT NULL THEN json_build_object('en', address)::json 
    ELSE NULL 
  END,
  city = CASE 
    WHEN city IS NOT NULL THEN json_build_object('en', city)::json 
    ELSE NULL 
  END,
  country = CASE 
    WHEN country IS NOT NULL THEN json_build_object('en', country)::json 
    ELSE NULL 
  END;

UPDATE departments SET 
  name = CASE 
    WHEN name IS NOT NULL THEN json_build_object('en', name)::json 
    ELSE NULL 
  END,
  description = CASE 
    WHEN description IS NOT NULL THEN json_build_object('en', description)::json 
    ELSE NULL 
  END;

UPDATE positions SET 
  title = CASE 
    WHEN title IS NOT NULL THEN json_build_object('en', title)::json 
    ELSE NULL 
  END,
  description = CASE 
    WHEN description IS NOT NULL THEN json_build_object('en', description)::json 
    ELSE NULL 
  END,
  location = CASE 
    WHEN location IS NOT NULL THEN json_build_object('en', location)::json 
    ELSE NULL 
  END,
  city = CASE 
    WHEN city IS NOT NULL THEN json_build_object('en', city)::json 
    ELSE NULL 
  END,
  country = CASE 
    WHEN country IS NOT NULL THEN json_build_object('en', country)::json 
    ELSE NULL 
  END,
  salary_range = CASE 
    WHEN salary_range IS NOT NULL THEN json_build_object('en', salary_range)::json 
    ELSE NULL 
  END,
  employment_type = CASE 
    WHEN employment_type IS NOT NULL THEN json_build_object('en', employment_type)::json 
    ELSE NULL 
  END,
  language_requirements = CASE 
    WHEN language_requirements IS NOT NULL THEN json_build_object('en', language_requirements)::json 
    ELSE NULL 
  END,
  qualifications = CASE 
    WHEN qualifications IS NOT NULL THEN json_build_object('en', qualifications)::json 
    ELSE NULL 
  END,
  responsibilities = CASE 
    WHEN responsibilities IS NOT NULL THEN json_build_object('en', responsibilities)::json 
    ELSE NULL 
  END;

UPDATE gallery_items SET 
  title = CASE 
    WHEN title IS NOT NULL THEN json_build_object('en', title)::json 
    ELSE NULL 
  END,
  description = CASE 
    WHEN description IS NOT NULL THEN json_build_object('en', description)::json 
    ELSE NULL 
  END;

UPDATE industry_tags SET 
  name = CASE 
    WHEN name IS NOT NULL THEN json_build_object('en', name)::json 
    ELSE NULL 
  END,
  description = CASE 
    WHEN description IS NOT NULL THEN json_build_object('en', description)::json 
    ELSE NULL 
  END;