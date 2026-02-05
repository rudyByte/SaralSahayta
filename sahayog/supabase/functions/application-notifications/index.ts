import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
    const { record, old_record, type } = await req.json()

    // Only handle status changes
    if (type === 'UPDATE' && record.status !== old_record.status) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Fetch user details
        const { data: userData } = await supabase
            .from('profiles')
            .select('full_name, phone, email')
            .eq('id', record.user_id)
            .single()

        // Fetch scheme details
        const { data: schemeData } = await supabase
            .from('schemes')
            .select('scheme_name')
            .eq('id', record.scheme_id)
            .single()

        const message = `Dear ${userData.full_name}, your application for ${schemeData.scheme_name} status has been updated to ${record.status}. View details at Sahayog Portal.`

        // Log notification (In production, integrate with Twilio/Resend)
        console.log(`Sending notification to ${userData.phone}: ${message}`)

        // Example Twilio integration here
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
})
