import React from 'react';
import PolicyLayout, { PolicyHeading, PolicyList } from '@/components/layout/PolicyLayout';

export const metadata = {
  title: 'Terms & Conditions',
  description:
    "Read Porville's terms and conditions for fresh meat ordering, delivery, customer responsibilities, and legal usage.",
};

export default function TermsAndConditionsPage() {
  return (
    <PolicyLayout
      title="Terms & Conditions"
      intro="Porville is a fresh meat and food delivery platform offering chicken, mutton, quail, eggs, and ready-to-eat products. By using this website or placing an order, you agree to the terms below."
    >
      <PolicyHeading>1. Acceptance of Terms</PolicyHeading>
      <p>
        By accessing the Porville website or placing an order, the customer agrees to be bound by these
        Terms &amp; Conditions along with our Refund &amp; Cancellation Policy, Privacy Policy, and Shipping &amp;
        Delivery Policy. If you do not agree, please do not use the service.
      </p>

      <PolicyHeading>2. Products and Availability</PolicyHeading>
      <p>
        Product availability may change depending on stock. Items shown may become unavailable during high
        demand or due to sourcing conditions. We reserve the right to limit quantities or discontinue any
        product without prior notice.
      </p>

      <PolicyHeading>3. Prices, Offers and Charges</PolicyHeading>
      <p>
        Prices, offers, coupons, delivery charges, and packaging charges may change from time to time based on
        business settings and operating costs. The applicable charges are those shown at the time your order is
        placed.
      </p>

      <PolicyHeading>4. Customer Information</PolicyHeading>
      <p>
        Customers must provide correct name, mobile number, address, and delivery details. Incorrect or
        incomplete details may cause delivery failure or delay, for which Porville is not responsible.
      </p>

      <PolicyHeading>5. Order Verification and Cancellation by Porville</PolicyHeading>
      <p>
        Porville may cancel any order that appears suspicious, fake, repeated, or based on misuse. We may also
        restrict accounts involved in repeated refusals, chargebacks, or fraudulent activity.
      </p>

      <PolicyHeading>6. Perishable Products and Complaints</PolicyHeading>
      <p>
        Fresh meat and food products are perishable and must be checked immediately after delivery. Any complaint
        regarding an order must be raised within <strong>2 hours of delivery</strong>, with valid proof, so the
        product can be verified in its original condition. Please refer to our Refund &amp; Cancellation Policy for
        the full complaint process.
      </p>
      <PolicyList
        items={[
          'Inspect the product immediately upon receipt.',
          'Store meat, eggs, and ready-to-eat items at the recommended temperature.',
          'Preserve the product in original condition for inspection until any complaint is resolved.',
        ]}
      />

      <PolicyHeading>7. Limitation and Customer Rights</PolicyHeading>
      <p>
        Nothing in these terms should be read to override the rights available to customers under applicable
        Indian law. Where any clause conflicts with a mandatory legal right, that legal right prevails.
      </p>
    </PolicyLayout>
  );
}
