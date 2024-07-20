import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const response = context.switchToHttp().getResponse();
		response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
		response.setHeader('Pragma', 'no-cache');
		response.setHeader('Expires', '0');
		response.removeHeader('ETag');
		response.removeHeader('Last-Modified');

		return next.handle().pipe(
			tap(() => {
				// Additional logging or operations can be performed here
			})
		);
	}
}
