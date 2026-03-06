# PHASE 4 - PROMPT BLOCKS 3, 4, 5: NOTIFICATIONS, EXPIRY & PREMIUM
## Copy each block separately to Antigravity/Cursor

---
---

# PROMPT BLOCK 3: SMART NOTIFICATIONS SYSTEM

## TASK: Implement automated smart notifications with deadline reminders, document expiry alerts, and new scheme notifications

**Context:**
Users need timely reminders to not miss deadlines and keep documents current. Implement automated notification system using FREE pg_cron (built into Supabase) for scheduled jobs.

**Technology Stack:**
- pg_cron (FREE - Supabase built-in)
- Brevo Email API (FREE 300/day)
- MSG91 SMS (₹0.15/SMS - only premium users)

**Expected Time:** 12 hours over 2 days

---

## REQUIREMENTS

### 1. NOTIFICATION PREFERENCES PAGE

**File:** `app/(dashboard)/settings/notifications/page.tsx`

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Bell, Mail, MessageSquare, Check } from 'lucide-react';

export default function NotificationSettingsPage() {
  const supabase = createClientComponentClient();
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    deadline_reminders: true,
    expiry_alerts: true,
    new_scheme_alerts: true,
    notification_frequency: 'realtime'
  });
  const [isPremium, setIsPremium] = useState(false);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    loadPreferences();
  }, []);
  
  async function loadPreferences() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    // Get user premium status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_premium')
      .eq('user_id', session.user.id)
      .single();
    
    setIsPremium(profile?.is_premium || false);
    
    // Get preferences
    const { data: prefs } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (prefs) {
      setPreferences(prefs);
    }
  }
  
  async function savePreferences() {
    setSaving(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const { error } = await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: session.user.id,
        ...preferences
      });
    
    if (error) {
      alert('Failed to save preferences');
    } else {
      alert('Preferences saved successfully');
    }
    
    setSaving(false);
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Notification Preferences</h1>
      
      {/* Channels */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="font-semibold mb-4">Notification Channels</h2>
        
        <div className="space-y-4">
          <Toggle
            icon={<Mail className="h-5 w-5" />}
            label="Email Notifications"
            checked={preferences.email_enabled}
            onChange={(checked) => setPreferences({ ...preferences, email_enabled: checked })}
          />
          
          <Toggle
            icon={<MessageSquare className="h-5 w-5" />}
            label="SMS Notifications"
            checked={preferences.sms_enabled}
            onChange={(checked) => setPreferences({ ...preferences, sms_enabled: checked })}
            disabled={!isPremium}
            badge={!isPremium ? 'Premium Only' : undefined}
          />
          
          <Toggle
            icon={<Bell className="h-5 w-5" />}
            label="In-App Notifications"
            checked={preferences.push_enabled}
            onChange={(checked) => setPreferences({ ...preferences, push_enabled: checked })}
          />
        </div>
      </div>
      
      {/* Types */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="font-semibold mb-4">Notification Types</h2>
        
        <div className="space-y-4">
          <Toggle
            label="Deadline Reminders"
            description="Get notified 7, 3, and 1 day before scheme deadlines"
            checked={preferences.deadline_reminders}
            onChange={(checked) => setPreferences({ ...preferences, deadline_reminders: checked })}
          />
          
          <Toggle
            label="Document Expiry Alerts"
            description="Reminders when documents are about to expire"
            checked={preferences.expiry_alerts}
            onChange={(checked) => setPreferences({ ...preferences, expiry_alerts: checked })}
          />
          
          <Toggle
            label="New Scheme Alerts"
            description="Get notified when new schemes match your profile"
            checked={preferences.new_scheme_alerts}
            onChange={(checked) => setPreferences({ ...preferences, new_scheme_alerts: checked })}
          />
        </div>
      </div>
      
      {/* Frequency */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="font-semibold mb-4">Notification Frequency</h2>
        
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="frequency"
              value="realtime"
              checked={preferences.notification_frequency === 'realtime'}
              onChange={(e) => setPreferences({ ...preferences, notification_frequency: e.target.value })}
            />
            <div>
              <div className="font-medium">Real-time</div>
              <div className="text-sm text-gray-600">Get notified immediately</div>
            </div>
          </label>
          
          <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="frequency"
              value="daily_digest"
              checked={preferences.notification_frequency === 'daily_digest'}
              onChange={(e) => setPreferences({ ...preferences, notification_frequency: e.target.value })}
            />
            <div>
              <div className="font-medium">Daily Digest</div>
              <div className="text-sm text-gray-600">Once per day at 9 AM</div>
            </div>
          </label>
        </div>
      </div>
      
      <button
        onClick={savePreferences}
        disabled={saving}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
}

function Toggle({ icon, label, description, checked, onChange, disabled, badge }: any) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex gap-3">
        {icon && <div className="text-gray-400 mt-0.5">{icon}</div>}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{label}</span>
            {badge && (
              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-600 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
      </label>
    </div>
  );
}
```

### 2. EMAIL SERVICE (Brevo - FREE)

**File:** `lib/notifications/email-service.ts`

```typescript
export async function sendEmail({
  to,
  subject,
  template,
  data
}: {
  to: string;
  subject: string;
  template: string;
  data: any;
}) {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!
      },
      body: JSON.stringify({
        sender: {
          name: 'Saral Sahayta',
          email: 'noreply@saralsahayta.in'
        },
        to: [{ email: to }],
        subject,
        htmlContent: renderEmailTemplate(template, data)
      })
    });
    
    if (!response.ok) {
      throw new Error('Email send failed');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
}

