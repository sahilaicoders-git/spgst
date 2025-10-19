import React, { useEffect, useRef } from 'react';
import { Calendar, Building, Hash, ArrowUp, ArrowDown } from 'lucide-react';
import './ClientTable.css';

const ClientTable = ({ 
  clients, 
  selectedClients, 
  focusedIndex,
  onSelectClient, 
  onSelectAll, 
  sortBy, 
  sortOrder, 
  onSortChange 
}) => {
  const focusedRowRef = useRef(null);

  // Auto-scroll to focused row
  useEffect(() => {
    if (focusedRowRef.current) {
      focusedRowRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [focusedIndex]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const SortableHeader = ({ field, children }) => (
    <th 
      className={`sortable-header ${sortBy === field ? 'active' : ''}`}
      onClick={() => onSortChange(field)}
      title={`Sort by ${children}`}
    >
      <div className="header-content">
        <span className="header-label">{children}</span>
        {sortBy === field && (
          <span className="sort-indicator">
            {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="client-table-container">
      <div className="table-wrapper">
        <table className="client-table">
          <thead>
            <tr>
              <th className="select-header">
                <input
                  type="checkbox"
                  checked={selectedClients.length === clients.length && clients.length > 0}
                  onChange={onSelectAll}
                  className="select-all-checkbox"
                />
              </th>
              <SortableHeader field="clientName">Client Name</SortableHeader>
              <SortableHeader field="businessName">Business</SortableHeader>
              <SortableHeader field="gstType">GST Type</SortableHeader>
              <SortableHeader field="gstNo">GST Number</SortableHeader>
              <SortableHeader field="returnFrequency">Frequency</SortableHeader>
              <SortableHeader field="createdAt">Created</SortableHeader>
            </tr>
          </thead>
          <tbody>
            {clients.map((client, index) => (
              <tr 
                key={client.id} 
                ref={focusedIndex === index ? focusedRowRef : null}
                className={`client-row ${selectedClients.includes(client.id) ? 'selected' : ''} ${focusedIndex === index ? 'focused' : ''}`}
                onClick={() => onSelectClient(client.id)}
              >
                <td className="select-cell" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(client.id)}
                    onChange={() => onSelectClient(client.id)}
                    className="client-checkbox"
                    aria-label={`Select ${client.clientName}`}
                  />
                </td>
                <td className="client-name-cell">
                  <div className="client-name-content">
                    <div className="client-name" title={client.clientName}>
                      {client.clientName}
                    </div>
                    <div className="client-id">ID: {client.id}</div>
                  </div>
                </td>
                <td className="business-cell">
                  <div className="business-content">
                    <Building className="business-icon" size={16} />
                    <span className="business-name" title={client.businessName}>
                      {client.businessName}
                    </span>
                  </div>
                </td>
                <td className="gst-type-cell">
                  <span className={`gst-type-badge ${client.gstType.toLowerCase()}`}>
                    {client.gstType}
                  </span>
                </td>
                <td className="gst-no-cell">
                  <div className="gst-no-content">
                    <Hash className="gst-icon" size={14} />
                    <span className="gst-number" title={client.gstNo}>
                      {client.gstNo}
                    </span>
                  </div>
                </td>
                <td className="frequency-cell">
                  <span className="frequency-badge">
                    {client.returnFrequency}
                  </span>
                </td>
                <td className="date-cell">
                  <div className="date-content">
                    <Calendar className="date-icon" size={14} />
                    <span className="date-text" title={formatDate(client.createdAt)}>
                      {formatDate(client.createdAt)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {clients.length === 0 && (
        <div className="table-empty-state">
          <div className="empty-icon">📋</div>
          <h3>No clients to display</h3>
          <p>Add some clients to see them in table view</p>
        </div>
      )}
    </div>
  );
};

export default ClientTable;
