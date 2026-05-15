import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { recordAuditLog } from '@/app/api/admin/audit-logs/route';

// GET all complaints (no user filtering, only for ADMIN)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { data: complaints, error } = await supabaseAdmin
      .from('complaints')
      .select('*, users:citizen_id(name, email, image_url)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(complaints);
  } catch (error: any) {
    console.error('Admin Fetch Complaints error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// PATCH to update complaint status/priority
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, priority, admin_notes, is_verified, deadline, internal_notes, assigned_department_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Complaint ID is required' }, { status: 400 });
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;
    if (is_verified !== undefined) updates.is_verified = is_verified;
    if (deadline) updates.deadline = deadline;
    if (internal_notes !== undefined) updates.internal_notes = internal_notes;
    
    // Handle department assignment (allow null for unassigning)
    if (assigned_department_id !== undefined) {
      updates.assigned_department_id = assigned_department_id === '' ? null : assigned_department_id;
    }

    const { data: updatedComplaint, error } = await supabaseAdmin
      .from('complaints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // --- NOTIFICATIONS LOGIC ---

    // 1. Notify Citizen of status change
    if (status) {
      await supabaseAdmin.from('notifications').insert({
        user_id: updatedComplaint.citizen_id,
        title: '📋 Status Updated',
        message: `Complaint #${updatedComplaint.id.substring(0,6)} is now: ${status.toUpperCase()}.`
      });
    }

    // 2. Notify when a department is assigned
    if (assigned_department_id) {
      // Get department name
      const { data: dept } = await supabaseAdmin
        .from('departments')
        .select('name')
        .eq('id', assigned_department_id)
        .single();

      // A. Notify the Citizen about the assignment
      await supabaseAdmin.from('notifications').insert({
        user_id: updatedComplaint.citizen_id,
        title: '🏢 Department Assigned',
        message: `Your complaint has been assigned to ${dept?.name || 'a department'} for resolution.`
      });

      // B. Notify all Officers in that department
      const { data: officers } = await supabaseAdmin
        .from('user_departments')
        .select('user_id')
        .eq('department_id', assigned_department_id);

      if (officers && officers.length > 0) {
        const officerNotifications = officers.map(o => ({
          user_id: o.user_id,
          title: '🆕 New Assignment',
          message: `Task: ${updatedComplaint.category} complaint (#${updatedComplaint.id.substring(0,6)}) has been assigned to your department.`,
          metadata: { complaint_id: id }
        }));
        await supabaseAdmin.from('notifications').insert(officerNotifications);
      }
    }

    // Record Audit Log
    await recordAuditLog(
      session.user.id || 'admin',
      'UPDATE_COMPLAINT',
      id,
      { updates }
    );

    return NextResponse.json(updatedComplaint);
  } catch (error: any) {
    console.error('Admin Update Complaint error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
