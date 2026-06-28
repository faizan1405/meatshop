import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from './db';
import User from '@/models/User';
import AdminUser from '@/models/AdminUser';

export const authOptions = {
  providers: [
    // 1. Google Auth for Customers
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret',
    }),
    
    // 2. Credentials Auth for Admin User
    CredentialsProvider({
      id: 'admin-credentials',
      name: 'Admin Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password');
        }

        await connectDB();

        // Find admin user in database
        const admin = await AdminUser.findOne({ email: credentials.email.toLowerCase() });

        if (!admin) {
          throw new Error('No admin user found with this email');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(credentials.password, admin.password);

        if (!isValidPassword) {
          throw new Error('Invalid credentials');
        }

        return {
          id: admin._id.toString(),
          name: admin.name,
          email: admin.email,
          role: 'admin',
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === 'google') {
        try {
          await connectDB();
          
          // Check if customer already exists in MongoDB
          const existingUser = await User.findOne({ email: user.email });
          
          if (!existingUser) {
            // Create a new customer profile
            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              role: 'customer',
            });
          }
          return true;
        } catch (error) {
          console.error('Error saving user on sign in:', error);
          return false;
        }
      }
      // For credentials authorize, we already verified
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'customer';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      
      // Load user profile details if customer
      if (session.user.role === 'customer') {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: session.user.email });
          if (dbUser) {
            session.user.id = dbUser._id.toString();
          }
        } catch (e) {
          console.error('Error loading dbUser in session', e);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect on auth errors
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Never fall back to a hardcoded secret in production: a predictable secret
  // lets anyone forge session JWTs (including admin sessions). In production we
  // require NEXTAUTH_SECRET to be set; only local dev gets a throwaway default.
  secret:
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV !== 'production'
      ? 'dev-only-insecure-secret-do-not-use-in-prod'
      : undefined),
};

if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  console.error(
    '[auth] NEXTAUTH_SECRET is not set in production. Authentication is insecure and may fail. Set NEXTAUTH_SECRET in your environment.'
  );
}
