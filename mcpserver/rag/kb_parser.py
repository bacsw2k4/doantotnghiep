import re
from dataclasses import dataclass
from typing import List

@dataclass
class KBSection:
    section_id: str = ""
    category: str = ""
    priority: int = 9
    content: str = ""

def parse_kb(text: str) -> List[KBSection]:#file kb.md
    sections = [] # chua ket qua
    lines = text.splitlines()#tach tung dong
    i = 0 # con tro dong
    current = None #section hien tai

    while i < len(lines):
        line = lines[i].strip()

        # Phát hiện bắt đầu section mới
        if line.startswith("[SECTION]"):
            if current:#neu dang co section cu 
                current.content = current.content.strip()#luu lai
                if current.content:  # chỉ append nếu có nội dung
                    sections.append(current)

            current = KBSection()#tao section moi
            i += 1
            # Đọc metadata ngay sau [SECTION]
            while i < len(lines):
                line = lines[i].strip()
                if not line or line.startswith("#") or line.startswith("=="):
                    break
                if ":" in line:
                    key, value = [x.strip() for x in line.split(":", 1)]
                    if key == "id":
                        current.section_id = value
                    elif key == "category":
                        current.category = value
                    elif key == "priority":
                        try:
                            current.priority = int(value)
                        except ValueError:
                            pass
                i += 1
            continue

        # Thu thập nội dung
        if current is not None:
            current.content += lines[i] + "\n"
        i += 1

    # Append section cuối
    if current and current.content.strip():
        current.content = current.content.strip()
        sections.append(current)

    print(f"Parsed {len(sections)} sections:")
    for s in sections[:5]:  # debug 5 section đầu
        print(f"  - {s.section_id} | {s.category} | priority {s.priority} | content len: {len(s.content)}")

    return sections



