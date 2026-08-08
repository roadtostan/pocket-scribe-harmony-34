-- Balance helpers only read data; they do not need elevated privileges
CREATE OR REPLACE FUNCTION public.increment_balance(account_id_param uuid, amount_param integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT balance INTO current_balance FROM accounts WHERE id = account_id_param;
  RETURN current_balance + amount_param;
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrement_balance(account_id_param uuid, amount_param integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT balance INTO current_balance FROM accounts WHERE id = account_id_param;
  RETURN current_balance - amount_param;
END;
$function$;

-- Ownership helper stays SECURITY DEFINER for use inside RLS, but is not directly callable via the API
REVOKE ALL ON FUNCTION public.user_owns_book(uuid) FROM PUBLIC, anon, authenticated;
