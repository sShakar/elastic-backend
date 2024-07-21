import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';

@Module({
	imports: [HttpModule],
	providers: [PdfService],
	controllers: [PdfController]
})
export class PdfModule {}
