'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onSortChange?: (sort: string) => void;
  categories: string[];
}

export default function SearchBar({
  onSearch,
  onCategoryChange,
  onSortChange,
  categories,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg ring-1 ring-black/5 p-4 md:p-5 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="relative lg:col-span-6">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M21 21l-4.3-4.3m1.3-5.2a7 7 0 11-14 0 7 7 0 0114 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm phần mềm..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Tìm kiếm"
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                onSearch('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              aria-label="Xóa tìm kiếm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>

        <select
          onChange={(e) => onCategoryChange(e.target.value)}
          className="lg:col-span-3 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          aria-label="Danh mục"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          onChange={(e) => onSortChange?.(e.target.value)}
          className="lg:col-span-3 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          aria-label="Sắp xếp"
          defaultValue="newest"
        >
          <option value="newest">Mới nhất</option>
          <option value="mostViewed">Xem nhiều</option>
          <option value="topRated">Đánh giá cao</option>
          <option value="mostLiked">Yêu thích</option>
        </select>
      </div>
    </div>
  );
}
