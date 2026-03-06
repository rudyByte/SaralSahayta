# PHASE 4 - PROMPT BLOCK 2: AI ELIGIBILITY CONFIDENCE SCORING
## Copy this entire block to Antigravity/Cursor

---

## TASK: Implement AI-powered eligibility confidence calculator with probability predictions

**Context:**
Users want to know their chances of approval before spending time applying. We analyze their profile against historical data and scheme requirements to show a confidence percentage like "You have 87% probability of approval for PM-KISAN scheme."

**Technology Stack:**
- Statistical model (FREE - no external API)
- PostgreSQL functions for historical analysis
- Optional: TensorFlow.js for ML predictions (FREE, client-side)

**Expected Time:** 10 hours over 1.5 days

---

## REQUIREMENTS

### 1. CREATE CONFIDENCE CALCULATOR UTILITY

**File:** `lib/ai/confidence-calculator.ts`

```typescript
/**
 * Calculate eligibility confidence score for user-scheme combination
 * Uses statistical analysis of historical approval data
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ConfidenceFactors {
  matchScore: number;              // 0-100 from existing algorithm
  historicalApprovalRate: number;  // 0-100 based on similar profiles
  documentCompleteness: number;    // 0-100 percentage of docs ready
  demographicMatch: number;        // 0-100 how well demographics align
}

export interface ConfidenceResult {
  confidence: number;              // Final 0-100 score
  factors: ConfidenceFactors;
  similarCasesAnalyzed: number;    // How many historical apps reviewed
  recommendation: 'high' | 'medium' | 'low';
  improvementTips: string[];       // What user can do to improve
  lastUpdated: string;
}

/**
 * Main function to calculate confidence
 */
export async function calculateEligibilityConfidence(
  userId: string,
  schemeId: string,
  supabase: SupabaseClient
): Promise<ConfidenceResult> {
  try {
    // Step 1: Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    // Step 2: Get scheme details and requirements
    const { data: scheme } = await supabase
      .from('schemes')
      .select('*')
      .eq('id', schemeId)
      .single();
    
    if (!scheme) {
      throw new Error('Scheme not found');
    }
    
    // Step 3: Get user's existing match score
    const { data: matchData } = await supabase
      .from('user_scheme_matches')
      .select('match_score')
      .eq('user_id', userId)
      .eq('scheme_id', schemeId)
      .single();
    
    const matchScore = matchData?.match_score || 0;
    
    // Step 4: Get historical approval rate for similar profiles
    const { data: historicalData } = await supabase.rpc(
      'get_similar_applications',
      {
        p_scheme_id: schemeId,
        p_user_age: profile.age,
        p_caste_category: profile.caste_category,
        p_state: profile.state,
        p_income: profile.annual_income
      }
    );
    
    const historicalApprovalRate = historicalData?.[0]?.approval_rate || 50; // Default 50% if no data
    const similarCasesAnalyzed = historicalData?.[0]?.total_count || 0;
    
    // Step 5: Calculate document completeness
    const { data: requiredDocs } = await supabase
      .from('scheme_documents')
      .select('document_id')
      .eq('scheme_id', schemeId);
    
    const { data: userDocs } = await supabase
      .from('user_documents')
      .select('document_id')
      .eq('user_id', userId)
      .eq('verification_status', 'VERIFIED');
    
    const requiredDocIds = requiredDocs?.map(d => d.document_id) || [];
    const userDocIds = userDocs?.map(d => d.document_id) || [];
    
    const documentCompleteness = requiredDocIds.length > 0
      ? (requiredDocIds.filter(id => userDocIds.includes(id)).length / requiredDocIds.length) * 100
      : 100;
    
    // Step 6: Calculate demographic match
    const demographicMatch = calculateDemographicMatch(profile, scheme);
    
    // Step 7: Calculate final confidence using weighted formula
    const confidence = calculateWeightedConfidence({
      matchScore,
      historicalApprovalRate,
      documentCompleteness,
      demographicMatch
    }, similarCasesAnalyzed);
    
    // Step 8: Generate recommendation
    const recommendation = getRecommendation(confidence);
    
    // Step 9: Generate improvement tips
    const improvementTips = generateImprovementTips(
      confidence,
      {
        matchScore,
        historicalApprovalRate,
        documentCompleteness,
        demographicMatch
      },
      scheme,
      requiredDocIds,
      userDocIds
    );
    
    return {
      confidence: Math.round(confidence),
      factors: {
        matchScore,
        historicalApprovalRate,
        documentCompleteness,
        demographicMatch
      },
      similarCasesAnalyzed,
      recommendation,
      improvementTips,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Confidence calculation error:', error);
    throw error;
  }
}

/**
 * Calculate demographic match percentage
 */
function calculateDemographicMatch(profile: any, scheme: any): number {
  let score = 100;
  
  // Age check
  if (scheme.min_age && profile.age < scheme.min_age) {
    score -= 50; // Major penalty
  }
  if (scheme.max_age && profile.age > scheme.max_age) {
    score -= 50;
  }
  
  // Gender check
  if (scheme.gender && scheme.gender !== 'ALL' && profile.gender !== scheme.gender) {
    score -= 100; // Disqualifying
  }
  
  // Caste check
  if (scheme.caste_categories?.length > 0 && 
      !scheme.caste_categories.includes(profile.caste_category)) {
    score -= 40;
  }
  
  // Income check
  if (scheme.max_income && profile.annual_income > scheme.max_income) {
    score -= 30;
  }
  
  // State check
  if (scheme.states?.length > 0 && !scheme.states.includes(profile.state)) {
    score -= 100; // Disqualifying
  }
  
  return Math.max(0, score);
}

/**
 * Calculate weighted confidence score
 */
function calculateWeightedConfidence(
  factors: ConfidenceFactors,
  similarCases: number
): number {
  // If we have good historical data (50+ cases), weight it heavily
  // Otherwise, rely more on match score
  
  const hasGoodHistoricalData = similarCases >= 50;
  
  let confidence;
  
  if (hasGoodHistoricalData) {
    // Weight historical data more when available
    confidence = (
      factors.historicalApprovalRate * 0.50 +
      factors.documentCompleteness * 0.30 +
      factors.matchScore * 0.15 +
      factors.demographicMatch * 0.05
    );
  } else {
    // Rely on match score when historical data limited
    confidence = (
      factors.matchScore * 0.40 +
      factors.documentCompleteness * 0.30 +
      factors.demographicMatch * 0.20 +
      factors.historicalApprovalRate * 0.10
    );
  }
  
  return Math.min(100, Math.max(0, confidence));
}

/**
 * Get recommendation based on confidence
 */
function getRecommendation(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 75) return 'high';
  if (confidence >= 50) return 'medium';
  return 'low';
}

/**
 * Generate personalized improvement tips
 */
function generateImprovementTips(
  confidence: number,
  factors: ConfidenceFactors,
  scheme: any,
  requiredDocIds: string[],
  userDocIds: string[]
): string[] {
  const tips: string[] = [];
  
  // If already high confidence, encourage to apply
  if (confidence >= 80) {
    tips.push('Your profile is a strong match. Apply as soon as possible!');
    return tips;
  }
  
  // Document completeness tips
  if (factors.documentCompleteness < 100) {
    const missingCount = requiredDocIds.length - userDocIds.length;
    tips.push(
      `Upload ${missingCount} missing document${missingCount > 1 ? 's' : ''} to increase chances by ${Math.round((100 - factors.documentCompleteness) * 0.3)}%`
    );
  }
  
  // Match score tips
  if (factors.matchScore < 70) {
    tips.push('Update your profile with accurate details to improve match score');
  }
  
  // Deadline tip
  if (scheme.application_deadline) {
    const daysLeft = Math.ceil(
      (new Date(scheme.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft <= 7 && daysLeft > 0) {
      tips.push(`Apply soon! Deadline in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`);
    }
  }
  
  // Historical rate tip
  if (factors.historicalApprovalRate < 40) {
    tips.push('This scheme has competitive selection. Ensure all details are perfect.');
  }
  
  // Demographic tips
  if (factors.demographicMatch < 100) {
    tips.push('Review eligibility criteria carefully - some requirements may not match your profile');
  }
  
  return tips.length > 0 ? tips : ['Keep your profile updated and documents ready'];
}

/**
 * Cache confidence results for performance
 */
const confidenceCache = new Map<string, { result: ConfidenceResult; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export function getCachedConfidence(userId: string, schemeId: string): ConfidenceResult | null {
  const key = `${userId}:${schemeId}`;
  const cached = confidenceCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  
  return null;
}

export function setCachedConfidence(userId: string, schemeId: string, result: ConfidenceResult) {
  const key = `${userId}:${schemeId}`;
  confidenceCache.set(key, { result, timestamp: Date.now() });
}
```

