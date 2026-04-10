# Assets

Thư mục này dùng để lưu **tài nguyên tĩnh** (ảnh, font, icon...) và được phục vụ trực tiếp qua URL.

## Cấu trúc gợi ý

- `public/assets/images/` ảnh (jpg/png/webp/svg)
- `public/assets/icons/` icon (svg/png)
- `public/assets/fonts/` font (woff2/woff/ttf)

## Cách dùng

- Ảnh/Icon: dùng đường dẫn bắt đầu bằng `/`
  - Ví dụ: `/assets/images/banner.webp`
  - Ví dụ: `/assets/icons/logo.svg`
- Font: lưu file vào `public/assets/fonts/` rồi khai báo trong CSS (nếu dùng `@font-face`)

