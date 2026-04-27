import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'buyurtma24',
  username: process.env.DB_USER || 'buyurtma24_user',
  password: process.env.DB_PASSWORD || 'password',
}));
