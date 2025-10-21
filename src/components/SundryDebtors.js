import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Save, X, Search } from 'lucide-react';
import './SundryDebtors.css';

const SundryDebtors = ({ selectedClient }) => {
  const [debtors, setDebtors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDebtor, setEditingDebtor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    debtorName: '',
    gstin: '',
    address: '',
    contact: '',
    email: ''
  });

  useEffect(() => {
    if (selectedClient) {
      fetchDebtors();
    }
  }, [selectedClient]);

  const fetchDebtors = async () => {
    if (!selectedClient) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:5001/api/clients/${selectedClient}/sundry-debtors`);
      if (response.ok) {
        const data = await response.json();
        setDebtors(data);
      } else {
        console.error('Failed to fetch debtors');
      }
    } catch (error) {
      console.error('Error fetching debtors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateGSTIN = (gstin) => {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  };

  const resetForm = () => {
    setFormData({
      debtorName: '',
      gstin: '',
      address: '',
      contact: '',
      email: ''
    });
    setEditingDebtor(null);
  };

  const handleAddDebtor = async () => {
    if (!formData.debtorName || !formData.gstin) {
      alert('Debtor Name and GSTIN are required');
      return;
    }

    if (!validateGSTIN(formData.gstin)) {
      alert('Invalid GSTIN format');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5001/api/clients/${selectedClient}/sundry-debtors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Sundry debtor added successfully!');
        fetchDebtors();
        setShowAddModal(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add debtor');
      }
    } catch (error) {
      console.error('Error adding debtor:', error);
      alert('Failed to add debtor');
    }
  };

  const handleUpdateDebtor = async () => {
    if (!formData.debtorName || !formData.gstin) {
      alert('Debtor Name and GSTIN are required');
      return;
    }

    if (!validateGSTIN(formData.gstin)) {
      alert('Invalid GSTIN format');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5001/api/clients/${selectedClient}/sundry-debtors/${editingDebtor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Sundry debtor updated successfully!');
        fetchDebtors();
        setShowAddModal(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update debtor');
      }
    } catch (error) {
      console.error('Error updating debtor:', error);
      alert('Failed to update debtor');
    }
  };

  const handleDeleteDebtor = async (debtorId) => {
    if (!window.confirm('Are you sure you want to delete this debtor?')) {
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5001/api/clients/${selectedClient}/sundry-debtors/${debtorId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Sundry debtor deleted successfully!');
        fetchDebtors();
      } else {
        alert('Failed to delete debtor');
      }
    } catch (error) {
      console.error('Error deleting debtor:', error);
      alert('Failed to delete debtor');
    }
  };

  const handleEditClick = (debtor) => {
    setEditingDebtor(debtor);
    setFormData({
      debtorName: debtor.debtorName,
      gstin: debtor.gstin,
      address: debtor.address || '',
      contact: debtor.contact || '',
      email: debtor.email || ''
    });
    setShowAddModal(true);
  };

  const filteredDebtors = debtors.filter(debtor =>
    debtor.debtorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    debtor.gstin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!selectedClient) {
    return (
      <div className="sundry-debtors-empty">
        <Users size={64} />
        <h3>No Client Selected</h3>
        <p>Please select a client to manage sundry debtors</p>
      </div>
    );
  }

  return (
    <div className="sundry-debtors">
      <div className="debtors-header">
        <div className="header-left">
          <div className="header-icon">
            <Users size={32} />
          </div>
          <div className="header-content">
            <h2>Sundry Debtors</h2>
            <p>Manage customer/debtor information for quick entry</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="action-btn add-btn"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <Plus size={18} />
            Add Debtor
          </button>
        </div>
      </div>

      <div className="debtors-search">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name or GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="debtors-count">
          Total: {filteredDebtors.length} debtor{filteredDebtors.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading debtors...</div>
      ) : filteredDebtors.length === 0 ? (
        <div className="no-debtors">
          <Users size={48} />
          <h3>No Debtors Found</h3>
          <p>Click "Add Debtor" to add your first customer/debtor</p>
        </div>
      ) : (
        <div className="debtors-table-container">
          <table className="debtors-table">
            <thead>
              <tr>
                <th className="col-sr">Sr. No.</th>
                <th className="col-name">Debtor Name</th>
                <th className="col-gstin">GSTIN</th>
                <th className="col-address">Address</th>
                <th className="col-contact">Contact</th>
                <th className="col-email">Email</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDebtors.map((debtor, index) => (
                <tr key={debtor.id}>
                  <td className="col-sr">{index + 1}</td>
                  <td className="col-name debtor-name">{debtor.debtorName}</td>
                  <td className="col-gstin gstin">{debtor.gstin}</td>
                  <td className="col-address address">{debtor.address || '-'}</td>
                  <td className="col-contact contact">{debtor.contact || '-'}</td>
                  <td className="col-email email">{debtor.email || '-'}</td>
                  <td className="col-actions actions">
                    <button
                      className="icon-btn edit-btn"
                      onClick={() => handleEditClick(debtor)}
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="icon-btn delete-btn"
                      onClick={() => handleDeleteDebtor(debtor.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>{editingDebtor ? 'Edit Sundry Debtor' : 'Add New Sundry Debtor'}</h3>
              <button className="close-btn" onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Debtor Name *</label>
                  <input
                    type="text"
                    value={formData.debtorName}
                    onChange={(e) => handleInputChange('debtorName', e.target.value)}
                    placeholder="Enter debtor/customer name"
                  />
                </div>

                <div className="form-group">
                  <label>GSTIN *</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                    placeholder="29ABCDE1234F1Z5"
                    maxLength="15"
                    className={formData.gstin && !validateGSTIN(formData.gstin) ? 'error' : ''}
                  />
                  {formData.gstin && !validateGSTIN(formData.gstin) && (
                    <span className="error-text">Invalid GSTIN format</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter address (optional)"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Number</label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => handleInputChange('contact', e.target.value)}
                    placeholder="Enter contact number (optional)"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email (optional)"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={editingDebtor ? handleUpdateDebtor : handleAddDebtor}
              >
                <Save size={18} />
                {editingDebtor ? 'Update Debtor' : 'Add Debtor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SundryDebtors;

