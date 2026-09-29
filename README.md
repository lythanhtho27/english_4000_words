# Ứng Dụng Ôn Tập Từ Vựng 4000 Essential English Words (Offline 100%)

Trang web ôn tập từ vựng tiếng Anh chạy **hoàn toàn trực tiếp trên trình duyệt** (Offline 100%, không cần cài đặt server hay backend), xây dựng dựa trên trọn bộ dữ liệu **6 Sách** và **180 Bài học (Units)** từ bộ sách *4000 Essential English Words*.

---

## ⚡ Các Điểm Nổi Bật

1. **Không Cần Server**:
   - Mở trực tiếp bằng cách nhấp đúp vào file **[`start_website.bat`](file:///d:/Tho/English/4000%20Essential%20English%20Words%20pdf/english_4000_words/start_website.bat)** hoặc file **[`index.html`](file:///d:/Tho/English/4000%20Essential%20English%20Words%20pdf/english_4000_words/index.html)**.
   - Toàn bộ 3,601 từ vựng đã được đóng gói sẵn trong file `js/data.js`, đảm bảo chạy mượt mà ngay cả khi không có mạng.

2. **Chỉ Lưu Cài Đặt (Settings) Vào `localStorage`**:
   - Không lưu vết lịch sử người dùng hay database cồng kềnh.
   - Chỉ lưu: Chế độ Sáng / Tối, Giọng phát âm (US/UK), Tốc độ đọc (0.7x – 1.3x), Âm thanh hiệu ứng và Vị trí bài học xem gần nhất.

---

## 🎮 Hệ Thống 8 Trò Chơi Ôn Tập Đa Dạng (Games Hub)

Nhấn vào nút **"🎮 Khu Vực Trò Chơi"** trên thanh menu hoặc nút Game trong từng Unit để trải nghiệm 8 trò chơi:

1. **🔤 Word Scramble (Xáo Chữ Ghép Từ)**:
   - Các chữ cái trong từ tiếng Anh bị đảo lộn. Người chơi nhấp hoặc gõ phím để ghép lại đúng chính tả. Có nút nghe phát âm và gợi ý chữ cái.
2. **🌧️ Falling Words (Mưa Từ Vựng - Thử Thách Phản Xạ)**:
   - Từ vựng rơi dần từ trên đỉnh màn hình xuống đáy. Bạn phải chọn nhanh nghĩa tiếng Việt tương ứng trước khi từ chạm vạch nguy hiểm. Có 3 mạng (❤️❤️❤️) và hệ số nhân điểm Combo.
3. **🎧 Audio Balloon Pop (Bắt Từ Bằng Tai / Bắn Bong Bóng)**:
   - Trò chơi rèn luyện kỹ năng nghe: Hệ thống phát âm từ bí mật. Bạn bấm nổ đúng quả bóng bay có nghĩa tương ứng để ghi điểm.
4. **🧩 Sentence Builder (Sắp Xếp Câu Ví Dụ)**:
   - Dựa vào câu dịch tiếng Việt, sắp xếp các khối từ tiếng Anh thành một câu ví dụ hoàn chỉnh theo đúng ngữ pháp. Tự động đọc câu khi ghép đúng!
5. **⚡ True or False? (Đúng Hay Sai - Quyết Định 3 Giây)**:
   - Đưa ra cặp từ tiếng Anh - nghĩa tiếng Việt. Bạn có 3 giây đếm ngược để quyết định chớp nhoáng cặp đó là ĐÚNG (✓) hay SAI (✕). Hỗ trợ phím tắt `1`, `2` hoặc phím mũi tên.
6. **📰 Mini Crossword (Ô Chữ Mini Theo Unit)**:
   - Giải ô chữ đan xen với các manh mối là nghĩa tiếng Việt và định nghĩa tiếng Anh. Tự động kiểm tra và có nút gợi ý.
7. **✍️ Luyện Gõ Từ & Điền (Spelling Practice)**:
   - Nhìn nghĩa và nghe phát âm để gõ lại từ tiếng Anh, có ô gợi ý ký tự.
8. **⚡ Game Nối Cặp Từ (Match Game)**:
   - Nối nhanh các cặp từ tiếng Anh và nghĩa tiếng Việt tương ứng trên bảng ô lưới.

---

## 📖 Các Chế Độ Học Khác
- **Học Từ Vựng (Vocabulary List)**: Xem danh sách từ đầy đủ phát âm, định nghĩa, ví dụ; có nút **"Ẩn nghĩa tiếng Việt để tự ôn"**.
- **Thẻ Ghi Nhớ 3D (Flashcards)**: Lật thẻ 3 chiều, hỗ trợ phím tắt (`Space`, `←`, `→`, `1`, `2`, `R`).
- **Trắc Nghiệm 4 Đáp Án (Quiz)**: Tự tạo đề 4 dạng câu hỏi với âm thanh phản hồi và tính năng làm lại câu sai.
- **Tra Cứu Tức Thì (`Ctrl + K`)**: Tìm kiếm mọi từ vựng theo tiếng Anh hoặc tiếng Việt.

---

## 📁 Cấu Trúc File Dự Án

```
english_4000_words/
├── index.html              # Trang web chính (chạy trực tiếp không cần server)
├── start_website.bat       # Phím tắt nhấp đúp mở nhanh trang web
├── README.md               # Tài liệu hướng dẫn sử dụng
│
├── css/
│   └── style.css           # Hiệu ứng 3D lật thẻ, animation bong bóng, Dark mode
│
├── js/
│   ├── data.js             # Dữ liệu 3,601 từ vựng của 6 quyển sách
│   ├── storage.js          # Quản lý cài đặt trong localStorage
│   ├── audio.js            # Trình phát âm bản xứ (US / UK) và hiệu ứng âm thanh
│   ├── flashcard.js        # Logic thẻ Flashcard 3D
│   ├── quiz.js             # Logic trắc nghiệm 4 đáp án
│   ├── spelling.js         # Logic luyện gõ từ
│   ├── match.js            # Logic game nối cặp từ
│   ├── game_scramble.js    # [Mới] Logic game Xáo Chữ Ghép Từ
│   ├── game_falling.js     # [Mới] Logic game Mưa Từ Vựng
│   ├── game_balloon.js     # [Mới] Logic game Bắn Bong Bóng Luyện Nghe
│   ├── game_sentence.js    # [Mới] Logic game Sắp Xếp Câu Ví Dụ
│   ├── game_truefalse.js   # [Mới] Logic game Đúng Hay Sai 3 Giây
│   ├── game_crossword.js   # [Mới] Logic game Ô Chữ Mini
│   └── app.js              # Điều hướng giao diện và Khu Vực Trò Chơi
│
└── data/
    └── vocabulary_all.json # File JSON dữ liệu tổng hợp
```
