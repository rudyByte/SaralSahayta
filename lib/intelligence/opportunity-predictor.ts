import { differenceInYears, addYears } from 'date-fns';
import { createClient } from '@/lib/supabase-server';

interface SimpleScheme {
  id: string;
  name: string;
  benefitAmount: number;
}

interface Prediction {
  triggerEvent: string;
  triggerDate: string;
  schemes: SimpleScheme[];
}

export async function predictFutureOpportunities(userId: string): Promise<Prediction[]> {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('date_of_birth')
    .eq('user_id', userId)
    .single();

  if (!profile?.date_of_birth) return [];

  const dob = new Date(profile.date_of_birth);
  const currentAge = differenceInYears(new Date(), dob);
  
  // Future age thresholds we care about
  const thresholds = [18, 60, 65];
  const upcomingThresholds = thresholds.filter(t => t > currentAge && t <= currentAge + 5);

  if (upcomingThresholds.length === 0) return [];

  const predictions: Prediction[] = [];

  for (const targetAge of upcomingThresholds) {
      let targetSchemes: SimpleScheme[] = [];
      if (targetAge === 18) {
          const { data } = await supabase.from('Scheme').select('id, name, benefitAmount').ilike('name', '%youth%').limit(2);
          targetSchemes = (data || []) as SimpleScheme[];
          if (targetSchemes.length === 0) {
              targetSchemes = [{ id: 'mock1', name: 'Youth Empowerment Scheme', benefitAmount: 15000 }];
          }
      } else if (targetAge === 60) {
          const { data } = await supabase.from('Scheme').select('id, name, benefitAmount').ilike('name', '%pension%').limit(2);
          targetSchemes = (data || []) as SimpleScheme[];
          if (targetSchemes.length === 0) {
              targetSchemes = [{ id: 'mock2', name: 'Senior Citizen Pension Plan', benefitAmount: 3000 }];
          }
      }

      if (targetSchemes.length > 0) {
          predictions.push({
              triggerEvent: `Turning ${targetAge}`,
              triggerDate: addYears(dob, targetAge).toISOString(),
              schemes: targetSchemes
          });
      }
  }

  return predictions;
}
