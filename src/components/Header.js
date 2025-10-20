import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import './Header.css';

const Header = ({ onAddClient }) => {

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon-container">
              <Sparkles className="logo-icon" />
            </div>
            <div className="logo-text">
              <h1>SP-GST</h1>
              <span className="logo-subtitle">Professional GST Management</span>
            </div>
          </div>
        </div>
        <div className="header-right">
          <button 
            className="add-client-btn"
            onClick={onAddClient}
            title="Add New Client"
          >
            <Plus className="btn-icon" />
            <span>Add Client</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
