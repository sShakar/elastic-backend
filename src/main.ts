import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CacheControlInterceptor } from '@/common/interceptors/cache-control.interceptor';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors({
		origin: '*',
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
		allowedHeaders: 'Content-Type, Accept, Cache-Control, Pragma, Expires'
	});
	app.useGlobalInterceptors(new CacheControlInterceptor());
	await app.listen(3000);
}
bootstrap().finally();
