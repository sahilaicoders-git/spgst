import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, User, Building, Calendar, Hash, MapPin, Phone, RotateCcw, CheckCircle, ChevronRight } from 'lucide-react';
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

  const [currentStep, setCurrentStep] = useState(1);
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

  const steps = [
    {
      id: 1,
      title: 'Basic Information',
      description: 'Enter client and business details',
      icon: User
    },
    {
      id: 2,
      title: 'GST Details',
      description: 'Configure GST settings',
      icon: Hash
    },
    {
      id: 3,
      title: 'Additional Information',
      description: 'Add contact and address details',
      icon: MapPin
    },
    {
      id: 4,
      title: 'Review & Save',
      description: 'Review all information and save',
      icon: CheckCircle
    }
  ];

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

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.clientName.trim()) {
          newErrors.clientName = 'Client name is required';
        }
        if (!formData.businessName.trim()) {
          newErrors.businessName = 'Business name is required';
        }
        break;
      case 2:
        if (!formData.indianFYear.trim()) {
          newErrors.indianFYear = 'Financial year is required';
        }
        if (!formData.gstNo.trim()) {
          newErrors.gstNo = 'GST number is required';
        } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNo)) {
          newErrors.gstNo = 'Invalid GST number format';
        }
        break;
      case 3:
        // Optional fields, no validation required
        break;
      case 4:
        // Final validation - check all required fields
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
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
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
    setCurrentStep(1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <div className="step-header">
              <User className="step-icon" />
              <div>
                <h3>Basic Information</h3>
                <p>Let's start with the basic client and business information.</p>
              </div>
            </div>
            
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
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <div className="step-header">
              <Hash className="step-icon" />
              <div>
                <h3>GST Details</h3>
                <p>Configure the GST settings for this client.</p>
              </div>
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
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <div className="step-header">
              <MapPin className="step-icon" />
              <div>
                <h3>Additional Information</h3>
                <p>Add optional contact and address details.</p>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="address">Address (Optional)</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter complete address"
                rows="4"
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
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <div className="step-header">
              <CheckCircle className="step-icon" />
              <div>
                <h3>Review & Save</h3>
                <p>Please review all the information before saving.</p>
              </div>
            </div>
            
            <div className="review-section">
              <div className="review-group">
                <h4>Basic Information</h4>
                <div className="review-item">
                  <span className="review-label">Client Name:</span>
                  <span className="review-value">{formData.clientName}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Business Name:</span>
                  <span className="review-value">{formData.businessName}</span>
                </div>
              </div>

              <div className="review-group">
                <h4>GST Details</h4>
                <div className="review-item">
                  <span className="review-label">Financial Year:</span>
                  <span className="review-value">{formData.indianFYear}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">GST Type:</span>
                  <span className="review-value">{formData.gstType}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">GST Number:</span>
                  <span className="review-value">{formData.gstNo}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Return Frequency:</span>
                  <span className="review-value">{formData.returnFrequency}</span>
                </div>
              </div>

              {(formData.address || formData.contact) && (
                <div className="review-group">
                  <h4>Additional Information</h4>
                  {formData.address && (
                    <div className="review-item">
                      <span className="review-label">Address:</span>
                      <span className="review-value">{formData.address}</span>
                    </div>
                  )}
                  {formData.contact && (
                    <div className="review-item">
                      <span className="review-label">Contact:</span>
                      <span className="review-value">{formData.contact}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isSuccess) {
    return (
      <div className="add-client-page">
        <div className="page-header">
          <button className="back-btn" onClick={onClose}>
            <ArrowLeft />
            Back to Client List
          </button>
          <h1>Add New Client</h1>
        </div>
        <div className="success-container">
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
    <div className="add-client-page">
      <div className="page-header">
        <button className="back-btn" onClick={onClose}>
          <ArrowLeft />
          Back to Client List
        </button>
        <h1>Add New Client</h1>
      </div>
      
      <div className="form-container">
        {/* Simple Dot Progress Indicator */}
        <div className="progress-container">
          <div className="progress-bar">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className={`progress-step ${currentStep >= step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}>
                  <div className="step-dot"></div>
                  <span className="step-title">{step.title}</span>
                </div>
                {index < steps.length - 1 && <div className="step-connector"></div>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="form-card">
          {renderStepContent()}
          
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              <RotateCcw size={16} />
              Reset
            </button>
            
            <div className="step-navigation">
              {currentStep > 1 && (
                <button type="button" className="btn btn-outline" onClick={handlePrevious}>
                  <ArrowLeft size={16} />
                  Previous
                </button>
              )}
              
              {currentStep < steps.length ? (
                <button type="button" className="btn btn-primary" onClick={handleNext}>
                  Next
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Client'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddClientForm;