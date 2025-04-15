// // src/components/archive/OperationsColumn.jsx
// import React, { useState } from 'react';
// import { 
//   Button, 
//   Tooltip, 
//   Popconfirm, 
//   Space, 
//   message, 
//   Modal 
// } from 'antd';
// import { 
//   EyeOutlined, 
//   EditOutlined, 
//   DeleteOutlined, 
//   LinkOutlined,
//   CheckOutlined 
// } from '@ant-design/icons';
// import { useArchive } from './../contexts/ArchiveContext.jsx';
// import AddDocumentForm from './AddDocumentForm.jsx';

// const OperationsColumn = ({ document, onView }) => {
//   const { deleteDocument } = useArchive();
//   const [isEditModalVisible, setIsEditModalVisible] = useState(false);
//   const [isReplyModalVisible, setIsReplyModalVisible] = useState(false);
//   const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  
//   const handleDelete = async () => {
//     try {
//       await deleteDocument(document.id);
//       message.success('تم حذف الكتاب بنجاح');
//     } catch (error) {
//       message.error('حدث خطأ أثناء حذف الكتاب');
//     }
//   };
  
//   const showEditModal = () => {
//     setIsEditModalVisible(true);
//   };
  
//   const showReplyModal = () => {
//     setIsReplyModalVisible(true);
//   };
  
//   const showConfirmModal = () => {
//     setIsConfirmModalVisible(true);
//   };
  
//   const handleEditModalClose = () => {
//     setIsEditModalVisible(false);
//   };
  
//   const handleReplyModalClose = () => {
//     setIsReplyModalVisible(false);
//   };
  
//   const handleConfirmModalClose = () => {
//     setIsConfirmModalVisible(false);
//   };
  
//   // Determine which buttons to show based on document type
//   const showReplyButton = document.documentType === 'وارد' || document.documentType === 'صادر';
//   const showConfirmButton = document.documentType === 'وارد' || document.documentType === 'صادر';
  
//   return (
//     <>
//       <Space size="small" className="operations-buttons">
//         <Tooltip title="عرض">
//           <Button 
            
//             type="default" 
//             icon={<EyeOutlined />} 
//             size="small" 
//             onClick={onView} 
//             className="view-button"
//           /> 
//         </Tooltip>
        
//         <Tooltip title="تعديل">
//           <Button 
//             type="default" 
//             icon={<EditOutlined />} 
//             size="small" 
//             onClick={showEditModal} 
//             className="edit-button"
//           />
//         </Tooltip>
        
//         {showReplyButton && (
//           <Tooltip title="إضافة رد">
//             <Button 
              
//               type="default" 
//               icon={<LinkOutlined />} 
//               size="small" 
//               onClick={showReplyModal} 
//               className="reply-button"
//             />
//           </Tooltip>
//         )}
        
//         {showConfirmButton && (
//           <Tooltip title="تأكيد">
//             <Button 
//               type="default" 
//               icon={<CheckOutlined />} 
//               size="small" 
//               onClick={showConfirmModal} 
//               className="confirm-button"
//             />
//           </Tooltip>
//         )}
        
//         <Tooltip title="حذف">
//           <Popconfirm
//             title="هل أنت متأكد من حذف هذا الكتاب؟"
//             onConfirm={handleDelete}
//             okText="نعم"
//             cancelText="لا"
//             placement="topRight"
//           >
//             <Button 
//               type="default" 
//               danger 
//               icon={<DeleteOutlined />} 
//               size="small" 
//               className="delete-button"
//             />
//           </Popconfirm>
//         </Tooltip>
//       </Space>
      
//       {/* Edit Modal */}
//       <AddDocumentForm
//         visible={isEditModalVisible}
//         onClose={handleEditModalClose}
//         editMode={true}
//         initialValues={document}
//         title="تعديل كتاب"
//       />
      
//       {/* Reply Modal */}
//       <AddDocumentForm
//         visible={isReplyModalVisible}
//         onClose={handleReplyModalClose}
//         replyMode={true}
//         referencedDocument={document}
//         title={`إضافة رد على ${document?.documentType === 'وارد' ? 'وارد' : 'صادر'}`}
//         initialValues={{
//           documentType: document?.documentType === 'وارد' ? 'إجابة على وارد' : 'إجابة على صادر',
//           project: document?.project
//         }}
//       />
      
//       {/* Confirmation Modal */}
//       <AddDocumentForm
//         visible={isConfirmModalVisible}
//         onClose={handleConfirmModalClose}
//         confirmMode={true}
//         referencedDocument={document}
//         title={`تأكيد ${document?.documentType === 'وارد' ? 'وارد' : 'صادر'}`}
//         initialValues={{
//           documentType: document?.documentType === 'وارد' ? 'تأكيد وارد' : 'تأكيد صادر',
//           project: document?.project
//         }}
//       />
//     </>
//   );
// };

// export default OperationsColumn;