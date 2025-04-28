// src/contexts/ArchiveContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Create context
const ArchiveContext = createContext();

// Initial state
const initialState = {
  documents: [],
  filteredDocuments: [],
  loading: false,
  error: null,
  filters: {
    documentType: 'وارد',
    searchText: '',
    entity: '',
    project: '',
    documentNumber: '',
    subject: '',
    dateRange: null,
    copiedTo: []
  }
};

// Reducer function
function archiveReducer(state, action) {
  switch (action.type) {
    case 'FETCH_DOCUMENTS_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_DOCUMENTS_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        documents: action.payload,
        filteredDocuments: filterDocuments(action.payload, state.filters)
      };
    case 'FETCH_DOCUMENTS_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'ADD_DOCUMENT':
      const updatedDocs = [...state.documents, action.payload];
      return { 
        ...state, 
        documents: updatedDocs,
        filteredDocuments: filterDocuments(updatedDocs, state.filters)
      };
    case 'UPDATE_DOCUMENT':
      const updatedDocuments = state.documents.map(doc => 
        doc.id === action.payload.id ? action.payload : doc
      );
      return { 
        ...state, 
        documents: updatedDocuments,
        filteredDocuments: filterDocuments(updatedDocuments, state.filters)
      };
    case 'DELETE_DOCUMENT':
      const remainingDocs = state.documents.filter(doc => doc.id !== action.payload);
      return { 
        ...state, 
        documents: remainingDocs,
        filteredDocuments: filterDocuments(remainingDocs, state.filters)
      };
    case 'UPDATE_FILTER':
      const newFilters = { ...state.filters, [action.payload.key]: action.payload.value };
      return {
        ...state,
        filters: newFilters,
        filteredDocuments: filterDocuments(state.documents, newFilters)
      };
    case 'RESET_FILTERS':
      return {
        ...state,
        filters: initialState.filters,
        filteredDocuments: state.documents
      };
    default:
      return state;
  }
}

// Helper function to filter documents based on filters
function filterDocuments(documents, filters) {
  return documents.filter(doc => {
    // Filter by document type
    if (filters.documentType !== 'الكل' && doc.documentType !== filters.documentType) {
      return false;
    }
    
    // Filter by search text (look in multiple fields)
    if (filters.searchText && !doc.title.includes(filters.searchText) && 
        !doc.documentNumber.includes(filters.searchText) && 
        !doc.subject.includes(filters.searchText)) {
      return false;
    }
    
    // Filter by project
    if (filters.project && doc.project !== filters.project) {
      return false;
    }
    
    // Filter by entity
    if (filters.entity && doc.entity !== filters.entity) {
      return false;
    }
    
    // Filter by document number
    if (filters.documentNumber && !doc.documentNumber.includes(filters.documentNumber)) {
      return false;
    }
    
    // Filter by subject
    if (filters.subject && !doc.subject.includes(filters.subject)) {
      return false;
    }
    
    // Filter by date range
    if (filters.dateRange && filters.dateRange.length === 2) {
      const docDate = new Date(doc.date);
      const startDate = new Date(filters.dateRange[0]);
      const endDate = new Date(filters.dateRange[1]);
      
      if (docDate < startDate || docDate > endDate) {
        return false;
      }
    }
    
    // Filter by copied to
    if (filters.copiedTo.length > 0) {
      if (!doc.copiedTo || !filters.copiedTo.some(entity => doc.copiedTo.includes(entity))) {
        return false;
      }
    }
    
    return true;
  });
}

// Provider component
export const ArchiveProvider = ({ children }) => {
  const [state, dispatch] = useReducer(archiveReducer, initialState);
  
  // Fetch documents on initial render
  useEffect(() => {
    const loadDocuments = async () => {
      dispatch({ type: 'FETCH_DOCUMENTS_START' });
      try {
        const data = await fetchDocuments();
        dispatch({ type: 'FETCH_DOCUMENTS_SUCCESS', payload: data });
      } catch (error) {
        dispatch({ type: 'FETCH_DOCUMENTS_ERROR', payload: error.message });
      }
    };
    
    loadDocuments();
  }, []);
  
  // Functions to handle document operations
  const handleAddDocument = async (document) => {
    try {
      const newDocument = await addDocument(document);
      dispatch({ type: 'ADD_DOCUMENT', payload: newDocument });
      return newDocument;
    } catch (error) {
      dispatch({ type: 'FETCH_DOCUMENTS_ERROR', payload: error.message });
      throw error;
    }
  };
  
  const handleUpdateDocument = async (document) => {
    try {
      const updatedDocument = await updateDocument(document);
      dispatch({ type: 'UPDATE_DOCUMENT', payload: updatedDocument });
      return updatedDocument;
    } catch (error) {
      dispatch({ type: 'FETCH_DOCUMENTS_ERROR', payload: error.message });
      throw error;
    }
  };
  
  const handleDeleteDocument = async (id) => {
    try {
      await deleteDocument(id);
      dispatch({ type: 'DELETE_DOCUMENT', payload: id });
    } catch (error) {
      dispatch({ type: 'FETCH_DOCUMENTS_ERROR', payload: error.message });
      throw error;
    }
  };
  
  const updateFilter = (key, value) => {
    dispatch({ type: 'UPDATE_FILTER', payload: { key, value } });
  };
  
  const resetFilters = () => {
    dispatch({ type: 'RESET_FILTERS' });
  };
  
  return (
    <ArchiveContext.Provider
      value={{
        documents: state.documents,
        filteredDocuments: state.filteredDocuments,
        loading: state.loading,
        error: state.error,
        filters: state.filters,
        addDocument: handleAddDocument,
        updateDocument: handleUpdateDocument,
        deleteDocument: handleDeleteDocument,
        updateFilter,
        resetFilters
      }}
    >
      {children}
    </ArchiveContext.Provider>
  );
};

// Custom hook for using the archive context
export const useArchive = () => {
  const context = useContext(ArchiveContext);
  if (!context) {
    throw new Error('useArchive must be used within an ArchiveProvider');
  }
  return context;
};
