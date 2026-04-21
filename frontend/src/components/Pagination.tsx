import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  isDark?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  isDark = false
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const delta = 2;
    
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    
    return pages;
  };

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between mt-6">
      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Показано {start}-{end} из {total}
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={`p-2 rounded-lg transition-all ${
            isDark 
              ? 'text-gray-400 hover:text-white hover:bg-slate-700 disabled:text-gray-600 disabled:hover:bg-transparent' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent'
          }`}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-1">
          {getVisiblePages().map((p, i) => (
            p === '...' ? (
              <span key={`ellipsis-${i}`} className={`px-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>...</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`w-10 h-10 rounded-lg font-medium transition-all ${
                  page === p
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : isDark
                      ? 'text-gray-300 hover:bg-slate-700'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            )
          ))}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={`p-2 rounded-lg transition-all ${
            isDark 
              ? 'text-gray-400 hover:text-white hover:bg-slate-700 disabled:text-gray-600 disabled:hover:bg-transparent' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent'
          }`}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};
