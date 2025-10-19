import React, { useState } from 'react';
import { X, User, Building, Calendar, Hash, MapPin, Phone, RotateCcw, CheckCircle } from 'lucide-react';
import { useClient } from '../context/ClientContext';
import './AddClientForm.css';

const AddClientForm = ({ onClose }) => {
  const { addClient } = useClient();
  // Get current Indian Financial Year with start and end dates
  const getCurrentIndianFY = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 0-indexed, so add 1
    
    // Indian FY starts from April (month 4)
    if (currentMonth >= 4) {
      return `01/04/${currentYear} - 31/03/${currentYear + 1}`;
    } else {
      return `01/04/${currentYear - 1} - 31/03/${currentYear}`;
    }
  };

  // Generate next 10 years of Indian FY with start and end dates
  const generateIndianFYOptions = () => {
    const options = [];
    const currentFY = getCurrentIndianFY();
    const startYear = parseInt(currentFY.split('/')[2]);
    
    for (let i = 0; i < 10; i++) {
      const year = startYear + i;
      const fy = `01/04/${year} - 31/03/${year + 1}`;
      options.push(fy);
    }
    
    return options;
  };

  const [formData, setFormData] = useState({
    clientName: '',
    businessName: '',
    indianFYear: getCurrentIndianFY(),
    gstType: 'REGULAR',
    gstNo: '',
    address: '',
    contact: '',
    returnFrequency: 'MONTHLY'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }
    
    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    
    if (!formData.indianFYear.trim()) {
      newErrors.indianFYear = 'Financial year is required';
    }
    
    if (!formData.gstNo.trim()) {
      newErrors.gstNo = 'GST number is required';
    } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNo)) {
      newErrors.gstNo = 'Invalid GST number format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addClient(formData);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Failed to add client. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      clientName: '',
      businessName: '',
      indianFYear: getCurrentIndianFY(),
      gstType: 'REGULAR',
      gstNo: '',
      address: '',
      contact: '',
      returnFrequency: 'MONTHLY'
    });
    setErrors({});
  };

  if (isSuccess) {
    return (
      <div className="form-overlay">
        <div className="success-modal">
          <div className="success-icon">
            <CheckCircle />
          </div>
          <h2>Client Added Successfully!</h2>
          <p>Your new client has been created.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-overlay">
      <div className="minimal-form">
        <div className="form-header">
          <h2>Add New Client</h2>
          <button className="close-btn" onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="client-form">
          <div className="form-group">
            <label htmlFor="clientName">Client Name *</label>
            <input
              type="text"
              id="clientName"
              name="clientName"
              value={formData.clientName}
              onChange={handleInputChange}
              className={errors.clientName ? 'error' : ''}
              placeholder="Enter client name"
            />
            {errors.clientName && <span className="error-message">{errors.clientName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="businessName">Business Name *</label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              className={errors.businessName ? 'error' : ''}
              placeholder="Enter business name"
            />
            {errors.businessName && <span className="error-message">{errors.businessName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="indianFYear">Financial Year *</label>
            <select
              id="indianFYear"
              name="indianFYear"
              value={formData.indianFYear}
              onChange={handleInputChange}
              className={errors.indianFYear ? 'error' : ''}
            >
              {generateIndianFYOptions().map((fy) => (
                <option key={fy} value={fy}>
                  {fy}
                </option>
              ))}
            </select>
            {errors.indianFYear && <span className="error-message">{errors.indianFYear}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="gstType">GST Type *</label>
            <select
              id="gstType"
              name="gstType"
              value={formData.gstType}
              onChange={handleInputChange}
            >
              <option value="REGULAR">Regular</option>
              <option value="COMPOSITION">Composition</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="gstNo">GST Number *</label>
            <input
              type="text"
              id="gstNo"
              name="gstNo"
              value={formData.gstNo}
              onChange={handleInputChange}
              className={errors.gstNo ? 'error' : ''}
              placeholder="e.g., 22ABCDE1234F1Z5"
              maxLength="15"
            />
            {errors.gstNo && <span className="error-message">{errors.gstNo}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="returnFrequency">Return Frequency *</label>
            <select
              id="returnFrequency"
              name="returnFrequency"
              value={formData.returnFrequency}
              onChange={handleInputChange}
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUATARY">Quarterly</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address (Optional)</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter complete address"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact">Contact (Optional)</label>
            <input
              type="text"
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleInputChange}
              placeholder="Enter contact number or email"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              Reset
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClientForm;
