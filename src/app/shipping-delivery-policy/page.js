import React from 'react';
import PolicyLayout, { PolicyHeading, PolicyList } from '@/components/layout/PolicyLayout';

export const metadata = {
  title: 'Shipping & Delivery Policy',
  description:
    "Read Porville's shipping and delivery policy for fresh meat, eggs, and ready-to-eat food orders.",
};

export default function ShippingDeliveryPolicyPage() {
  return (
    <PolicyLayout
      title="Shipping & Delivery Policy"
      intro="Porville delivers fresh meat and food products to selected serviceable locations only. This policy explains delivery timing, customer responsibilities, and the charges that may apply."
    >
      <PolicyHeading>1. Serviceable Locations</PolicyHeading>
      <p>
        Porville delivers fresh meat and food products to selected serviceable locations only. Orders placed for
        addresses outside our current delivery area may not be accepted or may be cancelled.
      </p>

      <PolicyHeading>2. Delivery Time</PolicyHeading>
      <p>
        Delivery time may depend on location, order volume, product availability, weather, traffic, and
        operational conditions. Estimated delivery times are indicative and not guaranteed.
      </p>

      <PolicyHeading>3. Customer Responsibilities</PolicyHeading>
      <p>
        The customer must provide a correct address and remain available to receive the order at the delivery
        time.
      </p>
      <PolicyList
        items={[
          'Ensure the delivery address and PIN code are accurate and complete.',
          'Keep the registered mobile number reachable for delivery coordination.',
          'Be available, or arrange an authorised person, to receive the order.',
        ]}
      />

      <PolicyHeading>4. Failed or Delayed Delivery</PolicyHeading>
      <p>Delivery may fail or be delayed if:</p>
      <PolicyList
        items={[
          'The customer is unavailable to receive the order;',
          'The phone number is unreachable;',
          'The address is incorrect or incomplete.',
        ]}
      />

      <PolicyHeading>5. Storage After Delivery</PolicyHeading>
      <p>
        Once fresh / perishable products are delivered, the customer must store them properly and at the
        recommended temperature. Porville is not responsible for deterioration caused by improper storage or
        handling after delivery.
      </p>

      <PolicyHeading>6. Charges and Free Delivery</PolicyHeading>
      <p>
        Delivery charges, packaging charges, minimum order value, and free delivery rules may change depending on
        business settings. The charges applicable to your order are those shown at checkout before you place the
        order.
      </p>
    </PolicyLayout>
  );
}
