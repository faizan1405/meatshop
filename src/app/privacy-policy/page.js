import React from 'react';
import PolicyLayout, { PolicyHeading, PolicyList } from '@/components/layout/PolicyLayout';

export const metadata = {
  title: 'Privacy Policy',
  description:
    'Learn how Porville collects, uses, protects, and processes customer information for orders, delivery, payments, and support.',
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      intro='Porville ("we", "our", or "us") respects your privacy. This policy explains what information we collect when you use our website, place an order, or contact us, and how that information is used and protected.'
    >
      <PolicyHeading>1. Information We Collect</PolicyHeading>
      <p>
        Porville may collect the following information to fulfil your orders and provide support:
      </p>
      <PolicyList
        items={[
          'Customer name and mobile number',
          'Email address',
          'Delivery address and location details',
          'Order details, cart items, and delivery preferences',
          'Payment status (success/failure), and delivery details',
        ]}
      />
      <p>
        If you sign in with Google, we receive your name, email, and profile image from the authentication
        provider.
      </p>

      <PolicyHeading>2. How We Use Your Information</PolicyHeading>
      <p>Information is used only for legitimate business purposes, including:</p>
      <PolicyList
        items={[
          'Order processing and delivery',
          'Customer support and complaint handling',
          'Account management and order history',
          'Offers, updates, and communication about your orders',
          'Service improvement and fraud prevention',
        ]}
      />

      <PolicyHeading>3. Payments</PolicyHeading>
      <p>
        Payment details are processed securely through Razorpay or the applicable payment gateway. Porville does
        not store your sensitive card, UPI, or banking credentials on its own servers. Payment security is
        governed by the payment gateway&apos;s own systems and policies.
      </p>

      <PolicyHeading>4. Data Sharing</PolicyHeading>
      <p>
        We do not sell your personal data. Customer data may be shared only with the parties required to complete
        and support your order:
      </p>
      <PolicyList
        items={[
          'Delivery partners, to deliver your order',
          'Payment gateway (Razorpay), to process and verify payments',
          'Porville support / admin team, to manage orders and resolve issues',
          'Legal or government authorities, where required by applicable law',
        ]}
      />

      <PolicyHeading>5. Data Retention and Security</PolicyHeading>
      <p>
        We retain order and account information for as long as needed to provide the service, comply with legal
        obligations, and resolve disputes. We apply reasonable measures to protect your data, though no method of
        transmission over the internet is fully secure.
      </p>

      <PolicyHeading>6. Contact Us</PolicyHeading>
      <p>
        For any privacy-related questions or requests, you can reach Porville at:
      </p>
      <PolicyList
        items={[
          <>Email: <a href="mailto:porville1986@gmail.com" style={{ color: 'var(--primary-gold-dark)' }}>porville1986@gmail.com</a></>,
          <>Phone: <a href="tel:9217577006" style={{ color: 'var(--primary-gold-dark)' }}>9217577006</a></>,
          'Address: D-1b/1028, Sangam Vihar, New Delhi - 110080',
        ]}
      />
    </PolicyLayout>
  );
}
