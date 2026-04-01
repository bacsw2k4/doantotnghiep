# mcpserver/rag/policy_store.py
import re
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS

# map keyword -> category/section ưu tiên
CATEGORY_HINTS = [
    (re.compile(r"(giao hàng|vận chuyển|ship|cod|phí ship|miễn phí ship|hải đảo|hẹn giờ|giao nhanh|thời gian giao)", re.I),
     {"prefer_category": "giao_hang", "prefer_section": "shipping_policy"}),
    (re.compile(r"(thanh toán|chuyển khoản|nội dung chuyển khoản|tài khoản ngân hàng|trả góp|0%|momo|zalopay|vnpay|thẻ tín dụng|cod|phí thu hộ)", re.I),
     {"prefer_category": "thanh_toan", "prefer_section": "payment_policy"}),
    (re.compile(r"(đổi trả|hoàn tiền|khiếu nại|refund|không ưng ý|đổi ý|trả hàng)", re.I),
     {"prefer_category": "doi_tra", "prefer_section": "return_refund_policy"}),
    (re.compile(r"(bảo hành|1 đổi 1|bảo hành vàng|serial|kỹ thuật|sửa chữa)", re.I),
     {"prefer_category": "bao_hanh", "prefer_section": "warranty_policy"}),
    (re.compile(r"(địa chỉ|showroom|chi nhánh|hotline|giờ làm việc|liên hệ|zalo|facebook)", re.I),
     {"prefer_category": "lien_he", "prefer_section": "contact_information"}),
    (re.compile(r"(bảo mật|quyền riêng tư|xóa dữ liệu|privacy|email privacy)", re.I),
     {"prefer_category": "bao_mat", "prefer_section": "privacy_policy"}),
]

def detect_hint(question: str):
    for rx, hint in CATEGORY_HINTS:
        if rx.search(question):
            return hint
    return {"prefer_category": None, "prefer_section": None}

class PolicyStore:
    def __init__(self):
        self.embeddings = GoogleGenerativeAIEmbeddings(model="text-embedding-004")
        self.db = FAISS.load_local(
            "rag_store",
            self.embeddings,
            allow_dangerous_deserialization=True
        )

    def _score(self, dist: float) -> float:
        # dist càng nhỏ càng tốt
        return 1.0 / (1.0 + float(dist))

    def query(self, question: str, k: int = 10):
        hint = detect_hint(question)

        augmented = question
        if hint["prefer_category"]:
            extra = {
                "giao_hang": "chính sách giao hàng, phí vận chuyển, miễn phí ship từ 5 triệu, thời gian giao, hải đảo",
                "thanh_toan": "chính sách thanh toán, nội dung chuyển khoản, mã đơn hàng + họ tên, tài khoản ngân hàng Vietcombank Techcombank, trả góp 0%, kỳ hạn 24 tháng",
                "doi_tra": "chính sách đổi trả, không ưng ý 7 ngày, lỗi kỹ thuật 30 ngày, điều kiện seal nguyên hộp",
                "bao_hanh": "chính sách bảo hành, iPhone 24 tháng, 1 đổi 1 trong 30 ngày, lỗi phần cứng",
                "lien_he": "hotline 1900 636 999, phí gọi 3000đ/phút, showroom Hà Nội TP.HCM, giờ làm việc",
                "bao_mat": "bảo mật thông tin, xóa dữ liệu cá nhân, email privacy@shoppingstore.com.vn, xử lý 7 ngày"
            }.get(hint["prefer_category"], "")
            augmented = f"{question} {extra}"

        results = self.db.similarity_search_with_score(augmented, k=k)

        ranked = []
        for doc, dist in results:
            base_score = 1.0 / (1.0 + float(dist))
            md = doc.metadata or {}
            sec_id = md.get("section_id", "")
            cat = md.get("category", "")

            boost = 1.0
            if hint["prefer_section"] and sec_id == hint["prefer_section"]:
                boost *= 1.5   # tăng boost
            if hint["prefer_category"] and cat == hint["prefer_category"]:
                boost *= 1.35

            final_score = base_score * boost
            ranked.append((final_score, base_score, doc))

        ranked.sort(key=lambda x: x[0], reverse=True)

        matches = []
        best = 0.0
        for final, base, doc in ranked[:6]:  # lấy 6 thay vì 5
            best = max(best, final)
            md = doc.metadata or {}
            matches.append({
                "score": round(float(final), 4),
                "base_score": round(float(base), 4),
                "section_id": md.get("section_id", ""),
                "category": md.get("category", ""),
                "priority": int(md.get("priority", 9)),
                "text": doc.page_content
            })

        return {
            "confidence": round(float(best), 4),
            "hint_used": bool(hint["prefer_category"]),
            "matches": matches
        }