function renderEmailTemplate(template: string, data: any): string {
  const templates: Record<string, (d: any) => string> = {
    'deadline-reminder': (d) => `
      <h2>⏰ Scheme Deadline Approaching</h2>
      <p>The application deadline for <strong>${d.schemeName}</strong> is ${d.deadline}.</p>
      <p>${d.daysLeft} day(s) remaining to apply!</p>
      <a href="${d.schemeUrl}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:white;text-decoration:none;border-radius:6px;margin-top:16px;">
        Apply Now
      </a>
    `,
    'document-expiry': (d) => `
      <h2>📄 Document Expiry Alert</h2>
      <p>Your <strong>${d.documentName}</strong> will expire on ${d.expiryDate}.</p>
      <p>Renew it now to avoid application delays.</p>
      <a href="${d.renewalUrl}" style="display:inline-block;padding:12px 24px;background:#10b981;color:white;text-decoration:none;border-radius:6px;margin-top:16px;">
        Renew Document
      </a>
    `,
    'new-scheme': (d) => `
      <h2>🎉 New Scheme Available!</h2>
      <p>You are eligible for: <strong>${d.schemeName}</strong></p>
      <p><strong>Benefit:</strong> ${d.benefitAmount}</p>
      <a href="${d.schemeUrl}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:white;text-decoration:none;border-radius:6px;margin-top:16px;">
        View Details
      </a>
    `
  };
  
  return templates[template]?.(data) || '<p>Notification from Saral Sahayta</p>';
}
```

### 3. SMS SERVICE (MSG91 - ₹0.15/SMS)

**File:** `lib/notifications/sms-service.ts`

```typescript
export async function sendSMS(to: string, message: string) {
  try {
    const response = await fetch(`https://api.msg91.com/api/v5/flow/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': process.env.MSG91_AUTH_KEY!
      },
      body: JSON.stringify({
        sender: process.env.MSG91_SENDER_ID,
        route: '4',
        country: '91',
        recipients: [{
          mobiles: to,
          var1: message
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error('SMS failed');
    }
    
    return { success: true };
  } catch (error) {
    console.error('SMS error:', error);
    return { success: false, error };
  }
}
```

---

## TESTING

**Test Deadline Reminder:**
```sql
-- Manually trigger
SELECT notify_scheme_deadlines();

-- Verify notifications created
SELECT * FROM notifications 
WHERE type = 'SCHEME_DEADLINE_REMINDER' 
ORDER BY created_at DESC;
```

**Test Document Expiry:**
```sql
-- Set test expiry date
UPDATE user_documents 
SET expiry_date = CURRENT_DATE + 7 
WHERE user_id = 'your-user-id' 
LIMIT 1;

-- Trigger check
SELECT notify_document_expiry();
```

---
---

# PROMPT BLOCK 4: DOCUMENT EXPIRY MANAGEMENT

## TASK: Implement automated document expiry tracking and renewal workflow

**Expected Time:** 8 hours over 1 day

## REQUIREMENTS

### 1. EXPIRY CALCULATOR

**File:** `lib/documents/expiry-calculator.ts`

```typescript
export function calculateExpiryDate(documentCode: string, issueDate: Date): Date {
  const expiryRules: Record<string, number> = {
    'INCOME_CERT': 365,      // 1 year
    'CASTE_CERT_SC': 1095,   // 3 years
    'CASTE_CERT_ST': 1095,
    'CASTE_CERT_OBC': 1095,
    'DOMICILE': 1095,
    // Add more
  };
  
  const daysToAdd = expiryRules[documentCode] || 365; // Default 1 year
  
  const expiry = new Date(issueDate);
  expiry.setDate(expiry.getDate() + daysToAdd);
  
  return expiry;
}
```

### 2. RENEWAL GUIDE PAGE

**File:** `app/(dashboard)/documents/renew/[code]/page.tsx`

```typescript
export default async function DocumentRenewalPage({ params }: { params: { code: string } }) {
  const { data: guide } = await getDocumentRenewalGuide(params.code);
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Renew {guide.documentName}</h1>
      
      <Alert type="warning">
        Your document expires on {guide.expiryDate}. Renew now to avoid delays!
      </Alert>
      
      <Tabs>
        <Tab title="Online Renewal">
          <Steps steps={guide.onlineSteps} />
        </Tab>
        
        <Tab title="Offline Renewal">
          <Steps steps={guide.offlineSteps} />
          <NearestOfficeCard office={guide.nearestOffice} />
        </Tab>
      </Tabs>
      
      <FileUpload documentCode={params.code} label="Upload Renewed Document" />
    </div>
  );
}
```

---
---

# PROMPT BLOCK 5: PREMIUM FEATURES (RAZORPAY)

## TASK: Implement premium subscription and per-scheme premium payments

**Expected Time:** 15 hours over 2 days

## REQUIREMENTS

### 1. PRICING PLANS PAGE

**File:** `app/(dashboard)/premium/page.tsx`

```typescript
'use client';

import React from 'react';
import { Crown, Zap, CheckCircle } from 'lucide-react';

const PLANS = [
  {
    id: 'monthly',
    name: 'Premium Monthly',
    price: 199,
    duration: 'month',
    features: [
      'Priority application review (24-48 hours)',
      'SMS status updates',
      'Unlimited applications',
      'WhatsApp support',
      'Document verification priority',
      'Application tracking SMS'
    ]
  },
  {
    id: 'yearly',
    name: 'Premium Yearly',
    price: 1999,
    duration: 'year',
    badge: 'Save 17%',
    features: [
      'All monthly features',
      '2 months FREE',
      'Priority customer support',
      'Early access to new schemes'
    ]
  }
];

export default function PremiumPage() {
  async function handleSubscribe(planId: string, amount: number) {
    // Create Razorpay order
    const orderRes = await fetch('/api/premium/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, amount })
    });
    
    const { orderId } = await orderRes.json();
    
    // Open Razorpay checkout
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: amount * 100, // paise
      currency: 'INR',
      name: 'Saral Sahayta Premium',
      description: planId === 'monthly' ? 'Monthly Subscription' : 'Yearly Subscription',
      order_id: orderId,
      handler: async function(response: any) {
        // Verify payment
        await fetch('/api/premium/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response)
        });
        
        window.location.reload();
      }
    };
    
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-12">
        <Crown className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
        <h1 className="text-4xl font-bold mb-2">Go Premium</h1>
        <p className="text-gray-600">Get your applications processed faster with priority support</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        {PLANS.map(plan => (
          <div key={plan.id} className="border-2 rounded-lg p-8 hover:border-blue-500 transition relative">
            {plan.badge && (
              <span className="absolute top-4 right-4 bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                {plan.badge}
              </span>
            )}
            
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">₹{plan.price}</span>
              <span className="text-gray-600">/{plan.duration}</span>
            </div>
            
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => handleSubscribe(plan.id, plan.price)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Subscribe Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. CREATE ORDER API

**File:** `app/api/premium/create-order/route.ts`

```typescript
import Razorpay from 'razorpay';
import { NextRequest, NextResponse } from 'next/server';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
});

export async function POST(request: NextRequest) {
  const { planId, amount } = await request.json();
  
  const order = await razorpay.orders.create({
    amount: amount * 100, // paise
    currency: 'INR',
    receipt: `premium_${Date.now()}`
  });
  
  return NextResponse.json({ orderId: order.id });
}
```

### 3. VERIFY PAYMENT API

**File:** `app/api/premium/verify/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
  
  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');
  
  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  // Save transaction
  await supabase.from('premium_transactions').insert({
    user_id: session.user.id,
    razorpay_order_id,
    razorpay_payment_id,
    status: 'captured',
    amount: 19900 // ₹199
  });
  
  // Activate premium
  await supabase
    .from('user_profiles')
    .update({
      is_premium: true,
      premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    })
    .eq('user_id', session.user.id);
  
  return NextResponse.json({ success: true });
}
```

### 4. ADMIN PRIORITY QUEUE

**File:** `app/(admin)/admin/applications/page.tsx`

```typescript
export default async function AdminApplicationsPage() {
  const { data: queue } = await supabase
    .from('admin_application_queue')
    .select('*')
    .order('priority_order', { ascending: true })
    .order('submitted_at', { ascending: true });
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Application Review Queue</h1>
      
      <div className="space-y-4">
        {queue?.map(app => (
          <div key={app.id} className={`
            p-4 border rounded-lg
            ${app.is_priority ? 'border-yellow-400 bg-yellow-50' : ''}
          `}>
            {app.is_priority && (
              <span className="inline-block px-2 py-1 bg-yellow-200 text-yellow-900 text-sm rounded mb-2">
                ⚡ PRIORITY
              </span>
            )}
            
            <h3 className="font-semibold">{app.scheme_name}</h3>
            <p className="text-sm text-gray-600">{app.user_name} - {app.user_email}</p>
            <p className="text-xs text-gray-500 mt-1">
              Submitted {app.hours_waiting} hours ago
            </p>
            
            <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded">
              Review Application →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## TESTING

**Test Payment Flow:**
1. Go to /premium
2. Click "Subscribe Now"
3. Use Razorpay test card: 4111 1111 1111 1111
4. Complete payment
5. Verify:
   - is_premium = true
   - premium_expires_at = +30 days
   - Transaction in premium_transactions table

**Test Priority Queue:**
1. Create application as premium user
2. Check admin queue
3. Premium app should be at top

---

**END OF ALL PROMPT BLOCKS**

**Total Blocks:** 5
**Total Time:** ~60 hours
**Total LOC:** ~3,500 lines

