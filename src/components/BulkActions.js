import React from 'react';
import { Trash2, X, CheckSquare, ArrowRight } from 'lucide-react';
import './BulkActions.css';

const BulkActions = ({ selectedCount, onBulkDelete, onClearSelection, onOpenMainApp }) => {
  return (
    <div className="bulk-actions">
      <div className="bulk-actions-content">
        <div className="bulk-info">
          <CheckSquare className="bulk-icon" />
          <span className="bulk-count">{selectedCount} selected</span>
        </div>
        
        <div className="bulk-buttons">
          <button 
            className="bulk-main-app-btn"
            onClick={onOpenMainApp}
            title="Open Main Application"
          >
            <ArrowRight />
            Open Main App
          </button>
          <button 
            className="bulk-delete-btn"
            onClick={onBulkDelete}
            title="Delete selected clients"
          >
            <Trash2 />
            Delete
          </button>
          <button 
            className="bulk-clear-btn"
            onClick={onClearSelection}
            title="Clear selection"
          >
            <X />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActions;
