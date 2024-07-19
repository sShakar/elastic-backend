import { Controller, Post, Get, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('pdf')
export class PdfController {
	constructor(private readonly pdfService: PdfService) {}

	@Post('upload')
	@UseInterceptors(
		FileInterceptor('file', {
			storage: diskStorage({
				destination: './uploads',
				filename: (req, file, cb) => {
					const randomName = Array(32)
						.fill(null)
						.map(() => Math.round(Math.random() * 16).toString(16))
						.join('');
					cb(null, `${randomName}${extname(file.originalname)}`);
				}
			})
		})
	)
	async uploadPdf(@UploadedFile() file: Express.Multer.File) {
		const title = file.originalname;
		return this.pdfService.indexPdf(file.path, title);
	}

	@Get('search')
	async searchPdf(@Body('query') query: string) {
		return this.pdfService.searchPdf(query);
	}
}
