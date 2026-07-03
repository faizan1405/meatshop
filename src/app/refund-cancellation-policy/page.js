import React from 'react';
import PolicyLayout, { PolicyHeading, PolicyList } from '@/components/layout/PolicyLayout';

export const metadata = {
  title: 'Refund & Cancellation Policy',
  description:
    "Read Porville's refund, cancellation, COD, prepaid order, Razorpay, complaint window, and perishable product policy.",
};

export default function RefundCancellationPolicyPage() {
  return (
    <PolicyLayout
      title="Refund & Cancellation Policy"
      intro="Porville deals in fresh and perishable food products. This policy explains our complaint window, product condition requirements, cancellation rules for Cash on Delivery and prepaid orders, and how approved refunds are processed."
    >
      <PolicyHeading>A. Complaint Window and Product Condition Policy</PolicyHeading>
      <p>
        Porville deals in fresh and perishable food products. Any complaint regarding an order must be raised
        within <strong>2 hours of delivery / receipt</strong>.
      </p>
      <p>
        Complaints received after 2 hours may not be eligible for return, replacement, or refund, unless required
        under applicable law.
      </p>
      <p>For complaints raised within 2 hours, the product must be:</p>
      <PolicyList
        items={[
          'Stored at the recommended temperature;',
          'Not consumed, eaten, altered, cooked, washed, mixed, or used;',
          'Preserved in original condition for inspection;',
          'Supported with proof such as order ID, bill/invoice, photos, videos, payment confirmation, and delivery details.',
        ]}
      />
      <p>
        If the product has been consumed, cooked, improperly stored, altered, damaged after delivery, or is
        unavailable for inspection, the complaint may be rejected after verification.
      </p>

      <PolicyHeading>B. Fresh and Perishable Product Disclaimer</PolicyHeading>
      <p>
        All meat, poultry, eggs, ready-to-eat items, and similar food products sold by Porville are perishable.
      </p>
      <p>Porville is not responsible for product deterioration caused by:</p>
      <PolicyList
        items={[
          'Delay in receiving the order by the customer;',
          'Incorrect address or unavailable customer;',
          'Improper storage after delivery;',
          'Cooking, reheating, washing, or handling after delivery;',
          'Complaint raised after the allowed complaint window.',
        ]}
      />

      <PolicyHeading>C. Cash on Delivery Dispatch &amp; Cancellation Policy</PolicyHeading>
      <p>
        For COD orders, customers should cancel before preparation / dispatch if they no longer want the order.
      </p>
      <p>
        Once a COD order is prepared, packed, or dispatched, cancellation may not be accepted except in genuine
        cases like wrong order details, unavoidable emergency, or delivery issue.
      </p>
      <p>If a customer cancels or refuses a COD order after dispatch, Porville may:</p>
      <PolicyList
        items={[
          'Recover reasonable delivery, packaging, and handling charges where applicable;',
          'Restrict or disable COD for future orders;',
          'Require advance payment for future purchases;',
          'Cancel repeated COD orders in case of misuse, fake orders, or repeated refusals.',
        ]}
      />

      <PolicyHeading>D. Prepaid Order Cancellation and Refund Policy</PolicyHeading>
      <p>
        All prepaid orders placed through Razorpay or any online payment gateway are considered confirmed once
        payment is successful and the order is placed.
      </p>
      <p>
        Once a prepaid order is confirmed, especially for fresh / perishable products, cancellation may not be
        accepted if the order has been prepared, packed, or dispatched.
      </p>
      <p>Refund, replacement, or store credit may be considered only in genuine verified cases:</p>
      <PolicyList
        items={[
          'Non-delivery due to reasons attributable to Porville;',
          'Wrong product delivered;',
          'Product received spoiled, damaged, or defective, subject to verification;',
          'Duplicate payment or payment gateway error;',
          'Any situation where a refund is required under applicable law.',
        ]}
      />
      <p>
        A customer cannot claim a refund only because they changed their mind after successful payment / order
        confirmation, unless cancellation is accepted before preparation or dispatch.
      </p>
      <p>
        Razorpay is only the payment gateway. Refund approval / rejection will be governed by Porville policy,
        subject to applicable law.
      </p>

      <PolicyHeading>E. Refund Processing</PolicyHeading>
      <p>If a refund is approved after verification, it may be processed through:</p>
      <PolicyList
        items={[
          'Original payment method;',
          'Store credit;',
          'Coupon;',
          'Wallet credit;',
          'Any other mode decided by Porville depending on the case.',
        ]}
      />
      <p>Refund processing time may depend on the payment gateway, bank, or service provider.</p>
    </PolicyLayout>
  );
}
