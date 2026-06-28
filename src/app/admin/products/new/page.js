import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AdminProductForm from '@/components/admin/AdminProductForm';

export default async function AdminNewProductPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'admin') {
    redirect('/admin/login');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <Link href="/admin/products" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
          <ArrowLeft size={16} />
          <span>Back to Products</span>
        </Link>
      </div>

      <AdminProductForm />
    </div>
  );
}

export const metadata = {
  title: "Add Product | Porville Admin",
};
