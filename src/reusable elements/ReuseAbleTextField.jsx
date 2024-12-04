import React, { useEffect, useState, forwardRef } from "react";
import PropTypes from "prop-types"; // PropTypes for type-checking
import axios from "axios"; // Axios for fetching data
import ImagePreviewer from "./../reusable/ImagePreViewer.jsx"; // ImagePreviewer component

const TextFieldForm = forwardRef(
  (
    {
      fields, // Array of form field configurations
      fetchUrl, // URL to fetch dropdown options
      onFormSubmit, // Function to handle form submission
      onReset, // Function to handle form reset
      formClassName, // Class name for the form
      inputClassName, // Class name for input fields
      dropdownClassName, // Class name for dropdowns
      fieldWrapperClassName, // Class name for field wrappers
      buttonClassName, // Class name for buttons
      hideButtons = false, // Flag to hide search and reset buttons
      showImagePreviewer = false, // Flag to show/hide ImagePreviewer
      uploadedImages = [], // Array of uploaded images for ImagePreviewer
      onImageUpload, // Function to handle image upload
      showAddButton = false, // Flag to show/hide Add button
      onAdd, // Function to handle Add button click
    },
    ref
  ) => {
    const [formData, setFormData] = useState({}); // State to store form data
    const [dropdownOptions, setDropdownOptions] = useState({}); // State for dynamic dropdown options

    useEffect(() => {
      const fetchOptions = async () => {
        if (!fetchUrl) return; // Skip if no fetchUrl is provided
        try {
          const response = await axios.get(fetchUrl); // Fetch data
          setDropdownOptions(response.data); // Store fetched options
        } catch (err) {
          console.error("Error fetching dropdown options:", err);
        }
      };

      fetchOptions();
    }, [fetchUrl]);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
      if (onFormSubmit) {
        onFormSubmit(formData);
      }
    };

    const handleReset = () => {
      setFormData({}); // Clear form data
      if (onReset) {
        onReset();
      }
    };

    React.useImperativeHandle(ref, () => ({
      getFormData: () => formData,
      reset: handleReset,
      submit: handleSubmit,
    }));

    return (
      <form className={formClassName} dir="rtl">
        <div>
          {fields.map((field, index) => (
            <div
              key={index}
              className={`${fieldWrapperClassName} ${
                field.type === "dropdown" ? "dropdown-wrapper" : ""
              }`}
            >
              {/* Render dropdowns */}
              {field.type === "dropdown" ? (
                <>
                  <label htmlFor={field.name}>{field.label}</label>
                  <select
                    id={field.name}
                    name={field.name}
                    onChange={handleChange}
                    className={dropdownClassName}
                    value={formData[field.name] || ""}
                    disabled={field.disabled || false} // Apply the disabled property
                  >
                    <option value="">{field.placeholder}</option>
                    {(dropdownOptions[field.name] || field.options || []).map(
                      (option, idx) => (
                        <option key={idx} value={option.value}>
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </>
              ) : field.type === "textarea" ? (
                // Render textareas
                <>
                  <label htmlFor={field.name}>{field.label}</label>
                  <textarea
                    id={field.name}
                    name={field.name}
                    placeholder={field.placeholder}
                    onChange={handleChange}
                    value={formData[field.name] || ""}
                    className={inputClassName}
                    rows={field.rows || 3}
                    cols={field.cols || 50}
                    disabled={field.disabled || false} // Apply the disabled property
                  />
                </>
              ) : (
                // Render text inputs
                <>
                  <label htmlFor={field.name}>{field.label}</label>
                  <input
                    id={field.name}
                    type={field.type || "text"}
                    name={field.name}
                    placeholder={field.placeholder}
                    onChange={handleChange}
                    value={formData[field.name] || ""}
                    className={inputClassName}
                    disabled={field.disabled || false} // Apply the disabled property
                  />
                </>
              )}
            </div>
          ))}

          {/* ImagePreviewer section */}
          {showImagePreviewer && (
            <div className="image-previewer-section">
              <ImagePreviewer
                uploadedImages={uploadedImages} // Pass uploaded images
                onImageUpload={onImageUpload} // Handle image uploads
              />
            </div>
          )}
        </div>

        {/* Conditional Buttons */}
        <div className="filter-buttons">
          {!hideButtons && (
            <>
              <button
                type="button"
                className={`${buttonClassName} apply-button`}
                onClick={handleSubmit}
              >
                ابحث
              </button>
              <button
                type="button"
                className={`${buttonClassName} reset-button`}
                onClick={handleReset}
              >
                إعادة تعيين
              </button>
            </>
          )}

          {/* Add Button */}
          {showAddButton && (
            <button
              type="button"
              className={`${buttonClassName} add-button`}
              onClick={onAdd}
            >
              إضافة
            </button>
          )}
        </div>
      </form>
    );
  }
);

TextFieldForm.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired, // Field name
      label: PropTypes.string, // Field label
      placeholder: PropTypes.string, // Placeholder text
      type: PropTypes.string, // Field type
      options: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        })
      ), // Dropdown options
      rows: PropTypes.number, // For textarea rows
      cols: PropTypes.number, // For textarea cols
      disabled: PropTypes.bool, // Disabled property for the field
    })
  ).isRequired,
  fetchUrl: PropTypes.string, // URL to fetch dropdown options
  onFormSubmit: PropTypes.func, // Form submit handler
  onReset: PropTypes.func, // Reset handler
  formClassName: PropTypes.string, // Form class name
  inputClassName: PropTypes.string, // Input class name
  dropdownClassName: PropTypes.string, // Dropdown class name
  fieldWrapperClassName: PropTypes.string, // Field wrapper class name
  buttonClassName: PropTypes.string, // Button class name
  hideButtons: PropTypes.bool, // Hide search and reset buttons
  showImagePreviewer: PropTypes.bool, // Show/hide ImagePreviewer
  uploadedImages: PropTypes.array, // Uploaded images
  onImageUpload: PropTypes.func, // Image upload handler
  showAddButton: PropTypes.bool, // Show/hide Add button
  onAdd: PropTypes.func, // Add button handler
};

export default TextFieldForm;
