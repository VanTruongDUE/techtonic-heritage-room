import React, { useEffect, useRef, useState } from 'react';
import { useHeritageStore } from '../../../store/useHeritageStore';
import { X, Users, Shield, Search, RotateCcw, Star } from 'lucide-react';
import type { Department } from '../../../types/heritage';

const DEPARTMENTS: Array<'all' | Department> = [
  'all',
  'Ban Chủ Nhiệm',
  'Ban Chuyên Môn',
  'Ban Sự Kiện',
  'Ban Nhân Sự',
  'Ban Truyền Thông',
];

export const ExecutiveBoardModal: React.FC = () => {
  const { activeModal, closeModal, executiveMembers } = useHeritageStore();
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<'all' | Department>('all');
  const [onlyFounders, setOnlyFounders] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeModal === 'shirt') {
      const timer = window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 40);
      return () => window.clearTimeout(timer);
    }
  }, [activeModal]);

  if (activeModal !== 'shirt') return null;

  const terms = Array.from(new Set(executiveMembers.map((m) => m.term)));
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredMembers = executiveMembers.filter((m) => {
    const matchTerm = selectedTerm === 'all' || m.term === selectedTerm;
    const matchDept = selectedDept === 'all' || m.department === selectedDept;
    const matchFounder = !onlyFounders || Boolean(m.isFounder);
    const matchSearch =
      !normalizedQuery ||
      m.name.toLowerCase().includes(normalizedQuery) ||
      m.role.toLowerCase().includes(normalizedQuery) ||
      (m.bio ?? '').toLowerCase().includes(normalizedQuery);
    return matchTerm && matchDept && matchFounder && matchSearch;
  });

  const hasFilters =
    selectedTerm !== 'all' ||
    selectedDept !== 'all' ||
    onlyFounders ||
    normalizedQuery.length > 0;

  const resetFilters = () => {
    setSelectedTerm('all');
    setSelectedDept('all');
    setOnlyFounders(false);
    setSearchQuery('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bcn-modal-title"
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
        className="relative w-full max-w-4xl max-h-[86vh] flex flex-col rounded-2xl glass-panel-glow overflow-hidden border border-tech-cyan/40 animate-panel-in"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-tech-cyan/20 flex items-center justify-between bg-[#0c101c]/95">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-tech-cyan shrink-0" aria-hidden="true" />
            <div>
              <h2
                id="bcn-modal-title"
                className="text-xl md:text-2xl font-bold text-white tracking-tight"
              >
                BAN CHỦ NHIỆM & NHÀ SÁNG LẬP TECHTONIC
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Trực thuộc Hội Sinh viên Trường ĐH Kinh tế - ĐH Đà Nẵng • 3 Nhiệm kỳ (2024–2027)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Đóng cửa sổ Ban Chủ Nhiệm"
            title="Đóng (ESC)"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 py-3.5 bg-black/45 border-b border-white/10 flex flex-col gap-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên, vai trò hoặc nhiệm kỳ..."
                aria-label="Tìm kiếm thành viên Ban Chủ Nhiệm"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#121824] border border-white/15 text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-tech-cyan"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setOnlyFounders((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  onlyFounders
                    ? 'bg-amber-400 text-slate-950 font-semibold'
                    : 'bg-[#121824] border border-white/15 text-slate-200 hover:border-amber-400/50'
                }`}
              >
                <Star className="w-3.5 h-3.5" aria-hidden="true" />
                <span>8 Co-Founders</span>
              </button>

              <label htmlFor="bcn-term-select" className="text-slate-300 font-medium ml-1">
                Nhiệm kỳ:
              </label>
              <select
                id="bcn-term-select"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="bg-[#121824] border border-tech-cyan/30 text-slate-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-tech-cyan"
              >
                <option value="all">Tất cả nhiệm kỳ</option>
                {terms.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className="text-slate-300 font-mono tabular-nums pl-1">
                {filteredMembers.length}/{executiveMembers.length}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedDept === dept
                    ? 'bg-tech-cyan text-slate-950 font-semibold'
                    : 'bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10'
                }`}
              >
                {dept === 'all' ? 'Tất cả ban' : dept}
              </button>
            ))}
          </div>
        </div>

        {/* Member Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredMembers.length === 0 ? (
            <div className="py-14 px-6 text-center rounded-xl border border-white/10 bg-[#0e1422]/60">
              <p className="text-sm font-semibold text-white mb-1.5">
                Không tìm thấy thành viên phù hợp
              </p>
              <p className="text-xs text-slate-300 mb-4">
                Thử thay đổi từ khóa tìm kiếm, nhiệm kỳ hoặc ban chức năng khác.
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-tech-cyan text-slate-950 text-xs font-semibold hover:bg-[#33f3ff] transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  Đặt lại bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMembers.map((member) => (
                <article
                  key={member.id}
                  className="group p-4 rounded-xl bg-[#0e1422]/85 border border-white/10 hover:border-tech-cyan/45 hover:bg-[#121a2c] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          loading="lazy"
                          className="w-11 h-11 shrink-0 rounded-xl object-cover border border-tech-cyan/35 bg-[#152036]"
                        />
                      ) : (
                        <div className="w-11 h-11 shrink-0 rounded-xl bg-[#152036] flex items-center justify-center text-tech-cyan font-bold text-base">
                          {member.name.trim().split(/\s+/).slice(-1)[0]?.[0] ?? 'T'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-white group-hover:text-tech-cyan transition-colors truncate">
                          {member.name}
                        </h3>
                        <div className="text-xs text-tech-cyan font-medium">{member.role}</div>
                      </div>
                    </div>
                    <span className="shrink-0 px-2.5 py-0.5 rounded text-[11px] font-mono bg-white/5 border border-white/15 text-slate-200 tabular-nums">
                      {member.term}
                    </span>
                  </div>

                  {member.bio && (
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">{member.bio}</p>
                  )}

                  <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-200">
                      <Shield className="w-3.5 h-3.5 text-tech-cyan" aria-hidden="true" />
                      {member.department}
                    </span>
                    {member.isFounder ? (
                      <span className="text-amber-300 font-mono text-[11px] font-semibold">
                        Co-Founder
                      </span>
                    ) : (
                      <span className="text-tech-cyan font-mono text-[11px]">TechTonic Leader</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 bg-[#0a0d14] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <span>
            Cơ cấu chính thức: 3 Quản lý BCN • 27 TV các ban (Chuyên Môn, Sự Kiện, Nhân Sự, Truyền Thông) • 45+ Thành viên tự do.
          </span>
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
