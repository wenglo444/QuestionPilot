"""Document processing service — parse, extract text, and chunk documents."""

import os
import re
from typing import AsyncIterator, Optional

import pdfplumber
import docx
import openpyxl
import markdown
from bs4 import BeautifulSoup

from app.config import settings


class DocumentProcessor:
    """Handles parsing of uploaded documents and splitting into chunks."""

    SUPPORTED_TYPES = {"pdf", "docx", "xlsx", "xls", "md", "txt", "csv"}

    async def extract_text(self, file_path: str, file_type: str) -> str:
        """Extract text content from a file based on its type."""
        file_type = file_type.lower().lstrip(".")
        if file_type not in self.SUPPORTED_TYPES:
            raise ValueError(f"Unsupported file type: {file_type}")

        extractors = {
            "pdf": self._extract_pdf,
            "docx": self._extract_docx,
            "xlsx": self._extract_xlsx,
            "xls": self._extract_xlsx,
            "md": self._extract_markdown,
            "txt": self._extract_text,
            "csv": self._extract_csv,
        }

        extractor = extractors.get(file_type)
        if not extractor:
            raise ValueError(f"No extractor for file type: {file_type}")

        return await extractor(file_path)

    # ------------------------------------------------------------------
    # Individual extractors
    # ------------------------------------------------------------------

    async def _extract_pdf(self, file_path: str) -> str:
        """Extract text from PDF using pdfplumber."""
        text_parts = []
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    text_parts.append(f"--- Page {page_num} ---\n{page_text}")
        return "\n\n".join(text_parts)

    async def _extract_docx(self, file_path: str) -> str:
        """Extract text from DOCX using python-docx."""
        doc = docx.Document(file_path)
        paragraphs = []
        for para in doc.paragraphs:
            if para.text.strip():
                paragraphs.append(para.text)
        # Also extract tables
        for table in doc.tables:
            for row in table.rows:
                cells = [cell.text.strip() for cell in row.cells]
                paragraphs.append(" | ".join(cells))
        return "\n".join(paragraphs)

    async def _extract_xlsx(self, file_path: str) -> str:
        """Extract text from XLSX using openpyxl."""
        wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
        text_parts = []
        for sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            text_parts.append(f"--- Sheet: {sheet_name} ---")
            for row in ws.iter_rows(values_only=True):
                cells = [str(cell) if cell is not None else "" for cell in row]
                row_text = " | ".join(cells)
                if row_text.strip():
                    text_parts.append(row_text)
        return "\n".join(text_parts)

    async def _extract_markdown(self, file_path: str) -> str:
        """Extract text from Markdown by converting to HTML then stripping tags."""
        with open(file_path, "r", encoding="utf-8") as f:
            md_content = f.read()
        html = markdown.markdown(md_content)
        soup = BeautifulSoup(html, "html.parser")
        return soup.get_text(separator="\n")

    async def _extract_text(self, file_path: str) -> str:
        """Extract text from plain text files."""
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()

    async def _extract_csv(self, file_path: str) -> str:
        """Extract text from CSV files."""
        import csv
        text_parts = []
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.reader(f)
            for row in reader:
                text_parts.append(" | ".join(row))
        return "\n".join(text_parts)

    # ------------------------------------------------------------------
    # Chunking
    # ------------------------------------------------------------------

    def chunk_text(
        self,
        text: str,
        chunk_size: int | None = None,
        chunk_overlap: int | None = None,
    ) -> list[dict]:
        """Split text into overlapping chunks.

        Returns a list of dicts with keys: content, chunk_index, metadata.
        """
        chunk_size = chunk_size or settings.CHUNK_SIZE
        chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP

        if not text.strip():
            return []

        # Normalize whitespace
        text = re.sub(r"\s+", " ", text).strip()

        chunks = []
        start = 0
        text_len = len(text)
        index = 0

        while start < text_len:
            end = min(start + chunk_size, text_len)

            # Try to break at sentence or paragraph boundary
            if end < text_len:
                # Look backwards for a period or newline
                for sep in ["\n\n", "\n", ". ", "! ", "? "]:
                    pos = text.rfind(sep, start, end)
                    if pos > start + chunk_size // 2:
                        end = pos + len(sep)
                        break

            chunk_content = text[start:end].strip()
            if chunk_content:
                chunks.append({
                    "content": chunk_content,
                    "chunk_index": index,
                    "metadata": {
                        "char_start": start,
                        "char_end": end,
                    },
                })
                index += 1

            # Move start position with overlap
            start = end - chunk_overlap if end < text_len else text_len

        return chunks

    async def process_document(
        self,
        file_path: str,
        file_type: str,
        metadata: dict | None = None,
    ) -> list[dict]:
        """Full pipeline: extract text, chunk, and return chunks with metadata."""
        text = await self.extract_text(file_path, file_type)
        chunks = self.chunk_text(text)

        # Add document-level metadata to each chunk
        base_metadata = metadata or {}
        for chunk in chunks:
            chunk["metadata"].update(base_metadata)

        return chunks