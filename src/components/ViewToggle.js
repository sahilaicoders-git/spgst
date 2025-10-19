import React from 'react';
import { Grid3X3, List } from 'lucide-react';
import './ViewToggle.css';

const ViewToggle = ({ viewMode, onViewModeChange }) => {
  return (
    <div className="view-toggle">
      <button
        className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
        onClick={() => onViewModeChange('cards')}
        title="Card View"
      >
        <Grid3X3 />
      </button>
      <button
        className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
        onClick={() => onViewModeChange('table')}
        title="Table View"
      >
        <List />
      </button>
    </div>
  );
};

export default ViewToggle;
