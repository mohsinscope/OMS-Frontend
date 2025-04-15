import React, { useState } from 'react';
import { Layout, ConfigProvider } from 'antd';
import { Link } from 'react-router-dom'; // Add this import
// import ArchiveHeader from './../components/ArchiveHeader.jsx';
// import FilterPanel from './../components/FilterPanel.jsx';
import DocumentsTable from './../components/DocumentsTable.jsx';
// import AddDocumentForm from './../components/AddDocumentForm.jsx';
// import ViewDocumentModal from './../components/ViewDocumentModal.jsx';
// import { ArchiveProvider } from './../contexts/ArchiveContext.jsx';
import ar_EG from 'antd/lib/locale/ar_EG';
import '../styles/archiveStyles.css';

const { Content } = Layout;

const ArchivePage = () => {


  const showViewModal = (document) => {
    setCurrentDocument(document);
    setIsViewModalVisible(true);
  };



  return (
    <ConfigProvider locale={ar_EG} direction="rtl">
        <Layout className="archive-layout">
          <Content className="archive-content">
              <Link to="/AddArchive" >
                <button 
                  className="add-document-button" 
                  // onClick={showAddModal}
                >
                  <span className="add-icon">+</span>
                  ارشفة كتاب
                </button>
              </Link>
                
            {/* <ArchiveHeader /> */}
            
            <div className="archive-container">
              {/* <FilterPanel /> */}
              <DocumentsTable onViewDocument={showViewModal} />
            </div>
            
            {/* <AddDocumentForm 
              visible={isAddModalVisible}
              onClose={handleAddModalClose}
            /> */}
            
            {/* <ViewDocumentModal
              visible={isViewModalVisible}
              document={currentDocument}
              onClose={handleViewModalClose}
            /> */}
          </Content>
        </Layout>
    </ConfigProvider>
  );
};

export default ArchivePage;