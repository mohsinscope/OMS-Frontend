// // src/components/archive/ViewDocumentModal.jsx
// import React, { useState } from 'react';
// import { 
//   Modal, 
//   Descriptions, 
//   Button, 
//   Tabs, 
//   Timeline, 
//   Tag, 
//   Divider,
//   Typography,
//   Space
// } from 'antd';
// import { 
//   FileTextOutlined, 
//   HistoryOutlined, 
//   FilePdfOutlined, 
//   FileImageOutlined,
//   CloseOutlined
// } from '@ant-design/icons';

// const { TabPane } = Tabs;
// const { Paragraph, Text } = Typography;

// // Mock history data - in a real app this would come from your API
// const mockHistory = [
//   { action: 'إنشاء', user: 'أحمد محمد', timestamp: '2023-04-10 09:32', comments: 'تم إنشاء الكتاب' },
//   { action: 'عرض', user: 'فاطمة أحمد', timestamp: '2023-04-10 11:45', comments: null },
//   { action: 'تعديل', user: 'محمد علي', timestamp: '2023-04-11 14:20', comments: 'تم تعديل عنوان الكتاب' },
// ];

// const ViewDocumentModal = ({ visible, document, onClose }) => {
//   const [activeTab, setActiveTab] = useState('details');
  
//   if (!document) return null;
  
//   // Document type color mapping
//   const documentTypeColors = {
//     'وارد': 'blue',
//     'صادر': 'green',
//     'إجابة على وارد': 'purple',
//     'إجابة على صادر': 'cyan',
//     'تأكيد وارد': 'gold',
//     'تأكيد صادر': 'orange'
//   };
  
//   // Render file icon based on file type
//   const renderFileIcon = (file) => {
//     if (!file) return null;
    
//     if (file.type === 'application/pdf') {
//       return <FilePdfOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />;
//     } else if (file.type.startsWith('image/')) {
//       return <FileImageOutlined style={{ fontSize: '24px', color: '#1890ff' }} />;
//     } else {
//       return <FileTextOutlined style={{ fontSize: '24px', color: '#52c41a' }} />;
//     }
//   };
  
//   return (
//     <Modal
//       title={`عرض تفاصيل الكتاب: ${document.title}`}
//       open={visible}
//       onCancel={onClose}
//       width={800}
//       footer={[
//         <Button key="close" onClick={onClose} icon={<CloseOutlined />}>
//           إغلاق
//         </Button>
//       ]}
//       className="view-document-modal"
//     >
//       <Tabs activeKey={activeTab} onChange={setActiveTab}>
//         <TabPane 
//           tab={<span><FileTextOutlined /> تفاصيل الكتاب</span>} 
//           key="details"
//         >
//           <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }}>
//             <Descriptions.Item label="رقم الكتاب">
//               {document.documentNumber}
//             </Descriptions.Item>
            
//             <Descriptions.Item label="نوع الكتاب">
//               <Tag color={documentTypeColors[document.documentType]}>
//                 {document.documentType}
//               </Tag>
//             </Descriptions.Item>
            
//             <Descriptions.Item label="المشروع">
//               {document.project}
//             </Descriptions.Item>
            
//             <Descriptions.Item label="التاريخ">
//               {new Date(document.date).toLocaleDateString('ar-SA')}
//             </Descriptions.Item>
            
//             <Descriptions.Item label="الجهة" span={2}>
//               {document.entity}
//             </Descriptions.Item>
            
//             <Descriptions.Item label="العنوان" span={2}>
//               {document.title}
//             </Descriptions.Item>
            
//             <Descriptions.Item label="الموضوع" span={2}>
//               <Paragraph style={{ margin: 0 }}>{document.subject}</Paragraph>
//             </Descriptions.Item>
            
//             {document.copiedTo && document.copiedTo.length > 0 && (
//               <Descriptions.Item label="نسخة إلى (CC)" span={2}>
//                 <Space wrap>
//                   {document.copiedTo.map(entity => (
//                     <Tag key={entity}>{entity}</Tag>
//                   ))}
//                 </Space>
//               </Descriptions.Item>
//             )}
            
//             {document.notes && (
//               <Descriptions.Item label="ملاحظات" span={2}>
//                 <Paragraph style={{ margin: 0 }}>{document.notes}</Paragraph>
//               </Descriptions.Item>
//             )}
            
//             {document.file && (
//               <Descriptions.Item label="المرفقات" span={2}>
//                 <div className="attachment-item">
//                   {renderFileIcon(document.file)}
//                   <a href={document.file.url} target="_blank" rel="noopener noreferrer">
//                     {document.file.name}
//                   </a>
//                 </div>
//               </Descriptions.Item>
//             )}
            
//             {document.referencedDocumentId && (
//               <Descriptions.Item label="مرجع إلى" span={2}>
//                 <Text strong>رقم الكتاب: {document.referencedDocumentId}</Text>
//               </Descriptions.Item>
//             )}
//           </Descriptions>
//         </TabPane>
        
//         <TabPane 
//           tab={<span><HistoryOutlined /> سجل العمليات</span>} 
//           key="history"
//         >
//           <Timeline mode="left">
//             {mockHistory.map((item, index) => (
//               <Timeline.Item key={index} label={item.timestamp}>
//                 <div className="history-item">
//                   <Space direction="vertical" size="small">
//                     <Text strong>{item.action} بواسطة {item.user}</Text>
//                     {item.comments && <Text type="secondary">{item.comments}</Text>}
//                   </Space>
//                 </div>
//               </Timeline.Item>
//             ))}
//           </Timeline>
//         </TabPane>
//       </Tabs>
//     </Modal>
//   );
// };

// export default ViewDocumentModal;