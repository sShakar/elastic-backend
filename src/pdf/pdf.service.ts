import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Client } from '@elastic/elasticsearch';
import { lastValueFrom } from 'rxjs';
import * as pdfParse from 'pdf-parse';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as process from 'node:process';
import * as FormData from 'form-data';
import * as path from 'node:path';

@Injectable()
export class PdfService {
	private readonly esClient: Client;
	constructor(private httpService: HttpService) {
		this.esClient = new Client({
			node: process.env.ELASTIC_SEARCH_ENDPOINT,
			cloud: {
				id: process.env.ELASTIC_CLOUD_ID
			},
			auth: {
				apiKey: {
					id: process.env.ELASTIC_API_KEY_ID,
					api_key: process.env.ELASTIC_API_KEY
				}
			}
		});
	}

	async extractText(filePath: string): Promise<string> {
		const dataBuffer = fs.readFileSync(filePath);
		const parsed = await pdfParse(dataBuffer);
		return parsed.text;
	}

	async indexPdf(filePath: string, title: string): Promise<any> {
		const content = await this.extractTableFromPdf(filePath);
		const id = uuidv4();
		const document = {
			id,
			title,
			content,
			filename: filePath,
			uploadDate: new Date()
		};
		return this.esClient.index({
			index: 'pdf_index',
			id,
			body: document
		});
	}

	async searchPdf(query: string): Promise<any> {
		return this.esClient.search({
			index: 'pdf_index',
			body: {
				size: 100,
				query: {
					match: {
						content: query
					}
				},
				highlight: {
					fields: {
						content: {}
					}
				}
			}
		});
	}

	async extractTableFromPdf(pdfPath: string): Promise<any> {
		const filePath = path.resolve(pdfPath);
		const fileStream = fs.createReadStream(filePath);
		const formData = new FormData();
		formData.append('file', fileStream);
		try {
			const response = await lastValueFrom(
				this.httpService.post('https://elastic-pyscript.onrender.com/extract', formData, {
					headers: {
						...formData.getHeaders()
					}
				})
			);

			const parsedArray = response.data;
			const flatArray = [];

			parsedArray.forEach(page => page.table.forEach(row => flatArray.push(row[12].split('').reverse().join(''))));

			return flatArray;
		} catch (error) {
			throw new HttpException(`Failed to extract table: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getAllIndexedPdfs(): Promise<any> {
		return this.esClient.search({
			index: 'pdf_index',
			body: {
				size: 100,
				query: {
					match_all: {}
				}
			}
		});
	}

	async deleteAllDocuments(): Promise<any> {
		return this.esClient.deleteByQuery({
			index: 'pdf_index',
			body: {
				query: {
					match_all: {}
				}
			}
		});
	}
}
