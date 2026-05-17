import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 1. Authenticate with Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (authError) {
          // This will throw "Email not confirmed" if they haven't clicked the link!
          throw new Error(authError.message);
        }

        if (!authData.user) return null;

        // 2. Fetch extended profile from public.users
        const { data: user, error } = await supabaseAdmin
          .from('users')
          .select('*, user_departments(department_id)')
          .eq('id', authData.user.id)
          .single();

        if (error || !user) return null;

        if (user.is_blocked) {
          throw new Error('Your account has been restricted. Please contact support.');
        }

        let departments: string[] = [];
        if (user.role === 'DEPARTMENT_OFFICER') {
          departments = user.user_departments?.map((d: any) => d.department_id) || [];
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image_url,
          bio: user.bio,
          departments: departments,
        };
      },
    }),
    CredentialsProvider({
      id: 'admin-login',
      name: 'Admin',
      credentials: {
        secretKey: { label: 'Secret Key', type: 'password' },
      },
      async authorize(credentials) {
        if (credentials?.secretKey === 'aniluppari851 ADMIN!') {
          const systemAdmin = {
            id: '00000000-0000-0000-0000-000000000000',
            name: 'System Admin',
            email: 'admin@system.local',
            role: 'ADMIN',
            image_url: null,
            bio: 'System Administrator',
            password: 'SYSTEM_HARDCODED_BYPASS' // Dummy password
          };

          // Auto-provision system admin in DB if missing (satisfies foreign keys)
          await supabaseAdmin.from('users').upsert(systemAdmin, { onConflict: 'id' });

          return {
            id: systemAdmin.id,
            name: systemAdmin.name,
            email: systemAdmin.email,
            role: systemAdmin.role,
            image: systemAdmin.image_url,
            bio: systemAdmin.bio
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: sessionData }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.image = (user as any).image;
        token.bio = (user as any).bio;
        token.departments = (user as any).departments || [];
      }

      // Handle session.update()
      if (trigger === 'update' && sessionData) {
        if (sessionData.name) token.name = sessionData.name;
        if (sessionData.image_url) token.image = sessionData.image_url;
        if (sessionData.bio) token.bio = sessionData.bio;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.image = token.image;
        session.user.bio = token.bio;
        session.user.departments = token.departments || [];
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
};
