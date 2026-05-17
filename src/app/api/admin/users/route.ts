import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, is_blocked, created_at, user_departments(department_id)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const flattenedUsers = users.map(u => ({
      ...u,
      departments: u.user_departments.map((ud: any) => ud.department_id)
    }));

    return NextResponse.json(flattenedUsers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { id, role, is_blocked, departments, bio } = body;

    console.log('User update request:', { id, role, is_blocked, departments, bio });

    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    // SECURITY: Only allow admins to change roles/block status. 
    // Allow users to update their own bio (for department locking).
    const isAdmin = session.user.role === 'ADMIN';
    const isSelf = session.user.id === id;

    if (!isAdmin && (!isSelf || role || is_blocked !== undefined || departments)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const updates: any = {};
    if (isAdmin && role) updates.role = role;
    if (isAdmin && is_blocked !== undefined) updates.is_blocked = is_blocked;
    if (bio) updates.bio = bio;

    let userData = null;
    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Supabase update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      userData = data;
    }

    // Handle Department Assignments
    if (departments && Array.isArray(departments)) {
      // Clear old assignments
      const { error: delError } = await supabaseAdmin.from('user_departments').delete().eq('user_id', id);
      if (delError) console.error('Delete assignments error:', delError);
      
      // Insert new assignments
      if (departments.length > 0) {
        const assignments = departments.map(deptId => ({
          user_id: id,
          department_id: deptId
        }));
        const { error: insError } = await supabaseAdmin.from('user_departments').insert(assignments);
        if (insError) {
          console.error('Insert assignments error:', insError);
        } else {
          // --- NOTIFY THE OFFICER ---
          try {
            await supabaseAdmin.from('notifications').insert({
              user_id: id,
              title: '🏢 Access Updated',
              message: `Admin has updated your department assignments. Please refresh to see changes.`
            });
          } catch (notifyErr) {
            console.error('Failed to notify officer of assignment:', notifyErr);
          }
        }
      }
    }

    // Record Audit Log
    await recordAuditLog(
      session.user.id || 'admin',
      'UPDATE_USER',
      id,
      { updates, departments }
    );

    return NextResponse.json(userData || { success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    // Prevent deleting self
    if (id === session.user.id) {
      return NextResponse.json({ error: 'You cannot delete your own admin account' }, { status: 400 });
    }

    // 1. Delete department assignments first (satisfy foreign key)
    await supabaseAdmin.from('user_departments').delete().eq('user_id', id);

    // 2. Delete notifications
    await supabaseAdmin.from('notifications').delete().eq('user_id', id);

    // 3. Delete messages (both sent and received)
    await supabaseAdmin.from('messages').delete().or(`sender_id.eq.${id},receiver_id.eq.${id}`);

    // 4. Delete complaints filed by this user
    // Note: This is necessary to allow citizen deletion if cascade is not set
    await supabaseAdmin.from('complaints').delete().eq('citizen_id', id);

    // 5. Delete the user
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Record Audit Log
    await recordAuditLog(
      session.user.id || 'admin',
      'DELETE_USER',
      id,
      { timestamp: new Date().toISOString() }
    );

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
