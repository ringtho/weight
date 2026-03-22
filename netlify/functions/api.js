const serverless = require('serverless-http');
const { app, connectDB } = require('../../server/app.cjs');

const handler = serverless(app);

exports.handler = async (event, context) => {
  // Prevent Lambda from waiting for the MongoDB connection to close
  context.callbackWaitsForEmptyEventLoop = false;
  await connectDB();
  return handler(event, context);
};
