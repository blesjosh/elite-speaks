-- SQL function that returns column information for a given table
-- An admin can run this in the Supabase SQL editor to create a helper function

-- Function to get column information for a table
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Run with definer privileges
AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    columns.column_name::text,
    columns.data_type::text,
    (columns.is_nullable = 'YES') AS is_nullable
  FROM 
    information_schema.columns
  WHERE 
    columns.table_name = get_table_columns.table_name
  ORDER BY 
    columns.ordinal_position;
END;
$$;