---

### 2. CREATE DATABASE FUNCTION FOR HISTORICAL ANALYSIS

**Run in Supabase SQL Editor:**

```sql
-- ============================================
-- FUNCTION: Get Similar Applications
-- Analyzes historical data for similar user profiles
-- ============================================

CREATE OR REPLACE FUNCTION get_similar_applications(
  p_scheme_id UUID,
  p_user_age INTEGER,
  p_caste_category TEXT,
  p_state TEXT,
  p_income INTEGER
)
RETURNS TABLE (
  total_count BIGINT,
  approved_count BIGINT,
  rejected_count BIGINT,
  approval_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_count,
    COUNT(*) FILTER (WHERE a.status = 'APPROVED')::BIGINT as approved_count,
    COUNT(*) FILTER (WHERE a.status = 'REJECTED')::BIGINT as rejected_count,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE a.status = 'APPROVED')::NUMERIC / COUNT(*)::NUMERIC) * 100
      ELSE 50.0 -- Default to 50% if no historical data
    END as approval_rate
  FROM applications a
  JOIN user_profiles up ON a.user_id = up.user_id
  WHERE 
    a.scheme_id = p_scheme_id
    AND a.status IN ('APPROVED', 'REJECTED') -- Only final statuses
    AND ABS(up.age - p_user_age) <= 5 -- Similar age (±5 years)
    AND up.caste_category = p_caste_category
    AND up.state = p_state
    AND ABS(up.annual_income - p_income) <= 50000 -- Similar income (±50K)
    AND a.created_at > NOW() - INTERVAL '2 years'; -- Recent data only
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT * FROM get_similar_applications(
  'scheme-id-here'::UUID,
  25, -- age
  'SC', -- caste
  'Maharashtra', -- state
  200000 -- income
);
```

