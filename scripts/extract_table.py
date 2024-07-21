import sys
import json
import pdfplumber

def extract_table_from_pdf(pdf_path):
    result = []
    with pdfplumber.open(pdf_path) as pdf:
        for page_number, page in enumerate(pdf.pages):
            tables = page.extract_tables()
            for table in tables:
                table_data = []
                for row in table:
                    table_data.append(row)
                result.append({
                    'page': page_number + 1,
                    'table': table_data
                })
    return result

if __name__ == "__main__":
    pdf_path = sys.argv[1]
    extracted_data = extract_table_from_pdf(pdf_path)
    print(json.dumps(extracted_data))
