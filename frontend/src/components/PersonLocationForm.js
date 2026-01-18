import React, { useState } from 'react';
import axios from 'axios';
import './PersonLocationForm.css';

const PersonLocationForm = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    streetName: '',
    city: '',
    zipCode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update this with your Azure Functions endpoint URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:7071/api';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!formData.firstName.trim() || !formData.lastName.trim() || 
        !formData.phoneNumber.trim() || !formData.streetName.trim() || 
        !formData.city.trim() || !formData.zipCode.trim()) {
      onError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}/storePersonLocation`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        streetName: formData.streetName,
        city: formData.city,
        zipCode: formData.zipCode
      });

      if (response.status === 200 || response.status === 201) {
        setFormData({ 
          firstName: '', 
          lastName: '', 
          phoneNumber: '', 
          streetName: '', 
          city: '', 
          zipCode: '' 
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Error storing data:', error);
      onError(error.response?.data?.error || 'Failed to store data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="person-location-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName">First Name *</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Enter first name"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name *</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Enter last name"
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="phoneNumber">Phone Number *</label>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="Enter phone number"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="streetName">Street Name *</label>
        <input
          type="text"
          id="streetName"
          name="streetName"
          value={formData.streetName}
          onChange={handleChange}
          placeholder="Enter street name and number"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="city">City *</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter city"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="zipCode">Zip Code *</label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            placeholder="Enter zip code"
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <button 
        type="submit" 
        className="submit-button"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Storing...' : 'Store Information'}
      </button>
    </form>
  );
};

export default PersonLocationForm;
