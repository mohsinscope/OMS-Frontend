// import React from 'react';
// import { Card, Tag, Typography, Space, Button, Tooltip, Badge } from 'antd';
// import { 
//   FileTextOutlined, 
//   CalendarOutlined, 
//   NumberOutlined,
//   UserOutlined, 
//   ProjectOutlined,
//   EyeOutlined,
//   EditOutlined
// } from '@ant-design/icons';

// const { Text, Title } = Typography;

// /**
//  * DocumentCard - A reusable component to display document information
//  * @param {Object} document - The document data to display
//  * @param {boolean} isReferenced - Whether this document is referenced by another
//  * @param {Function} onView - Function to handle viewing the document
//  * @param {Function} onEdit - Function to handle editing the document
//  */
// const DocumentCard = ({ document, isReferenced = false, onView, onEdit }) => {
//   if (!document) return null;
  
//   // Determine document type tag color
//   const getTypeColor = (type) => {
//     if (type?.includes('صادر')) return 'blue';
//     if (type?.includes('وارد')) return 'green';
//     return 'default';
//   };
  
//   // Determine document status tag color
//   const getStatusColor = (option) => {
//     if (option?.includes('جديد')) return 'green';
//     if (option?.includes('اجابة')) return 'purple';
//     if (option?.includes('تأكيد')) return 'orange';
//     return 'default';
//   };

//   return (
//     <Card
//       className="document-card"
//       bordered={true}
//       actions={[
//         <Tooltip title="عرض الكتاب">
//           <Button 
//             type="text" 
//             icon={<EyeOutlined />} 
//             onClick={() => onView && onView(document)}
//           >
//             عرض
//           </Button>
//         </Tooltip>,
//         !isReferenced && (
//           <Tooltip title="تعديل الكتاب">
//             <Button 
//               type="text" 
//               icon={<EditOutlined />} 
//               onClick={() => onEdit && onEdit(document)}
//             >
//               تعديل
//             </Button>
//           </Tooltip>
//         )
//       ].filter(Boolean)}
//     >
//       {isReferenced && (
//         <Badge.Ribbon text="مستند مرجعي" color="blue" />
//       )}
      
//       <Space direction="vertical" size="small" style={{ width: '100%' }}>
//         <Title level={5} style={{ margin: 0 }}>
//           {document.title}
//         </Title>
        
//         <Space wrap>
//           {document.documentSide && (
//             <Tag color={getTypeColor(document.documentSide)} icon={<FileTextOutlined />}>
//               {document.documentSide}
//             </Tag>
//           )}
          
//           {document.documentOption && (
//             <Tag color={getStatusColor(document.documentOption)}>
//               {document.documentOption}
//             </Tag>
//           )}
//         </Space>
        
//         <Space direction="vertical" size={0} style={{ width: '100%' }}>
//           <Text type="secondary">
//             <NumberOutlined /> رقم الكتاب: <Text strong>{document.documentNumber}</Text>
//           </Text>
          
//           <Text type="secondary">
//             <CalendarOutlined /> التاريخ: <Text strong>
//               {document.date instanceof Date 
//                 ? document.date.toLocaleDateString('ar-SA')
//                 : document.date}
//             </Text>
//           </Text>
          
//           {document.entity && (
//             <Text type="secondary">
//               <UserOutlined /> الجهة: <Text strong>{document.entity}</Text>
//             </Text>
//           )}
          
//           {document.project && (
//             <Text type="secondary">
//               <ProjectOutlined /> المشروع: <Text strong>{document.project}</Text>
//             </Text>
//           )}
//         </Space>
        
//         {document.subject && (
//           <div className="document-subject">
//             <Text type="secondary" style={{ fontSize: '12px' }}>الموضوع:</Text>
//             <div className="subject-content">
//               <Text ellipsis={{ rows: 2, expandable: true, symbol: 'المزيد' }}>
//                 {document.subject}
//               </Text>
//             </div>
//           </div>
//         )}
//       </Space>
//     </Card>
//   );
// };

// export default DocumentCard;




//dont used yet