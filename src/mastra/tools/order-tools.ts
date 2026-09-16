import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const getOrderTool = createTool({
  id: 'getOrder',
  description:
    'Get the status and details of an order. Use this tool whenever the user asks about an order, order status, delivery date, or customer information. Pass the order ID as orderId.',

  inputSchema: z.object({
    orderId: z.number().describe('The ID of the order'),
  }),

  execute: async ({ orderId }) => {
    console.log(`Executing getOrder(${orderId})`);

    return {
      orderId,
      status: 'shipped',
      expectedDelivery: 'September 5',
      customerId: 42,
    };
  },
});

export const getCustomerTool = createTool({
  id: 'getCustomer',
  description:
    'Get customer details using a customer ID. Use this when customer information is needed.',

  inputSchema: z.object({
    customerId: z.number().describe('The ID of the customer'),
  }),

  execute: async ({ customerId }) => {
    console.log(`Executing getCustomer(${customerId})`);

    if (customerId !== 42) {
      throw new Error(`Customer ${customerId} not found`);
    }

    return {
      customerId: 42,
      name: 'John',
      email: 'john@example.com',
    };
  },
});