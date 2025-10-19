import React from 'react';
import { Plus, Users, Database } from 'lucide-react';
import { useClient } from '../context/ClientContext';
import './Header.css';

const Header = ({ onAddClient }) => {
  const { createTestData } = useClient();

  const handleCreateTestData = async () => {
    try {
      await createTestData();
      alert('Test data created successfully!');
    } catch (error) {
      alert('Failed to create test data: ' + error.message);
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="logo">
            <Users className="logo-icon" />
            <h1>GST Software</h1>
          </div>
          <div className="step-indicator">
            <span className="step-number">STEP 2</span>
            <span className="step-title">UNIVERSAL CLIENT PAGE</span>
          </div>
        </div>
        <div className="header-right">
          <button 
            className="test-data-btn"
            onClick={handleCreateTestData}
            title="Create Test Data"
          >
            <Database className="btn-icon" />
            Test Data
          </button>
          <button 
            className="add-client-btn"
            onClick={onAddClient}
            title="Add New Client"
          >
            <Plus className="btn-icon" />
            Add Client
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
