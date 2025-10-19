import React from 'react';
import { Filter, X } from 'lucide-react';
import './FilterPanel.css';

const FilterPanel = ({ selectedFilter, onFilterChange }) => {
  const filterOptions = [
    { value: 'all', label: 'All Clients', count: null },
    { value: 'REGULAR', label: 'Regular GST', count: null },
    { value: 'COMPOSITION', label: 'Composition GST', count: null },
  ];

  return (
    <div className="filter-panel">
      <div className="filter-panel-header">
        <div className="filter-title">
          <Filter className="filter-icon" />
          <span>Filter by GST Type</span>
        </div>
      </div>
      
      <div className="filter-options">
        {filterOptions.map(option => (
          <button
            key={option.value}
            className={`filter-option ${selectedFilter === option.value ? 'active' : ''}`}
            onClick={() => onFilterChange(option.value)}
          >
            <span className="filter-label">{option.label}</span>
            {option.count !== null && (
              <span className="filter-count">{option.count}</span>
            )}
          </button>
        ))}
      </div>
      
      <div className="filter-actions">
        <button 
          className="clear-filters-btn"
          onClick={() => onFilterChange('all')}
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
