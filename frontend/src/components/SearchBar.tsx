import React from 'react';
import { Search, X, Sparkles } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Поиск по названию, логину, URL или описанию..."
}) => {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
      <div className="relative">
        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" size={22} />
        <Sparkles className="absolute left-12 top-1/2 transform -translate-y-1/2 text-blue-400 opacity-0 group-focus-within:opacity-100 transition-all duration-300 animate-pulse" size={16} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
          className="relative w-full pl-16 pr-14 py-5 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 text-gray-900 placeholder-gray-500 shadow-lg hover:shadow-xl font-medium"
      />
      {value && (
        <button
          onClick={() => onChange('')}
            className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-300 p-1 rounded-full hover:bg-red-50"
        >
            <X size={20} />
        </button>
      )}
      </div>
    </div>
  );
};