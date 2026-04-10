'use client';

import { useState } from 'react';
import { uploadImage } from '@/lib/supabase-queries';

const FALLBACK_IMAGE = '/placeholder-software.svg';

type MessageType = 'success' | 'error' | null;

type InstallStep = {
  text: string;
  imageFile: File | null;
  previewUrl: string | null;
};

export default function AdminPanel() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'CAD',
    version: '',
    downloadUrl: '',
    downloadUrl2: '',
    videoUrl: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [installSteps, setInstallSteps] = useState<InstallStep[]>([
    { text: '', imageFile: null, previewUrl: null },
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<MessageType>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setImagePreview(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateInstallStepText = (index: number, text: string) => {
    setInstallSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, text } : s))
    );
  };

  const updateInstallStepImage = (index: number, file: File | null) => {
    setInstallSteps((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
        return {
          ...s,
          imageFile: file,
          previewUrl: file ? URL.createObjectURL(file) : null,
        };
      })
    );
  };

  const addInstallStep = () => {
    setInstallSteps((prev) => [...prev, { text: '', imageFile: null, previewUrl: null }]);
  };

  const removeInstallStep = (index: number) => {
    setInstallSteps((prev) => {
      if (prev.length <= 1) return prev;
      const step = prev[index];
      if (step?.previewUrl) URL.revokeObjectURL(step.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType(null);

    try {
      let imageUrl = '';
      const installImageUrls: (string | null)[] = [];

      const normalizedSteps = installSteps
        .map((s) => ({ ...s, text: s.text.trim() }))
        .filter((s) => s.text.length > 0);

      if (imageFile) {
        const url = await uploadImage(imageFile);
        if (url) imageUrl = url;
      }

      for (const step of normalizedSteps) {
        if (!step.imageFile) {
          installImageUrls.push(null);
          continue;
        }
        const url = await uploadImage(step.imageFile);
        installImageUrls.push(url || null);
      }

      const response = await fetch('/api/admin/software', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          version: formData.version,
          image_url: imageUrl || FALLBACK_IMAGE,
          download_url: formData.downloadUrl || null,
          download_url_2: formData.downloadUrl2 || null,
          install_guide: normalizedSteps.map((s) => s.text).join('\n') || null,
          video_url: formData.videoUrl || null,
          install_images: installImageUrls,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'UPLOAD_FAILED');
      }

      setMessage('Upload thành công! Chờ admin duyệt.');
      setMessageType('success');
      setFormData({
        title: '',
        description: '',
        category: 'CAD',
        version: '',
        downloadUrl: '',
        downloadUrl2: '',
        videoUrl: '',
      });
      setImageFile(null);
      setImagePreview('');
      setInstallSteps([{ text: '', imageFile: null, previewUrl: null }]);
    } catch (error) {
      setMessage(`Lỗi: ${error}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-gradient-to-r from-green-600 to-green-800 text-white py-6 shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Upload Phần Mềm</h1>
          <p className="text-green-100">Chia sẻ phần mềm của bạn với cộng đồng</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Tên phần mềm</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="VD: SolidWorks 2024"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Mô tả</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Mô tả chi tiết về phần mềm..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Hướng dẫn cài đặt</label>
            <div className="space-y-4">
              {installSteps.map((step, idx) => (
                <div key={idx} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 text-green-700 text-sm font-extrabold ring-1 ring-green-100">
                      {idx + 1}
                    </span>
                    <textarea
                      value={step.text}
                      onChange={(e) => updateInstallStepText(idx, e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder={`Bước ${idx + 1}... (tuỳ chọn)`}
                    />
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Ảnh minh hoạ cho bước {idx + 1} (tuỳ chọn)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => updateInstallStepImage(idx, e.target.files?.[0] ?? null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {step.previewUrl && (
                      <div className="mt-3">
                        <img
                          src={step.previewUrl}
                          alt={`Preview bước ${idx + 1}`}
                          className="w-full max-w-md h-44 object-cover rounded-lg ring-1 ring-gray-200 bg-gray-50"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => removeInstallStep(idx)}
                      disabled={installSteps.length <= 1}
                      className="px-3 py-1.5 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    >
                      Xoá bước
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addInstallStep}
                className="w-full px-4 py-2.5 rounded-lg font-bold text-green-700 bg-green-50 hover:bg-green-100 ring-1 ring-green-100"
              >
                + Thêm bước
              </button>

              <p className="text-xs text-gray-500">
                Ảnh sẽ được gắn đúng theo từng bước (bước 1 → ảnh 1, bước 2 → ảnh 2...).
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Danh mục</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="CAD">CAD</option>
              <option value="Design">Design</option>
              <option value="Development">Development</option>
              <option value="Library">Library</option>
              <option value="Office">Office</option>
              <option value="Graphics">Graphics</option>
              <option value="Video">Video</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Phiên bản</label>
            <input
              type="text"
              name="version"
              value={formData.version}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="VD: 2024 SP1"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Link tải (chính)</label>
            <input
              type="url"
              name="downloadUrl"
              value={formData.downloadUrl}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="VD: https://drive.google.com/..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Link tải (dự phòng)</label>
            <input
              type="url"
              name="downloadUrl2"
              value={formData.downloadUrl2}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="VD: https://mega.nz/..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Link video (YouTube)</label>
            <input
              type="url"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="VD: https://www.youtube.com/watch?v=..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Ảnh đại diện</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-48 h-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg text-white ${
              messageType === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Đang upload...' : 'Upload phần mềm'}
          </button>

          <p className="text-gray-600 text-sm mt-4 text-center">
            Sau khi upload, phần mềm sẽ được admin duyệt trước khi hiển thị.
          </p>
        </form>
      </main>
    </div>
  );
}
