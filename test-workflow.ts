import { orderCustomerWorkflow } from './src/mastra/workflows/order-workflow';

const run = await orderCustomerWorkflow.createRun();

const result = await run.start({
  inputData: {
    orderId: 123,
  },
});

console.log('\nWORKFLOW RESULT:');
console.dir(result, { depth: null });