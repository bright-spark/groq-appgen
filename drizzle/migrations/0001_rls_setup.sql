-- Enable RLS on all tables
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

-- Create a role for authenticated users if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated;
        GRANT USAGE ON SCHEMA public TO authenticated;
    END IF;
END
$$;

-- Policies for gallery_items
CREATE POLICY "Enable read access for all users" ON "public"."gallery_items"
    AS PERMISSIVE FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON "public"."gallery_items"
    AS PERMISSIVE FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for owners" ON "public"."gallery_items"
    FOR UPDATE
    USING (auth.uid()::text = "creator_id");

-- Policies for upvotes
CREATE POLICY "Enable read access for all users on upvotes" ON "public"."upvotes"
    AS PERMISSIVE FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Enable insert for authenticated users on upvotes" ON "public"."upvotes"
    AS PERMISSIVE FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable delete for voter" ON "public"."upvotes"
    AS PERMISSIVE FOR DELETE
    TO authenticated
    USING (auth.uid()::text = "voter_id");

-- Policies for blocked_ips (admin only)
CREATE POLICY "Enable read for admins" ON "public"."blocked_ips"
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for admins" ON "public"."blocked_ips"
    USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT SELECT ON TABLE public.gallery_items TO public;
GRANT SELECT ON TABLE public.upvotes TO public;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.gallery_items TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.upvotes TO authenticated;
GRANT ALL ON TABLE public.blocked_ips TO authenticated;
