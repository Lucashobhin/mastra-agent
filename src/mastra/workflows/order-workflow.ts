import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { getOrderTool, getCustomerTool } from '../tools/order-tools';

const getOrderStep = createStep({
  id: 'get-order',
  description: 'Fetch the order details.',

  inputSchema: z.object({
    orderId: z.number(),
  }),

  outputSchema: z.object({
    orderId: z.number(),
    status: z.string(),
    expectedDelivery: z.string(),
    customerId: z.number(),
  }),

  execute: async ({ inputData }) => {
    console.log(`Workflow: getting order ${inputData.orderId}`);

    return getOrderTool.execute(inputData);
  },
});


const getCustomerStep = createStep({
  id: 'get-customer',
  description: 'Fetch the customer associated with the order.',

  inputSchema: z.object({
    orderId: z.number(),
    status: z.string(),
    expectedDelivery: z.string(),
    customerId: z.number(),
  }),

  outputSchema: z.object({
    order: z.object({
      orderId: z.number(),
      status: z.string(),
      expectedDelivery: z.string(),
      customerId: z.number(),
    }),
    customer: z.object({
      customerId: z.number(),
      name: z.string(),
      email: z.string(),
    }),
  }),

  execute: async ({ inputData }) => {
    console.log(`Workflow: getting customer ${inputData.customerId}`);

    const customer = await getCustomerTool.execute({
      customerId: inputData.customerId,
    });

    return {
      order: inputData,
      customer,
    };
  },
});



export const orderCustomerWorkflow = createWorkflow({
  id: 'order-customer-workflow',
  description:
    'Gets an order and its customer. When calling this workflow, the arguments MUST be wrapped inside inputData, like { inputData: { orderId: 123 } }.',

  inputSchema: z.object({
    orderId: z.number(),
  }),

  outputSchema: z.object({
    order: z.object({
      orderId: z.number(),
      status: z.string(),
      expectedDelivery: z.string(),
      customerId: z.number(),
    }),

    customer: z.object({
      customerId: z.number(),
      name: z.string(),
      email: z.string(),
    }),
  }),
})
  .then(getOrderStep)
  .then(getCustomerStep)
  .commit();