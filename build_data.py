import json
import sys
import os
import re

sys.stdout.reconfigure(encoding='utf-8')

workspace = os.path.dirname(os.path.abspath(__file__))

book_configs = [
    {
        "book": 1,
        "filename": "4000_essential_english_words_book1.json",
        "title": "4000 Essential English Words - Book 1",
        "level": "A2 - Elementary",
        "color": "emerald",
        "badge": "Book 1",
        "desc": "Cơ bản - Những từ vựng cốt lõi đầu tiên dành cho người mới bắt đầu."
    },
    {
        "book": 2,
        "filename": "book2_complete_vocabulary.json",
        "title": "4000 Essential English Words - Book 2",
        "level": "B1 - Pre-Intermediate",
        "color": "sky",
        "badge": "Book 2",
        "desc": "Tiền trung cấp - Nâng cao vốn từ diễn đạt giao tiếp và miêu tả thường ngày."
    },
    {
        "book": 3,
        "filename": "4000_essential_english_words_book_3.json",
        "title": "4000 Essential English Words - Book 3",
        "level": "B1+ - Intermediate",
        "color": "indigo",
        "badge": "Book 3",
        "desc": "Trung cấp - Từ vựng đa dạng về học thuật, hành động và ngữ cảnh phong phú."
    },
    {
        "book": 4,
        "filename": "4000_essential_english_words_book_4.json",
        "title": "4000 Essential English Words - Book 4",
        "level": "B2 - Upper-Intermediate",
        "color": "amber",
        "badge": "Book 4",
        "desc": "Trung cao cấp - Từ vựng trừu tượng, tư duy phân tích và chủ đề chuyên sâu."
    },
    {
        "book": 5,
        "filename": "tu_vung_4000_essential_english_words_book_5-v5.json",
        "title": "4000 Essential English Words - Book 5",
        "level": "C1 - Advanced",
        "color": "rose",
        "badge": "Book 5",
        "desc": "Nâng cao - Vốn từ phong phú phục vụ đọc hiểu nâng cao và các kỳ thi quốc tế."
    },
    {
        "book": 6,
        "filename": "tu_vung_4000_essential_english_words_book_6-v5.json",
        "title": "4000 Essential English Words - Book 6",
        "level": "C1+ / C2 - Mastery",
        "color": "purple",
        "badge": "Book 6",
        "desc": "Thành thạo - Làm chủ những từ vựng tinh tế và học thuật chuyên sâu nhất."
    }
]

output_dir = os.path.join(workspace, "data")
os.makedirs(output_dir, exist_ok=True)

all_books_data = []
all_words_flat = []

for cfg in book_configs:
    filepath = os.path.join(workspace, cfg["filename"])
    if not os.path.exists(filepath):
        print(f"Warning: {filepath} not found!")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        raw = json.load(f)
        
    units_raw = raw.get('units')
    unit_list = []
    
    if isinstance(units_raw, list):
        for idx, u in enumerate(units_raw):
            u_num = u.get('unit') or u.get('unit_number') or (idx + 1)
            words = u.get('words') or u.get('vocabulary') or []
            unit_list.append((int(u_num), words))
    elif isinstance(units_raw, dict):
        for u_key, words in units_raw.items():
            m = re.search(r'\d+', str(u_key))
            u_num = int(m.group()) if m else len(unit_list) + 1
            if isinstance(words, dict):
                words = words.get('words') or words.get('vocabulary') or []
            unit_list.append((u_num, words))
            
    unit_list.sort(key=lambda x: x[0])
    
    processed_units = []
    book_word_count = 0
    
    for u_num, raw_words in unit_list:
        processed_words = []
        for w_idx, w in enumerate(raw_words):
            word_str = (w.get('word') or w.get('vocabulary') or '').strip()
            meaning_str = (
                w.get('translation') or 
                w.get('meaning_vi') or 
                w.get('translation_vi') or 
                w.get('vietnamese_meaning') or 
                ''
            ).strip()
            
            def_en = (w.get('definition_en') or w.get('english_definition') or '').strip()
            def_vi = (w.get('definition_vi') or w.get('vietnamese_definition') or '').strip()
            ex_en = (w.get('example_en') or w.get('english_example') or '').strip()
            ex_vi = (w.get('example_vi') or w.get('vietnamese_example') or '').strip()
            pos = (w.get('pos') or '').strip()
            
            word_obj = {
                'id': f"b{cfg['book']}_u{u_num}_w{w_idx+1}",
                'book': cfg['book'],
                'unit': u_num,
                'order': w_idx + 1,
                'word': word_str,
                'meaning': meaning_str,
                'def_en': def_en,
                'def_vi': def_vi,
                'example_en': ex_en,
                'example_vi': ex_vi
            }
            if pos:
                word_obj['pos'] = pos
                
            processed_words.append(word_obj)
            all_words_flat.append(word_obj)
            book_word_count += 1
            
        processed_units.append({
            'unit': u_num,
            'title': f"Unit {u_num}",
            'word_count': len(processed_words),
            'words': processed_words
        })
        
    book_info = {
        'book': cfg['book'],
        'title': cfg['title'],
        'level': cfg['level'],
        'color': cfg['color'],
        'badge': cfg['badge'],
        'desc': cfg['desc'],
        'total_units': len(processed_units),
        'total_words': book_word_count,
        'units': processed_units
    }
    all_books_data.append(book_info)
    print(f"Processed Book {cfg['book']}: {len(processed_units)} units, {book_word_count} words.")

final_payload = {
    'total_books': len(all_books_data),
    'total_words': len(all_words_flat),
    'generated_at': '2026-09-29',
    'books': all_books_data
}

# 1. Write clean JSON
json_path = os.path.join(output_dir, "vocabulary_all.json")
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(final_payload, f, ensure_ascii=False, indent=2)
print(f"Saved JSON: {json_path} ({os.path.getsize(json_path) / 1024:.1f} KB)")

# 2. Write Javascript bundle for direct file:/// loading
js_path = os.path.join(workspace, "js", "data.js")
os.makedirs(os.path.dirname(js_path), exist_ok=True)
with open(js_path, 'w', encoding='utf-8') as f:
    f.write("// Auto-generated unified vocabulary data for 4000 Essential English Words\n")
    f.write("window.VOCABULARY_DATA = ")
    json.dump(final_payload, f, ensure_ascii=False)
    f.write(";\n")
print(f"Saved JS: {js_path} ({os.path.getsize(js_path) / 1024:.1f} KB)")

print(f"Total books: {len(all_books_data)}, total words: {len(all_words_flat)}")
