-- SETUP SUPABASE DATABASE
-- LÃ m theo cÃ¡c bÆ°á»›c nÃ y trong SQL Editor cá»§a Supabase

-- ============================================
-- BÆ¯á»šC 1: Táº¡o báº£ng software_submissions
-- ============================================

CREATE TABLE IF NOT EXISTS software_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  version VARCHAR(50),
  image_url TEXT,
  download_url TEXT,
  download_url_2 TEXT,
  install_guide TEXT,
  video_url TEXT,
  install_images JSONB DEFAULT '[]'::jsonb,
  uploaded_by UUID REFERENCES auth.users(id),
  rating FLOAT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  views INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nếu table đã tồn tại, chạy thêm:
-- ALTER TABLE software_submissions ADD COLUMN IF NOT EXISTS download_url_2 TEXT;
-- ALTER TABLE software_submissions ADD COLUMN IF NOT EXISTS install_guide TEXT;
-- ALTER TABLE software_submissions ADD COLUMN IF NOT EXISTS video_url TEXT;
-- ALTER TABLE software_submissions ADD COLUMN IF NOT EXISTS install_images JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- BÆ¯á»šC 2: Enable Row Level Security
-- ============================================

ALTER TABLE software_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BÆ¯á»šC 3: Táº¡o RLS Policies
-- ============================================

-- Cho phÃ©p táº¥t cáº£ má»i ngÆ°á»i xem software Ä‘Ã£ approve
CREATE POLICY "view_approved" ON software_submissions
  FOR SELECT USING (status = 'approved');

-- IMPORTANT (khÃ³a DB cho admin):
-- KhÃ´ng táº¡o policy INSERT/UPDATE/DELETE cho table nÃ y.
-- Khi báº­t RLS mÃ  khÃ´ng cÃ³ policy ghi, thÃ¬ anon/authenticated KHÃ”NG thá»ƒ thÃªm/sá»­a/xoÃ¡.
-- Admin sáº½ thao tÃ¡c qua server vÃ  dÃ¹ng SUPABASE_SERVICE_ROLE_KEY (service role bá» qua RLS).

-- ============================================
-- BÆ¯á»šC 4: Setup Storage (trong Supabase UI)
-- ============================================
-- 1. VÃ o Storage tab
-- 2. Táº¡o bucket: software-images (KHÃ”NG check "Private")
-- 3. VÃ o Policies tab cá»§a bucket
-- 4. Cháº¡y SQL nÃ y Ä‘á»ƒ cho phÃ©p public upload & read:

-- TRONG STORAGE POLICIES, CHáº Y CÃI NÃ€Y:
-- CREATE POLICY "Allow public upload" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'software-images');
-- 
-- CREATE POLICY "Allow public read" ON storage.objects
--   FOR SELECT USING (bucket_id = 'software-images');
-- 
-- CREATE POLICY "Allow public update" ON storage.objects
--   FOR UPDATE WITH CHECK (bucket_id = 'software-images');

-- ============================================
-- DONE! âœ…
-- ============================================
-- BÃ¢y giá» báº¡n cÃ³ thá»ƒ:
-- 1. VÃ o http://localhost:3000/admin Ä‘á»ƒ upload
-- 2. VÃ o http://localhost:3000/admin-panel Ä‘á»ƒ duyá»‡t
-- 3. VÃ o http://localhost:3000 Ä‘á»ƒ xem approved software

-- ============================================
-- BÃ†Â°Ã¡Â»â€ºc 5: Storage policies (chÃ¡ÂºÂ¡y thÃ¡ÂºÂ­t)
-- ============================================

DROP POLICY IF EXISTS "Allow public read software-images" ON storage.objects;
CREATE POLICY "Allow public read software-images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'software-images');

DROP POLICY IF EXISTS "Allow public upload software-images" ON storage.objects;
CREATE POLICY "Allow public upload software-images" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'software-images');

DROP POLICY IF EXISTS "Allow public update software-images" ON storage.objects;
CREATE POLICY "Allow public update software-images" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'software-images')
  WITH CHECK (bucket_id = 'software-images');

-- ============================================
-- STEP 6: Analytics (Admin thống kê)
-- ============================================

-- Lưu event: tìm kiếm, xem chi tiết, mở link tải.
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL, -- search | software_view | download_open
  session_id TEXT,
  search_id TEXT,
  software_id UUID,
  route TEXT,
  query TEXT,
  user_agent TEXT,
  referer TEXT,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- IMPORTANT:
-- Không tạo policy SELECT/INSERT cho table này.
-- App sẽ ghi/đọc qua server bằng SUPABASE_SERVICE_ROLE_KEY (bỏ qua RLS).

CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx
  ON analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_type_created_at_idx
  ON analytics_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_search_id_idx
  ON analytics_events (search_id);
CREATE INDEX IF NOT EXISTS analytics_events_software_id_idx
  ON analytics_events (software_id);
