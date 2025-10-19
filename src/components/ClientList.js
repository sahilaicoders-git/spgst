import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useClient } from '../context/ClientContext';
import ClientTable from './ClientTable';
import SearchBar from './SearchBar';
import FilterPanel from './FilterPanel';
import BulkActions from './BulkActions';
import MonthSelectionDialog from './MonthSelectionDialog';
import './ClientList.css';

const ClientList = ({ onOpenMainApp }) => {
  const { clients, loading } = useClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedClients, setSelectedClients] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showMonthDialog, setShowMonthDialog] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);

  // Filter and search clients
  const filteredClients = useMemo(() => {
    let filtered = clients;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.gstNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.address && client.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.contact && client.contact.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(client => client.gstType === selectedFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [clients, searchTerm, selectedFilter, sortBy, sortOrder]);

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
          
        case 'ArrowRight':
          event.preventDefault();
          // In table view, right arrow moves to next row
          setFocusedIndex(prev => 
            prev < totalClients - 1 ? prev + 1 : prev
          );
          break;
          
        case 'ArrowLeft':
          event.preventDefault();
          // In table view, left arrow moves to previous row
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

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedClients.length} clients?`)) {
      // This would call the delete function for each selected client
      console.log('Deleting clients:', selectedClients);
      setSelectedClients([]);
    }
  };

  const handleOpenMainApp = () => {
    setShowMonthDialog(true);
  };

  const handleMonthConfirm = (monthYear, clientIds) => {
    // Map client IDs to full client objects
    const selectedClientObjects = clients.filter(client => clientIds.includes(client.id));
    
    console.log('Opening main application for:', monthYear, 'with clients:', selectedClientObjects);
    
    // Call the parent handler to open main application
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
      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-filter-content">
          <SearchBar 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm}
            placeholder="Search clients, businesses, GST numbers..."
          />
          <div className="filter-controls">
            <button 
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <span>Filters</span>
              <span className="filter-count">
                {selectedFilter !== 'all' ? '1' : '0'}
              </span>
            </button>
            <div className="sort-controls">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="createdAt">Created Date</option>
                <option value="clientName">Client Name</option>
                <option value="businessName">Business Name</option>
                <option value="gstType">GST Type</option>
                <option value="returnFrequency">Return Frequency</option>
              </select>
              <button 
                className={`sort-order ${sortOrder}`}
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
        
        {showFilters && (
          <FilterPanel 
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
          />
        )}
      </div>

      {/* Bulk Actions */}
      {selectedClients.length > 0 && (
        <BulkActions 
          selectedCount={selectedClients.length}
          onBulkDelete={handleBulkDelete}
          onClearSelection={() => setSelectedClients([])}
          onOpenMainApp={handleOpenMainApp}
        />
      )}

      {/* Content Section */}
      <div className="client-content">
        {filteredClients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No clients found</h3>
            <p>
              {searchTerm || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Click "Add Client" to create your first client entry'
              }
            </p>
            {searchTerm || selectedFilter !== 'all' ? (
              <button 
                className="clear-filters-btn"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedFilter('all');
                }}
              >
                Clear Filters
              </button>
            ) : null}
          </div>
        ) : (
          <ClientTable 
            clients={filteredClients}
            selectedClients={selectedClients}
            focusedIndex={focusedIndex}
            onSelectClient={handleSelectClient}
            onSelectAll={handleSelectAll}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(field) => {
              if (sortBy === field) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy(field);
                setSortOrder('asc');
              }
            }}
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
