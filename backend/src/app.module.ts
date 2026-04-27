import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { BranchesModule } from './modules/branches/branches.module';
import { TablesModule } from './modules/tables/tables.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DiscountsModule } from './modules/discounts/discounts.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuditModule } from './modules/audit/audit.module';
import { UploadModule } from './modules/upload/upload.module';
import { QrModule } from './modules/qr/qr.module';
import { MenuModule } from './modules/menu/menu.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { ClientModule } from './modules/client/client.module';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: +config.get('DB_PORT'),
        database: config.get('DB_NAME'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: config.get('NODE_ENV') === 'development',
        dropSchema: config.get('DB_DROP_SCHEMA') === 'true',
        logging: config.get('NODE_ENV') === 'development',
        ssl: config.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<any> => {
        const redisHost = config.get('REDIS_HOST');
        if (redisHost) {
          try {
            const { redisStore } = await import('cache-manager-redis-yet');
            return {
              store: await redisStore({
                socket: { host: redisHost, port: +(config.get('REDIS_PORT') || 6379) },
                password: config.get('REDIS_PASSWORD') || undefined,
                ttl: 60 * 5,
              }),
            };
          } catch {
            console.warn('Redis unavailable, falling back to in-memory cache');
          }
        }
        return { ttl: 60 * 5 };
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: +config.get('THROTTLE_TTL', 60),
            limit: +config.get('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),
    AuthModule,
    UsersModule,
    TenantsModule,
    BranchesModule,
    TablesModule,
    CategoriesModule,
    ProductsModule,
    InventoryModule,
    OrdersModule,
    PaymentsModule,
    DiscountsModule,
    ReportsModule,
    NotificationsModule,
    SubscriptionsModule,
    SettingsModule,
    AuditModule,
    UploadModule,
    QrModule,
    MenuModule,
    RatingsModule,
    ClientModule,
  ],
})
export class AppModule {}
