import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import * as pdfParse from 'pdf-parse';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as process from 'node:process';
import * as path from 'node:path';
import { promisify } from 'util';
import { execFile } from 'child_process';

const execFileAsync = promisify(execFile);

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
		const scriptPath = path.join(__dirname, '../../scripts/extract_table.py');
		try {
			const { stdout, stderr } = await execFileAsync('python', [scriptPath, pdfPath]);
			if (stderr) throw new HttpException(`Error extracting table: ${stderr}`, HttpStatus.INTERNAL_SERVER_ERROR);

			return JSON.parse(stdout);
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
