import {
	Controller,
	Post,
	Get,
	Body,
	UploadedFile,
	UseInterceptors,
	Delete,
	HttpException,
	HttpStatus
} from '@nestjs/common';
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
					const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
					cb(null, `${randomName}${extname(originalName)}`);
				}
			})
		})
	)
	async uploadPdf(@UploadedFile() file: Express.Multer.File) {
		if (!file) throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);

		const title = Buffer.from(file.originalname, 'latin1').toString('utf8');
		return await this.pdfService.indexPdf(file.path, title);
	}

	@Post('search')
	async searchPdf(@Body('query') query: string) {
		if (!query) throw new HttpException('Query must be provided', HttpStatus.BAD_REQUEST);
		return this.pdfService.searchPdf(query);
	}

	@Get('all')
	async getAllIndexedPdfs() {
		return this.pdfService.getAllIndexedPdfs();
	}

	@Delete('delete-all')
	async deleteAllDocuments() {
		return this.pdfService.deleteAllDocuments();
	}
}
