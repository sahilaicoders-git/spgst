import React from 'react';
import { Search, X } from 'lucide-react';
import './SearchBar.css';

const SearchBar = ({ searchTerm, onSearchChange, placeholder = "Search..." }) => {
  const handleClear = () => {
    onSearchChange('');
  };

  return (
    <div className="search-bar">
      <div className="search-input-container">
        <Search className="search-icon" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="search-input"
        />
        {searchTerm && (
          <button 
            className="clear-search-btn"
            onClick={handleClear}
            title="Clear search"
          >
            <X />
          </button>
        )}
      </div>
      {searchTerm && (
        <div className="search-results-info">
          Searching for: <strong>"{searchTerm}"</strong>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
