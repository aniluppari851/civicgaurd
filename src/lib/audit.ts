import { supabaseAdmin } from '@/lib/supabase';

export async function recordAuditLog(adminId: string, action: string, targetId: string, details: any) {
  await supabaseAdmin.from('audit_logs').insert({
    admin_id: adminId,
    action,
    target_id: targetId,
    details
  });
}
