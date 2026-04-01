import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from rag.kb_parser import parse_kb
KB_PATH = "data/sanshin_knowledge_base.md"  # sửa nếu tên file khác
OUT_DIR = "rag_store"
def main():
    os.makedirs(OUT_DIR,exist_ok=True)
    with open(KB_PATH,"r",encoding="utf-8") as f:
        raw=f.read()

    sections=parse_kb(raw)
    splitter=RecursiveCharacterTextSplitter(
            chunk_size=1400,
            chunk_overlap=350,
            separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""]
        )
    texts = []
    metas = []
    for sec in sections:
        if not sec.section_id:
            continue  # bỏ section không có id
        chunks = splitter.split_text(sec.content)
        for i, chunk in enumerate(chunks):
            # Prefix rõ ràng, dễ match semantic
            prefix = f"Section: {sec.section_id} | Category: {sec.category} | Priority: {sec.priority} | "
            texts.append(prefix + chunk)
            metas.append({
                "section_id": sec.section_id,
                "category": sec.category,
                "priority": sec.priority,
                "chunk_index": i,
                "content_length": len(chunk)
            })

    embeddings = GoogleGenerativeAIEmbeddings(model="text-embedding-004")

    db = FAISS.from_texts(texts, embeddings, metadatas=metas)
    db.save_local(OUT_DIR)

    print(f"✅ Built FAISS index với {len(texts)} chunks từ {len(sections)} sections")

if __name__ == "__main__":
    main()