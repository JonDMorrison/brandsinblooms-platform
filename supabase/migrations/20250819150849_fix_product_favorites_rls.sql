-- Drop the existing incorrect policy
DROP POLICY IF EXISTS "Users can manage own favorites" ON product_favorites;

-- Create corrected RLS policy that properly checks the user
CREATE POLICY "Users can manage own favorites"
ON product_favorites
FOR ALL
USING (
  profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  profile_id IN (
    SELECT id FROM profiles 
    WHERE user_id = auth.uid()
  )
);