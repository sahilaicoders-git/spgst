import React, { useState } from 'react';
import { Edit, Trash2, Eye, Calendar, Building, Hash, Check } from 'lucide-react';
import { useClient } from '../context/ClientContext';
import './ClientCard.css';

const ClientCard = ({ client, isSelected = false, isFocused = false, onSelect }) => {
  const { deleteClient } = useClient();
  const [showActions, setShowActions] = useState(false);

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${client.clientName}?`)) {
      deleteClient(client.id);
    }
  };

  const handleCardClick = (e) => {
    // Don't trigger selection if clicking on action buttons or checkbox
    if (e.target.closest('.action-btn') || e.target.closest('.select-checkbox')) {
      return;
    }
    if (onSelect) {
      onSelect();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div 
      className={`client-card ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={handleCardClick}
    >
      {/* Selection Checkbox */}
      {onSelect && (
        <div className="card-selection">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="select-checkbox"
          />
        </div>
      )}

      <div className="client-card-header">
        <div className="client-id">
          <Hash className="id-icon" />
          {client.id}
        </div>
        <div className={`client-type ${client.gstType.toLowerCase()}`}>
          {client.gstType}
        </div>
      </div>

      <div className="client-info">
        <h3 className="client-name">{client.clientName}</h3>
        {client.businessName && (
          <div className="business-name">
            <Building className="business-icon" />
            {client.businessName}
          </div>
        )}
        
        <div className="client-details">
          <div className="detail-item">
            <Calendar className="detail-icon" />
            <span>FY: {client.indianFYear}</span>
          </div>
          
          {client.gstNo && (
            <div className="detail-item">
              <Hash className="detail-icon" />
              <span>{client.gstNo}</span>
            </div>
          )}
          
          <div className="detail-item">
            <span className="return-frequency">{client.returnFrequency}</span>
          </div>
        </div>

        {(client.address || client.contact) && (
          <div className="contact-info">
            {client.address && (
              <div className="contact-item">
                <strong>Address:</strong> {client.address}
              </div>
            )}
            {client.contact && (
              <div className="contact-item">
                <strong>Contact:</strong> {client.contact}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`client-actions ${showActions ? 'visible' : ''}`}>
        <button className="action-btn view-btn" title="View Details">
          <Eye />
        </button>
        <button className="action-btn edit-btn" title="Edit Client">
          <Edit />
        </button>
        <button 
          className="action-btn delete-btn" 
          title="Delete Client"
          onClick={handleDelete}
        >
          <Trash2 />
        </button>
      </div>

      <div className="client-footer">
        <small>Created: {formatDate(client.createdAt)}</small>
      </div>
    </div>
  );
};

export default ClientCard;
