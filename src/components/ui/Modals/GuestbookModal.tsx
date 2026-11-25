import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { soundFx } from '../../../hooks/useAudio';
import {
  X,
  BookOpen,
  Send,
  Sparkles,
  MessageSquare,
  Heart,
  AlertCircle,
  RefreshCw,
  Database,
  Loader2,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { GuestbookTag } from '../../../types/heritage';

const MAX_MESSAGE_LEN = 500;
const GUESTBOOK_TAGS: GuestbookTag[] = ['Lời chúc', 'Kỷ niệm', 'Cựu thành viên', 'Góp ý'];

export const GuestbookModal: React.FC = () => {
  const {
    activeModal,
    closeModal,
    guestbookEntries,
    guestbookStatus,
    guestbookError,
    guestbookFieldErrors,
    storageMode,
    likedGuestbookIds,
    loadGuestbook,
    submitGuestbookEntry,
    likeGuestbook,
    clearGuestbookErrors,
  } = useHeritageStore();

  const [author, setAuthor] = useState('');
  const [roleOrAffiliation, setRoleOrAffiliation] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTag, setSelectedTag] = useState<GuestbookTag>('Lời chúc');
  const [filterTag, setFilterTag] = useState<'ALL' | GuestbookTag>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'likes'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const authorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeModal === 'guestbook') {
      void loadGuestbook();
      const timer = window.setTimeout(() => authorInputRef.current?.focus(), 40);
      return () => window.clearTimeout(timer);
    }
  }, [activeModal, loadGuestbook]);

  const filteredEntries = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    const list = guestbookEntries.filter((entry) => {
      const entryTag = entry.tag || 'Lời chúc';
      const matchTag = filterTag === 'ALL' || entryTag === filterTag;
      const matchSearch =
        !needle ||
        entry.author.toLowerCase().includes(needle) ||
        entry.roleOrAffiliation.toLowerCase().includes(needle) ||
        entry.message.toLowerCase().includes(needle);
      return matchTag && matchSearch;
    });
    if (sortBy === 'likes') {
      return [...list].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
    }
    return list;
  }, [guestbookEntries, filterTag, searchQuery, sortBy]);

  if (activeModal !== 'guestbook') return null;

  const isSubmitting = guestbookStatus === 'submitting';
  const isLoadingList = guestbookStatus === 'loading';
  const messagePct = Math.min(100, Math.round((message.length / MAX_MESSAGE_LEN) * 100));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const ok = await submitGuestbookEntry({
      author: author.trim(),
      roleOrAffiliation: roleOrAffiliation.trim() || 'Khách tham quan',
      message: message.trim(),
      tag: selectedTag,
    });

    if (!ok) return;

    soundFx.playSuccessChord();
    confetti({
      particleCount: 70,
      spread: 65,
      origin: { y: 0.6 },
      colors: ['#00F0FF', '#0066FF', '#FF0055', '#FFD700'],
    });

    setIsSuccess(true);
    setAuthor('');
    setRoleOrAffiliation('');
    setMessage('');
    setSelectedTag('Lời chúc');
    window.setTimeout(() => setIsSuccess(false), 3500);
  };

  const handleLikeEntry = async (id: string) => {
    const added = await likeGuestbook(id);
    if (added) {
      soundFx.playLikePop();
    }
  };

  const storageLabel =
    storageMode === 'local'
      ? 'Lưu cục bộ trên trình duyệt'
      : storageMode === 'kv'
      ? 'Đồng bộ Cloud KV'
      : 'Đồng bộ máy chủ API';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guestbook-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none cursor-default"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) {
          closeModal();
        }
      }}
    >
      <div
        className="relative w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl glass-panel-glow overflow-hidden border border-tech-cyan/40 animate-panel-in"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-4.5 border-b border-tech-cyan/20 flex items-center justify-between bg-[#0c101c]/95">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-tech-cyan shrink-0" aria-hidden="true" />
            <div>
              <h2
                id="guestbook-modal-title"
                className="text-xl md:text-2xl font-bold text-white tracking-tight"
              >
                LỜI CHÚC & DẤU ẤN KỶ NIỆM TECHTONIC
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                <span>Sổ Lưu Bút Danh Dự</span>
                <span aria-hidden="true">•</span>
                <span className="inline-flex items-center gap-1 text-tech-cyan">
                  <Database className="w-3 h-3" aria-hidden="true" />
                  {storageLabel}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Đóng sổ lưu bút"
            title="Đóng (ESC)"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Input Form */}
          <form onSubmit={handleSubmit} className="flex flex-col space-y-3.5" noValidate>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-tech-cyan" aria-hidden="true" />
              Viết lời chúc của bạn
            </h3>

            {isSuccess && (
              <div
                role="status"
                className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-2 animate-fade-in"
              >
                <Sparkles className="w-4 h-4 shrink-0 text-emerald-300" aria-hidden="true" />
                Cảm ơn bạn! Lời chúc đã được lưu vào sổ lưu bút TechTonic.
              </div>
            )}

            {guestbookError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/40 text-rose-200 text-xs flex items-start justify-between gap-2"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-300" aria-hidden="true" />
                  <span>{guestbookError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void loadGuestbook()}
                  className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" aria-hidden="true" />
                  Thử lại
                </button>
              </div>
            )}

            <div>
              <span className="block text-xs font-medium text-slate-200 mb-1.5">Chủ đề lời nhắn</span>
              <div className="flex flex-wrap gap-1.5">
                {GUESTBOOK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-tech-cyan text-slate-950 font-semibold'
                        : 'bg-[#0e1422] border border-white/15 text-slate-200 hover:border-tech-cyan/45'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="gb-author" className="block text-xs font-medium text-slate-200 mb-1.5">
                Họ và tên của bạn <span className="text-tech-cyan">*</span>
              </label>
              <input
                ref={authorInputRef}
                id="gb-author"
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={author}
                onChange={(e) => {
                  setAuthor(e.target.value);
                  if (guestbookError || guestbookFieldErrors) clearGuestbookErrors();
                }}
                placeholder="VD: Nguyễn Văn A"
                aria-invalid={Boolean(guestbookFieldErrors?.author)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1422] border border-white/15 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-tech-cyan"
              />
              {guestbookFieldErrors?.author && (
                <p className="text-xs text-rose-300 mt-1">{guestbookFieldErrors.author}</p>
              )}
            </div>

            <div>
              <label htmlFor="gb-role" className="block text-xs font-medium text-slate-200 mb-1.5">
                Đơn vị / Khóa / Mối liên hệ
              </label>
              <input
                id="gb-role"
                type="text"
                maxLength={100}
                value={roleOrAffiliation}
                onChange={(e) => setRoleOrAffiliation(e.target.value)}
                placeholder="VD: Cựu thành viên K21 / Khách mời TechTalk"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1422] border border-white/15 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-tech-cyan"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="gb-message" className="block text-xs font-medium text-slate-200">
                  Lời nhắn gửi / Cảm nhận <span className="text-tech-cyan">*</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {message.length}/{MAX_MESSAGE_LEN}
                </span>
              </div>
              <textarea
                id="gb-message"
                required
                minLength={5}
                maxLength={MAX_MESSAGE_LEN}
                rows={4}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (guestbookError || guestbookFieldErrors) clearGuestbookErrors();
                }}
                placeholder="Gửi gắm lời chúc, kỷ niệm hoặc cảm nhận của bạn khi tham quan phòng truyền thống..."
                aria-invalid={Boolean(guestbookFieldErrors?.message)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1422] border border-white/15 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-tech-cyan resize-none"
              />
              <div className="mt-1.5 h-1 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-tech-cyan transition-all duration-150"
                  style={{ width: `${messagePct}%` }}
                />
              </div>
              {guestbookFieldErrors?.message && (
                <p className="text-xs text-rose-300 mt-1">{guestbookFieldErrors.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full py-2.5 px-4 rounded-xl bg-tech-cyan text-slate-950 font-semibold text-sm flex items-center justify-center space-x-2 hover:bg-[#33f3ff] disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>ĐANG LƯU LỜI CHÚC...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" aria-hidden="true" />
                  <span>GỬI LỜI CHÚC LƯU BÚT</span>
                </>
              )}
            </button>
          </form>

          {/* Right: Existing Messages List with Search, Tag Filter & Likes */}
          <div className="flex flex-col space-y-3 min-h-0">
            <h3 className="text-sm font-semibold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" aria-hidden="true" /> Lưu bút gần đây
              </span>
              <span className="text-xs text-tech-cyan font-mono tabular-nums">
                {filteredEntries.length}/{guestbookEntries.length} lời nhắn
              </span>
            </h3>

            {/* Search & Tag Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search
                  className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tên hoặc nội dung..."
                  aria-label="Tìm kiếm lời chúc trong sổ lưu bút"
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0e1422] border border-white/15 text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-tech-cyan"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex flex-wrap gap-1">
                  {(['ALL', ...GUESTBOOK_TAGS] as const).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFilterTag(tag)}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                        filterTag === tag
                          ? 'bg-tech-cyan/20 text-tech-cyan border border-tech-cyan/50'
                          : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {tag === 'ALL' ? 'Tất cả' : tag}
                    </button>
                  ))}
                </div>
                <div className="inline-flex rounded-md bg-white/5 border border-white/10 p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSortBy('newest')}
                    className={`px-2 py-0.5 rounded transition cursor-pointer ${
                      sortBy === 'newest' ? 'bg-tech-cyan text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Mới nhất
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy('likes')}
                    className={`px-2 py-0.5 rounded transition cursor-pointer ${
                      sortBy === 'likes' ? 'bg-rose-400 text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Yêu thích
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 max-h-[340px] overflow-y-auto space-y-2.5 pr-1">
              {isLoadingList ? (
                <div className="space-y-3" aria-label="Đang tải danh sách lưu bút">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="p-3.5 rounded-xl bg-[#0e1422]/70 border border-white/10 animate-pulse space-y-2"
                    >
                      <div className="h-3.5 w-32 bg-white/10 rounded" />
                      <div className="h-3 w-24 bg-white/10 rounded" />
                      <div className="h-10 w-full bg-white/5 rounded" />
                    </div>
                  ))}
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="p-8 rounded-xl bg-[#0e1422]/60 border border-white/10 text-center">
                  <p className="text-xs text-slate-300">
                    Không tìm thấy lời nhắn phù hợp. Hãy thử từ khóa khác hoặc viết lời chúc đầu tiên!
                  </p>
                </div>
              ) : (
                filteredEntries.map((entry) => {
                  const initial = entry.author.trim().split(/\s+/).slice(-1)[0]?.[0]?.toUpperCase() || 'T';
                  const isLiked = likedGuestbookIds.includes(entry.id);
                  const likeCount = entry.likes ?? 0;

                  return (
                    <article
                      key={entry.id}
                      className="p-3.5 rounded-xl bg-[#0e1422]/85 border border-white/10 hover:border-tech-cyan/35 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#152238] border border-tech-cyan/30 text-tech-cyan font-bold text-xs flex items-center justify-center shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">{entry.author}</div>
                            <div className="text-[11px] text-tech-cyan truncate">
                              {entry.roleOrAffiliation}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <time className="text-[10px] text-slate-400 font-mono tabular-nums">
                            {entry.timestamp}
                          </time>
                          {entry.tag && (
                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-slate-300">
                              {entry.tag}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed italic mb-2">
                        "{entry.message}"
                      </p>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => void handleLikeEntry(entry.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition cursor-pointer ${
                            isLiked
                              ? 'bg-rose-500/20 border-rose-400/50 text-rose-200'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:border-rose-400/40 hover:text-rose-200'
                          }`}
                          aria-label={`Thả tim cho lời chúc của ${entry.author}`}
                        >
                          <Heart
                            className={`w-3 h-3 ${isLiked ? 'fill-rose-400 text-rose-400' : ''}`}
                            aria-hidden="true"
                          />
                          <span className="font-mono tabular-nums">{likeCount}</span>
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0a0d14] border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
