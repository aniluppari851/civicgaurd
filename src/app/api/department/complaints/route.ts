import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { recordAuditLog } from '@/app/api/admin/audit-logs/route';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'DEPARTMENT_OFFICER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const deptId = searchParams.get('deptId');

    // Security check: Does the user belong to this department?
    if (!session.user.departments.includes(deptId)) {
      return NextResponse.json({ error: 'Access denied to this department' }, { status: 403 });
    }

    const { data: complaints, error } = await supabaseAdmin
      .from('complaints')
      .select('*, users:citizen_id(id, name, image_url, email)')
      .eq('assigned_department_id', deptId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(complaints);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'DEPARTMENT_OFFICER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id, status, is_visited, resolution_proof_url, internal_notes, deptId } = await req.json();

    // Security check: Does the user belong to this department?
    if (!session.user.departments.includes(deptId)) {
      return NextResponse.json({ error: 'Access denied to this department' }, { status: 403 });
    }

    // Double check: Is the complaint actually assigned to this department?
    const { data: complaint } = await supabaseAdmin
      .from('complaints')
      .select('assigned_department_id, citizen_id')
      .eq('id', id)
      .single();

    if (!complaint || complaint.assigned_department_id !== deptId) {
      return NextResponse.json({ error: 'Complaint not assigned to your department' }, { status: 403 });
    }

    const updates: any = {
      last_updated_by_officer_id: session.user.id
    };
    if (status) updates.status = status;
    if (is_visited !== undefined) updates.is_visited = is_visited;
    if (resolution_proof_url) updates.resolution_proof_url = resolution_proof_url;
    if (internal_notes) updates.internal_notes = internal_notes;

    const { data, error } = await supabaseAdmin
      .from('complaints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Record Audit Log
    await recordAuditLog(
      session.user.id,
      'OFFICER_UPDATE',
      id,
      { updates, department: deptId }
    );

    // Fetch department name for friendly notification
    const { data: deptInfo } = await supabaseAdmin
      .from('departments')
      .select('name')
      .eq('id', deptId)
      .single();

    // If status changed, notify citizen
    if (status) {
      await supabaseAdmin.from('notifications').insert({
        user_id: complaint.citizen_id,
        title: 'Department Action',
        message: `Officer from the ${deptInfo?.name || 'Department'} updated your complaint status to ${status}.`
      });
    }

    // --- NOTIFY ADMINS ---
    const { data: admins } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'ADMIN');

    if (admins && admins.length > 0) {
      const updateSummary = internal_notes 
        ? `added a note: "${internal_notes.substring(0, 30)}..."`
        : status 
          ? `changed status to ${status}`
          : 'updated details';

      const adminNotifications = admins.map(a => ({
        user_id: a.id,
        title: 'Officer Task Update',
        message: `Officer in ${deptInfo?.name || 'Department'} ${updateSummary} (Complaint #${id.substring(0,6)})`,
        metadata: { complaint_id: id }
      }));

      await supabaseAdmin.from('notifications').insert(adminNotifications);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
