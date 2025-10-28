export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || '',
  },
  mongodb: {
    host: process.env.MONGODB_HOST || 'localhost',
    port: parseInt(process.env.MONGODB_PORT || '27017', 10),
    database: process.env.MONGODB_DB || 'hackify_db',
    username: process.env.MONGODB_USER || '',
    password: process.env.MONGODB_PASSWORD || '',
  },
  appUrl: process.env.APP_URL || 'http://localhost:5173',
});
