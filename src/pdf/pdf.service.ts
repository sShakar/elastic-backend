import { Injectable } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import * as pdfParse from 'pdf-parse';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as process from 'node:process';

@Injectable()
export class PdfService {
	private readonly esClient: Client;

	constructor() {
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
		const content = await this.extractText(filePath);
		const id = uuidv4();
		const document = {
			id,
			title,
			content,
			fileName: filePath,
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

	async getAllIndexedPdfs(): Promise<any> {
		return this.esClient.search({
			index: 'pdf_index',
			body: {
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
