import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PdfModule } from './pdf/pdf.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true
		}),
		ServeStaticModule.forRoot({
			rootPath: join(__dirname, '..', 'uploads'),
			serveRoot: '/uploads'
		}),
		PdfModule
	]
})
export class AppModule {}
