import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function findSimilarActiveSchemes(missedScheme: any) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  // Find active schemes with:
  // 1. Same category
  // 2. Similar benefit amount (within generous bounds)
  // 3. Currently accepting applications
  
  const minBenefit = missedScheme.benefit_amount ? missedScheme.benefit_amount * 0.5 : 0;
  
  let query = supabase
    .from('schemes')
    .select('*')
    .eq('active_status', true)
    // Category match
    .eq('scheme_category', missedScheme.scheme_category)
    // Must be active and not past deadline if it has one
    .or(`application_deadline.gte.${new Date().toISOString()},is_rolling.eq.true`)
    // Don't recommend the exact same scheme if we're just comparing
    .neq('id', missedScheme.id)
    .limit(3);

  if (missedScheme.benefit_amount) {
      query = query.gte('benefit_amount', minBenefit);
  }

  const { data: activeSchemes } = await query;
  return activeSchemes || [];
}