---

### 3. CREATE CONFIDENCE BADGE COMPONENT

**File:** `components/schemes/ConfidenceBadge.tsx`

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, Loader2 } from 'lucide-react';
import { calculateEligibilityConfidence, getCachedConfidence, setCachedConfidence, type ConfidenceResult } from '@/lib/ai/confidence-calculator';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ConfidenceBadgeProps {
  userId: string;
  schemeId: string;
  schemeName: string;
  showDetails?: boolean;
}

export default function ConfidenceBadge({
  userId,
  schemeId,
  schemeName,
  showDetails = false
}: ConfidenceBadgeProps) {
  const [confidence, setConfidence] = useState<ConfidenceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    loadConfidence();
  }, [userId, schemeId]);
  
  async function loadConfidence() {
    setLoading(true);
    
    try {
      // Check cache first
      const cached = getCachedConfidence(userId, schemeId);
      if (cached) {
        setConfidence(cached);
        setLoading(false);
        return;
      }
      
      // Calculate fresh
      const result = await calculateEligibilityConfidence(userId, schemeId, supabase);
      setConfidence(result);
      setCachedConfidence(userId, schemeId, result);
      
    } catch (error) {
      console.error('Failed to calculate confidence:', error);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-600">Calculating...</span>
      </div>
    );
  }
  
  if (!confidence) return null;
  
  const { confidence: score, recommendation, factors, similarCasesAnalyzed, improvementTips } = confidence;
  
  // Color and icon based on recommendation
  const badgeStyles = {
    high: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
      icon: TrendingUp,
      label: 'High Chance',
      emoji: '✅'
    },
    medium: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-300',
      icon: Minus,
      label: 'Good Chance',
      emoji: '⚡'
    },
    low: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-300',
      icon: TrendingDown,
      label: 'Low Chance',
      emoji: '⚠️'
    }
  };
  
  const style = badgeStyles[recommendation];
  const Icon = style.icon;
  
  return (
    <div className="space-y-2">
      {/* Main Badge */}
      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 
          ${style.bg} ${style.text} ${style.border}
          hover:opacity-90 transition-all
        `}
      >
        <Icon className="h-4 w-4" />
        <span className="font-semibold">{score}% {style.label}</span>
        <span>{style.emoji}</span>
        <Info className="h-3.5 w-3.5 opacity-60" />
      </button>
      
      {/* Breakdown (on click) */}
      {showBreakdown && (
        <div className="mt-3 p-4 bg-white border rounded-lg shadow-sm">
          <h4 className="font-semibold mb-3">Confidence Breakdown</h4>
          
          {/* Factors */}
          <div className="space-y-2 mb-4">
            <FactorBar
              label="Profile Match"
              value={factors.matchScore}
              color="blue"
            />
            <FactorBar
              label="Historical Success"
              value={factors.historicalApprovalRate}
              color="purple"
              subtitle={`Based on ${similarCasesAnalyzed} similar cases`}
            />
            <FactorBar
              label="Documents Ready"
              value={factors.documentCompleteness}
              color="green"
            />
            <FactorBar
              label="Demographics"
              value={factors.demographicMatch}
              color="indigo"
            />
          </div>
          
          {/* Improvement Tips */}
          {improvementTips.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h5 className="font-medium text-sm mb-2">💡 How to Improve:</h5>
              <ul className="space-y-1.5">
                {improvementTips.map((tip, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* CTA */}
          {score >= 70 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">
                Your profile is a strong match for {schemeName}
              </p>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Start Application →
              </button>
            </div>
          )}
        </div>
      )}
      
      {showDetails && !showBreakdown && (
        <p className="text-xs text-gray-500">
          Click badge to see detailed breakdown
        </p>
      )}
    </div>
  );
}

// Helper component for factor bars
function FactorBar({
  label,
  value,
  color,
  subtitle
}: {
  label: string;
  value: number;
  color: string;
  subtitle?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    indigo: 'bg-indigo-500'
  };
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium">{Math.round(value)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}
```

---

### 4. CREATE API ROUTE FOR CONFIDENCE

**File:** `app/api/schemes/[id]/confidence/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { calculateEligibilityConfidence } from '@/lib/ai/confidence-calculator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const schemeId = params.id;
    
    // Calculate confidence
    const confidence = await calculateEligibilityConfidence(
      userId,
      schemeId,
      supabase
    );
    
    return NextResponse.json(confidence);
    
  } catch (error: any) {
    console.error('Confidence API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate confidence' },
      { status: 500 }
    );
  }
}
```

---

### 5. INTEGRATE INTO SCHEME DETAILS PAGE

**Update:** `app/(dashboard)/schemes/[id]/page.tsx`

```typescript
import ConfidenceBadge from '@/components/schemes/ConfidenceBadge';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function SchemeDetailsPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  
  const { data: scheme } = await supabase
    .from('schemes')
    .select('*')
    .eq('id', params.id)
    .single();
  
  if (!scheme) {
    return <div>Scheme not found</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with Confidence Badge */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{scheme.scheme_name}</h1>
          <p className="text-gray-600 mt-2">{scheme.target_beneficiary}</p>
        </div>
        
        {userId && (
          <ConfidenceBadge
            userId={userId}
            schemeId={scheme.id}
            schemeName={scheme.scheme_name}
            showDetails={true}
          />
        )}
      </div>
      
      {/* Rest of scheme details */}
      <div className="space-y-6">
        {/* Benefit Amount */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900">Benefit Amount</h3>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            ₹{scheme.benefit_amount?.toLocaleString('en-IN')}
          </p>
        </div>
        
        {/* Eligibility */}
        <div>
          <h3 className="font-semibold mb-2">Eligibility Criteria</h3>
          <ul className="space-y-1">
            {scheme.eligibility_criteria && Object.entries(scheme.eligibility_criteria).map(([key, value]) => (
              <li key={key} className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span className="capitalize">{key.replace(/_/g, ' ')}: {String(value)}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* More sections... */}
      </div>
    </div>
  );
}
```

---

## TESTING CHECKLIST

### Test 1: High Confidence User
```
Setup:
- User: Age 22, Female, SC, ₹1.5L income, Maharashtra
- All 4 required documents uploaded
- Scheme: Post-Matric SC Scholarship

Expected:
- Confidence: 85-95%
- Recommendation: "High Chance"
- Green badge
- Tips: "Apply as soon as possible!"
```

### Test 2: Low Confidence User
```
Setup:
- User: Age 40, Male, General, ₹8L income
- Only 1 of 4 documents uploaded
- Scheme: Girl Child Education

Expected:
- Confidence: 0-20%
- Recommendation: "Low Chance"
- Orange badge
- Tips about missing docs and gender mismatch
```

### Test 3: No Historical Data
```
Setup:
- New scheme with 0 applications

Expected:
- Falls back to match score
- Shows warning: "Based on 0 similar cases"
- Still provides confidence estimate
```

### Test 4: Performance Test
```
- Load scheme page 10 times
- First load: Calculate fresh (<500ms)
- Next 9 loads: Use cache (<50ms)
- Verify cache invalidates after 1 hour
```

### Test 5: Improvement Tips
```
Setup:
- User missing 2 documents
- Deadline in 5 days

Expected Tips:
- "Upload 2 missing documents to increase chances by 30%"
- "Apply soon! Deadline in 5 days"
```

---

## SUCCESS CRITERIA

- ✅ Confidence calculated in <500ms
- ✅ Accuracy within ±15% of actual approval rate
- ✅ Shows meaningful improvement tips
- ✅ Works with no historical data (fallback to match score)
- ✅ Cache working (subsequent loads <50ms)
- ✅ UI updates when documents uploaded
- ✅ No errors in console
- ✅ Mobile responsive

---

## DELIVERABLES

1. ✅ `lib/ai/confidence-calculator.ts` (400 lines)
2. ✅ SQL function: `get_similar_applications()` (30 lines)
3. ✅ `components/schemes/ConfidenceBadge.tsx` (250 lines)
4. ✅ `app/api/schemes/[id]/confidence/route.ts` (40 lines)
5. ✅ Integration in scheme details page

**Total LOC:** ~720 lines

---

## TECH STACK

- TypeScript (strict mode)
- PostgreSQL functions
- Supabase
- React hooks
- Tailwind CSS
- (Optional) TensorFlow.js for ML

---

## CODE STYLE

- Type-safe (no `any` except error handling)
- Comprehensive error handling
- Cache expensive calculations
- Use React Query for data fetching (if available)
- Add loading skeletons
- Mobile-first responsive

---

**END OF PROMPT BLOCK 2**

**Estimated Time:** 10 hours  
**Difficulty:** Medium  
**Dependencies:** Supabase, existing match algorithm

**START CODING NOW.**
