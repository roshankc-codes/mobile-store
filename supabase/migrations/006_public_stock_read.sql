CREATE OR REPLACE FUNCTION public.get_available_stock()
RETURNS TABLE (
  product_id UUID,
  available_quantity INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    product_id,
    available_quantity
  FROM public.inventory;
$$;

REVOKE EXECUTE ON FUNCTION public.get_available_stock() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_available_stock() TO anon, authenticated;
