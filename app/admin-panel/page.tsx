'use client';

import { useState, useEffect } from 'react';
import { uploadImage } from '@/lib/supabase-queries';

interface Submission {
  id: string;
  title: string;
  description: string;
  category: string;
  version: string;
  image_url: string;
  status: string;
  created_at: string;
  download_url?: string | null;
  download_url_2?: string | null;
  install_guide?: string | null;
  video_url?: string | null;
  install_images?: (string | null)[] | null;
}

type InstallStepEdit = {
  text: string;
  imageUrl: string | null;
};

export default function AdminPanel() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Submission | null>(null);
  const [editSteps, setEditSteps] = useState<InstallStepEdit[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingStepIndex, setUploadingStepIndex] = useState<number | null>(null);

  const previewSteps = editSteps
    .map((s) => ({ text: s.text.trim(), imageUrl: s.imageUrl }))
    .filter((s) => s.text.length > 0);

  useEffect(() => {
    if (!editing) {
      setEditSteps([]);
      setUploadingStepIndex(null);
      return;
    }

    const stepTexts = (editing.install_guide || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const images = Array.isArray(editing.install_images) ? editing.install_images : [];

    const count = Math.max(stepTexts.length, images.length, 1);
    setEditSteps(
      Array.from({ length: count }, (_, i) => {
        const rawImage = images[i];
        const imageUrl =
          typeof rawImage === 'string' && rawImage.trim().length > 0 ? rawImage.trim() : null;
        return {
          text: stepTexts[i] ?? '',
          imageUrl,
        };
      })
    );
  }, [editing?.id]);

  const updateStepText = (index: number, text: string) => {
    setEditSteps((prev) => prev.map((s, i) => (i === index ? { ...s, text } : s)));
  };

  const updateStepImageUrl = (index: number, imageUrl: string | null) => {
    setEditSteps((prev) => prev.map((s, i) => (i === index ? { ...s, imageUrl } : s)));
  };

  const addStep = () => {
    setEditSteps((prev) => [...prev, { text: '', imageUrl: null }]);
  };

  const removeStep = (index: number) => {
    setEditSteps((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadStepImage = async (index: number, file: File) => {
    setUploadingStepIndex(index);
    try {
      const url = await uploadImage(file);
      if (!url) throw new Error('UPLOAD_FAILED');
      updateStepImageUrl(index, url);
    } catch (error) {
      console.error('Error uploading step image:', error);
      alert(String(error));
    } finally {
      setUploadingStepIndex(null);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/software?status=${encodeURIComponent(filter)}`
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`FETCH_FAILED (${response.status}): ${text}`);
      }
      const data = await response.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError(String(error));
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/software/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('UPDATE_FAILED');

      setSubmissions(
        submissions.map((sub) =>
          sub.id === id ? { ...sub, status: newStatus } : sub
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteSoftware = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/software/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('DELETE_FAILED');

      setSubmissions(submissions.filter((sub) => sub.id !== id));
    } catch (error) {
      console.error('Error deleting software:', error);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const normalizedSteps = editSteps
        .map((s) => ({
          text: s.text.trim(),
          imageUrl: typeof s.imageUrl === 'string' ? s.imageUrl.trim() : '',
        }))
        .filter((s) => s.text.length > 0);

      const install_guide =
        normalizedSteps.length > 0 ? normalizedSteps.map((s) => s.text).join('\n') : null;
      const install_images =
        normalizedSteps.length > 0
          ? normalizedSteps.map((s) => (s.imageUrl.length > 0 ? s.imageUrl : null))
          : [];

      const response = await fetch(`/api/admin/software/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editing.title,
          description: editing.description,
          category: editing.category,
          version: editing.version,
          image_url: editing.image_url,
          download_url: editing.download_url ?? null,
          download_url_2: editing.download_url_2 ?? null,
          install_guide,
          video_url: editing.video_url ?? null,
          install_images,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`SAVE_FAILED (${response.status}): ${text}`);
      }

      const updated = (await response.json()) as Submission;
      setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditing(null);
    } catch (error) {
      console.error('Error saving submission:', error);
      alert(String(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-purple-100">Duyệt phần mềm được upload</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-6 flex gap-2 flex-wrap">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status === 'all'
                ? 'Tất cả'
                : status === 'pending'
                ? 'Chờ duyệt'
                : status === 'approved'
                ? 'Đã duyệt'
                : 'Từ chối'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 text-red-700 ring-1 ring-red-200 p-4">
            <p className="font-semibold">Không thể tải dữ liệu admin</p>
            <p className="text-sm mt-1 break-words">{error}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">Đang tải...</p>
          </div>
        )}

        {!loading && submissions.length > 0 ? (
          <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Phần mềm</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Danh mục</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Phiên bản</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Ngày upload</th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-700">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-200 to-pink-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {submission.image_url ? (
                            <img
                              src={
                                submission.image_url?.includes('via.placeholder.com')
                                  ? '/placeholder-software.svg'
                                  : submission.image_url
                              }
                              alt={submission.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const img = e.currentTarget;
                                if (img.dataset.fallbackApplied) return;
                                img.dataset.fallbackApplied = 'true';
                                img.src = '/placeholder-software.svg';
                              }}
                            />
                          ) : (
                            <span className="text-xs text-gray-600">IMG</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{submission.title}</p>
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {submission.description || 'Không có mô tả'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{submission.category}</td>
                    <td className="px-6 py-4 text-gray-700">{submission.version}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          submission.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : submission.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {submission.status === 'approved'
                          ? 'Đã duyệt'
                          : submission.status === 'rejected'
                          ? 'Từ chối'
                          : 'Chờ duyệt'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 text-sm">
                      {new Date(submission.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center">
                        {submission.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(submission.id, 'approved')}
                              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => updateStatus(submission.id, 'rejected')}
                              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deleteSoftware(submission.id)}
                          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition"
                        >
                          Xóa
                        </button>
                        <button
                          onClick={() => setEditing(submission)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                        >
                          Sửa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !loading && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-xl text-gray-500">Không có phần mềm nào</p>
            </div>
          )
        )}
      </main>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chỉnh sửa</p>
                <p className="font-bold text-gray-900">{editing.title || '—'}</p>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-[75vh] min-h-0">
              <div className="p-6 space-y-4 overflow-auto min-h-0 border-b lg:border-b-0 lg:border-r">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tên</label>
                    <input
                      value={editing.title}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Danh mục</label>
                    <input
                      value={editing.category}
                      onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phiên bản</label>
                    <input
                      value={editing.version || ''}
                      onChange={(e) => setEditing({ ...editing, version: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ảnh (URL)</label>
                    <input
                      value={editing.image_url || ''}
                      onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả</label>
                  <textarea
                    value={editing.description || ''}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Hướng dẫn cài đặt (từng bước)
                  </label>

                  <div className="space-y-4">
                    {editSteps.map((step, idx) => (
                      <div key={idx} className="rounded-2xl border border-gray-200 p-4">
                        <div className="flex items-start gap-3">
                          <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 text-sm font-extrabold ring-1 ring-blue-100">
                            {idx + 1}
                          </span>
                          <textarea
                            value={step.text}
                            onChange={(e) => updateStepText(idx, e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Nội dung bước ${idx + 1}...`}
                          />
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              Ảnh minh hoạ (URL)
                            </label>
                            <input
                              value={step.imageUrl || ''}
                              onChange={(e) =>
                                updateStepImageUrl(idx, e.target.value.trim() ? e.target.value : null)
                              }
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="https://..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              Hoặc upload ảnh mới
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingStepIndex === idx}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                uploadStepImage(idx, file);
                                e.currentTarget.value = '';
                              }}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateStepImageUrl(idx, null)}
                              className="px-3 py-1.5 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200"
                            >
                              Xoá ảnh
                            </button>
                            <button
                              type="button"
                              onClick={() => removeStep(idx)}
                              disabled={editSteps.length <= 1}
                              className="px-3 py-1.5 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                            >
                              Xoá bước
                            </button>
                          </div>
                          {uploadingStepIndex === idx && (
                            <span className="text-sm text-blue-700 font-semibold">Đang upload ảnh...</span>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addStep}
                      className="w-full px-4 py-2.5 rounded-xl font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 ring-1 ring-blue-100"
                    >
                      + Thêm bước
                    </button>

                    <p className="text-xs text-gray-500">
                      Khi lưu, hệ thống sẽ gắn đúng ảnh theo từng bước (bước 1 → ảnh 1...).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Link tải (chính)</label>
                    <input
                      value={editing.download_url || ''}
                      onChange={(e) => setEditing({ ...editing, download_url: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Link tải (dự phòng)</label>
                    <input
                      value={editing.download_url_2 || ''}
                      onChange={(e) => setEditing({ ...editing, download_url_2: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Video (YouTube)</label>
                  <input
                    value={editing.video_url || ''}
                    onChange={(e) => setEditing({ ...editing, video_url: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="p-6 overflow-auto min-h-0 bg-gray-50">
                <div className="text-sm font-bold text-gray-900 mb-3">Preview</div>
                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
                  <div className="w-full bg-gray-100 overflow-hidden aspect-[16/9]">
                    <img
                      src={editing.image_url || '/placeholder-software.svg'}
                      alt={editing.title || 'Software'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/placeholder-software.svg';
                      }}
                    />
                  </div>

                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="inline-flex bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold ring-1 ring-blue-100">
                        {editing.category || 'Khác'}
                      </span>
                      {editing.version && (
                        <span className="inline-flex bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold ring-1 ring-gray-200">
                          Phiên bản {editing.version}
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-extrabold text-gray-900 mb-3">
                      {editing.title || '—'}
                    </h2>

                    <div className="mb-6">
                      <h3 className="text-base font-bold text-gray-900 mb-2">Mô tả</h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {editing.description || ''}
                      </p>
                    </div>

                    {(previewSteps.length > 0 || editing.video_url) && (
                      <div className="mb-6">
                        <h3 className="text-base font-bold text-gray-900 mb-2">Hướng dẫn cài đặt</h3>
                        {previewSteps.length > 0 && (
                          <div className="space-y-3">
                            {previewSteps.map((s, idx) => (
                              <div
                                key={idx}
                                className="bg-white rounded-2xl ring-1 ring-gray-200 overflow-hidden"
                              >
                                <div className="p-4">
                                  <div className="flex items-start gap-3">
                                    <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 text-sm font-extrabold ring-1 ring-blue-100">
                                      {idx + 1}
                                    </span>
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                      {s.text}
                                    </p>
                                  </div>
                                </div>
                                {typeof s.imageUrl === 'string' && s.imageUrl.trim().length > 0 && (
                                  <a
                                    href={s.imageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block border-t bg-gray-50"
                                  >
                                    <img
                                      src={s.imageUrl}
                                      alt={`Ảnh bước ${idx + 1}`}
                                      className="w-full h-56 object-cover"
                                      loading="lazy"
                                    />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {editing.video_url && (
                          <div className="mt-4">
                            <a
                              href={editing.video_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                            >
                              Mở video YouTube →
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {(editing.download_url || editing.download_url_2) && (
                      <div className="space-y-2">
                        <h3 className="text-base font-bold text-gray-900">Link tải</h3>
                        {editing.download_url && (
                          <a
                            href={editing.download_url}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-sm font-semibold text-blue-700 hover:text-blue-800 break-all"
                          >
                            Link chính →
                          </a>
                        )}
                        {editing.download_url_2 && (
                          <a
                            href={editing.download_url_2}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-sm font-semibold text-blue-700 hover:text-blue-800 break-all"
                          >
                            Link dự phòng →
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2.5 rounded-xl font-semibold text-gray-700 hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
