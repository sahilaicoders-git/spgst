import React, { useState, useMemo, useEffect } from 'react';
import { useClient } from '../context/ClientContext';
import ClientTable from './ClientTable';
import SearchBar from './SearchBar';
import MonthSelectionDialog from './MonthSelectionDialog';
import './ClientList.css';

const ClientList = ({ onOpenMainApp }) => {
  const { clients, loading } = useClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClients, setSelectedClients] = useState([]);
  const [showMonthDialog, setShowMonthDialog] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Simple search filter
  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    
    return clients.filter(client =>
      client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.gstNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (showMonthDialog) return; // Don't handle keys when dialog is open
      
      const { key } = event;
      const totalClients = filteredClients.length;
      
      if (totalClients === 0) return;
      
      switch (key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => 
            prev < totalClients - 1 ? prev + 1 : prev
          );
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
          
        case 'Enter':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < totalClients) {
            const clientId = filteredClients[focusedIndex].id;
            handleSelectClient(clientId);
          }
          break;
          
        case ' ':
          event.preventDefault();
          if (selectedClients.length > 0) {
            handleOpenMainApp();
          }
          break;
          
        case 'Escape':
          event.preventDefault();
          setFocusedIndex(-1);
          setSelectedClients([]);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredClients, focusedIndex, selectedClients, showMonthDialog]);

  // Reset focused index when clients change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [filteredClients]);

  const handleSelectClient = (clientId) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(client => client.id));
    }
  };

  const handleOpenMainApp = () => {
    setShowMonthDialog(true);
  };

  const handleMonthConfirm = (monthYear, clientIds) => {
    const selectedClientObjects = clients.filter(client => clientIds.includes(client.id));
    
    if (onOpenMainApp) {
      onOpenMainApp(selectedClientObjects, monthYear);
    }
    
    setSelectedClients([]);
  };

  if (loading) {
    return (
      <div className="client-list-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="client-list-container">
      {/* Simple Search Section */}
      <div className="search-section">
        <SearchBar 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm}
          placeholder="Search clients..."
        />
        <div className="keyboard-hints">
          <span>Use ↑↓ arrows to navigate, Enter to select, Space to open app</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="client-content">
        {filteredClients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No clients found</h3>
            <p>
              {searchTerm 
                ? 'Try adjusting your search' 
                : 'Click "Add Client" to create your first client entry'
              }
            </p>
            {searchTerm && (
              <button 
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <ClientTable 
            clients={filteredClients}
            selectedClients={selectedClients}
            focusedIndex={focusedIndex}
            onSelectClient={handleSelectClient}
            onSelectAll={handleSelectAll}
          />
        )}
      </div>

      {/* Month Selection Dialog */}
      <MonthSelectionDialog
        isOpen={showMonthDialog}
        onClose={() => setShowMonthDialog(false)}
        onConfirm={handleMonthConfirm}
        selectedClients={selectedClients}
      />
    </div>
  );
};

export default ClientList;
