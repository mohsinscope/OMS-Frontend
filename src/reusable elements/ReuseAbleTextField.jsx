import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import useAuthStore from './../store/store.js';
const TextFieldForm = forwardRef(
  (
    {
      fields,
      fetchUrl,
      onFormSubmit,
      onError,
      formClassName,
      inputClassName,
      errorClassName,
    },
    ref
  ) => {
    const [formData, setFormData] = useState({});
    const [users, setUsers] = useState([]);
    const { login, isLoggedIn, error } = useAuthStore();

    useEffect(() => {
      const fetchUsers = async () => {
        try {
          if (typeof fetchUrl === "string") {
            const response = await axios.get(fetchUrl);
            setUsers(Array.isArray(response.data) ? response.data : response.data.users || []);
          } else if (Array.isArray(fetchUrl)) {
            setUsers(fetchUrl);
          } else {
            throw new Error("Invalid fetchUrl. Must be a string URL or an array.");
          }
        } catch (fetchError) {
          console.error("Failed to fetch users:", fetchError.message);
          if (onError) onError(fetchError);
        }
      };

      fetchUsers();
    }, [fetchUrl, onError]);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
      const { username, password } = formData;

      if (!username || !password) {
        setErrorMessage("Both username and password are required.");
        return;
      }

      login(username, password, users);

      if (isLoggedIn) {
        onFormSubmit(); // Call login success handler
      }
    };

    // Expose the `submit` method to the parent component
    useImperativeHandle(ref, () => ({
      submit: handleSubmit,
    }));

    return (
      <div>
        {error && <p className={errorClassName}>{error}</p>}
        <form className={formClassName}>
          {fields.map((field, index) => (
            <div key={index}>
              <input
                type={field.type || "text"}
                placeholder={field.placeholder}
                name={field.name}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>
          ))}
        </form>
      </div>
    );
  }
);

TextFieldForm.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      placeholder: PropTypes.string.isRequired,
      type: PropTypes.string,
    })
  ).isRequired,
  fetchUrl: PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired, // URL or JSON array
  onFormSubmit: PropTypes.func, // Callback for form submission
  onError: PropTypes.func, // Callback for fetch errors
  formClassName: PropTypes.string, // Class name for the form
  inputClassName: PropTypes.string, // Class name for the input fields
  errorClassName: PropTypes.string, // Class name for the error message
};

export default TextFieldForm;
