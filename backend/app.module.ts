import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { AppConfigService } from './config/config.service';
import { SearchModule } from './search/search.module';
import { PlaylistModule } from './playlist/playlist.module';
import { UsersModule } from './users/users.module';
import configuration from './config/configuration';
import { validate } from './config/config.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      envFilePath: ['.env.development', '.env'],
    }),
    SearchModule,
    PlaylistModule,
    UsersModule,
  ],
  controllers: [],
  providers: [PrismaService, AppConfigService],
  exports: [AppConfigService],
})
export class AppModule {}
