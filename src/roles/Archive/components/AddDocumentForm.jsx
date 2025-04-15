// // src/components/archive/AddDocumentForm.jsx
// import React, { useState } from 'react';
// import { 
//   Modal, 
//   Form, 
//   Input, 
//   Select, 
//   DatePicker, 
//   Upload, 
//   Button, 
//   message, 
//   Row, 
//   Col,
//   Divider 
// } from 'antd';
// import { 
//   InboxOutlined, 
//   SaveOutlined, 
//   CloseOutlined 
// } from '@ant-design/icons';
// import { useArchive } from './../contexts/ArchiveContext.jsx';

// const { Option } = Select;
// const { TextArea } = Input;
// const { Dragger } = Upload;

// const AddDocumentForm = ({ 
//   visible, 
//   onClose, 
//   editMode = false, 
//   replyMode = false,
//   confirmMode = false,
//   referencedDocument = null,
//   initialValues = {},
//   title = 'إضافة كتاب جديد'
// }) => {
//   const [form] = Form.useForm();
//   const { addDocument, updateDocument } = useArchive();
//   // src/components/archive/AddDocumentForm.jsx (continued)
//   const [fileList, setFileList] = useState([]);
//   const [submitting, setSubmitting] = useState(false);
  
//   // Mock data for select options
//   const documentTypes = ['وارد', 'صادر', 'إجابة على وارد', 'إجابة على صادر', 'تأكيد وارد', 'تأكيد صادر'];
//   const projects = ['جوازات إلكترونية', 'فيزا إلكترونية', 'البوابات الإلكترونية'];
//   const entities = ['وزارة الداخلية', 'وزارة الخارجية', 'جهة خارجية', 'إدارة تقنية المعلومات'];

//   // Reset form when modal visibility changes
//   React.useEffect(() => {
//     if (visible) {
//       form.resetFields();
//       if (editMode && initialValues) {
//         form.setFieldsValue({
//           ...initialValues,
//           date: initialValues.date ? moment(initialValues.date) : null
//         });
//       } else if ((replyMode || confirmMode) && initialValues) {
//         form.setFieldsValue(initialValues);
//       }
//     }
//   }, [visible, form, initialValues, editMode, replyMode, confirmMode]);

//   // Handle file upload
//   const fileUploadProps = {
//     name: 'file',
//     multiple: false,
//     fileList,
//     beforeUpload: (file) => {
//       const isPDF = file.type === 'application/pdf' || 
//                     file.type === 'image/jpeg' || 
//                     file.type === 'image/png';
//       if (!isPDF) {
//         message.error('يمكنك فقط رفع ملفات PDF أو صور!');
//         return false;
//       }
      
//       const isLt10M = file.size / 1024 / 1024 < 10;
//       if (!isLt10M) {
//         message.error('يجب أن يكون حجم الملف أقل من 10 ميجابايت!');
//         return false;
//       }
      
//       setFileList([file]);
//       return false; // Prevent automatic upload
//     },
//     onRemove: () => {
//       setFileList([]);
//     },
//   };

//   // Form submission
//   const handleSubmit = async () => {
//     try {
//       const values = await form.validateFields();
//       setSubmitting(true);
      
//       // Format date properly
//       if (values.date) {
//         values.date = values.date.format('YYYY-MM-DD');
//       }
      
//       // Add file info
//       if (fileList.length > 0) {
//         values.file = {
//           name: fileList[0].name,
//           type: fileList[0].type,
//           // In a real application, you would upload the file to a server
//           // and store the returned file URL or ID
//           url: 'mock-file-url' // Mock URL for demo
//         };
//       }
      
//       // Add reference to original document if in reply or confirm mode
//       if ((replyMode || confirmMode) && referencedDocument) {
//         values.referencedDocumentId = referencedDocument.id;
//       }
      
//       let result;
//       if (editMode && initialValues.id) {
//         result = await updateDocument({ ...values, id: initialValues.id });
//         message.success('تم تحديث الكتاب بنجاح');
//       } else {
//         result = await addDocument(values);
//         message.success('تم إضافة الكتاب بنجاح');
//       }
      
//       setSubmitting(false);
//       onClose();
//       return result;
//     } catch (error) {
//       setSubmitting(false);
//       message.error('حدث خطأ أثناء حفظ الكتاب');
//       console.error(error);
//     }
//   };

//   return (
//     <Modal
//       title={title}
//       open={visible}
//       onCancel={onClose}
//       width={800}
//       footer={[
//         <Button key="cancel" onClick={onClose} icon={<CloseOutlined />}>
//           إلغاء
//         </Button>,
//         <Button 
//           key="submit" 
//           type="primary" 
//           onClick={handleSubmit}
//           loading={submitting}
//           icon={<SaveOutlined />}
//         >
//           حفظ
//         </Button>
//       ]}
//       className="document-form-modal"
//     >
//       <Form
//         form={form}
//         layout="vertical"
//         className="document-form"
//         initialValues={initialValues}
//       >
//         <Row gutter={16}>
//           <Col xs={24} sm={12}>
//             <Form.Item
//               name="documentType"
//               label="نوع الكتاب"
//               rules={[{ required: true, message: 'الرجاء اختيار نوع الكتاب' }]}
//             >
//               <Select placeholder="اختر نوع الكتاب">
//                 {documentTypes.map(type => (
//                   <Option key={type} value={type}>{type}</Option>
//                 ))}
//               </Select>
//             </Form.Item>
//           </Col>
          
//           <Col xs={24} sm={12}>
//             <Form.Item
//               name="project"
//               label="المشروع"
//               rules={[{ required: true, message: 'الرجاء اختيار المشروع' }]}
//             >
//               <Select placeholder="اختر المشروع">
//                 {projects.map(project => (
//                   <Option key={project} value={project}>{project}</Option>
//                 ))}
//               </Select>
//             </Form.Item>
//           </Col>
//         </Row>
        
//         <Row gutter={16}>
//           <Col xs={24}>
//             <Form.Item
//               name="title"
//               label="عنوان الكتاب"
//               rules={[{ required: true, message: 'الرجاء إدخال عنوان الكتاب' }]}
//             >
//               <Input placeholder="أدخل عنوان الكتاب" />
//             </Form.Item>
//           </Col>
//         </Row>
        
//         <Row gutter={16}>
//           <Col xs={24} sm={12}>
//             <Form.Item
//               name="entity"
//               label="الجهة"
//               rules={[{ required: true, message: 'الرجاء اختيار الجهة' }]}
//             >
//               <Select
//                 placeholder="اختر الجهة"
//                 showSearch
//                 filterOption={(input, option) =>
//                   option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
//                 }
//               >
//                 {entities.map(entity => (
//                   <Option key={entity} value={entity}>{entity}</Option>
//                 ))}
//               </Select>
//             </Form.Item>
//           </Col>
          
//           <Col xs={24} sm={12}>
//             <Form.Item
//               name="documentNumber"
//               label="رقم الكتاب"
//               rules={[{ required: true, message: 'الرجاء إدخال رقم الكتاب' }]}
//             >
//               <Input placeholder="أدخل رقم الكتاب" />
//             </Form.Item>
//           </Col>
//         </Row>
        
//         <Row gutter={16}>
//           <Col xs={24} sm={12}>
//             <Form.Item
//               name="date"
//               label="تاريخ الكتاب"
//               rules={[{ required: true, message: 'الرجاء اختيار تاريخ الكتاب' }]}
//             >
//               <DatePicker 
//                 placeholder="اختر التاريخ" 
//                 style={{ width: '100%' }}
//                 format="YYYY-MM-DD"
//               />
//             </Form.Item>
//           </Col>
          
//           <Col xs={24} sm={12}>
//             <Form.Item
//               name="copiedTo"
//               label="نسخة إلى (CC)"
//             >
//               <Select
//                 mode="multiple"
//                 placeholder="اختر الجهات"
//                 allowClear
//               >
//                 {entities.map(entity => (
//                   <Option key={entity} value={entity}>{entity}</Option>
//                 ))}
//               </Select>
//             </Form.Item>
//           </Col>
//         </Row>
        
//         <Row gutter={16}>
//           <Col xs={24}>
//             <Form.Item
//               name="subject"
//               label="الموضوع"
//               rules={[{ required: true, message: 'الرجاء إدخال موضوع الكتاب' }]}
//             >
//               <TextArea
//                 rows={4}
//                 placeholder="أدخل موضوع الكتاب"
//               />
//             </Form.Item>
//           </Col>
//         </Row>
        
//         <Divider>إرفاق ملف</Divider>
        
//         <Form.Item name="attachment">
//           <Dragger {...fileUploadProps}>
//             <p className="ant-upload-drag-icon">
//               <InboxOutlined />
//             </p>
//             <p className="ant-upload-text">انقر أو اسحب ملف لرفعه هنا</p>
//             <p className="ant-upload-hint">
//               يدعم النظام رفع ملفات PDF أو صور (JPG، PNG)
//             </p>
//           </Dragger>
//         </Form.Item>
        
//         <Form.Item
//           name="notes"
//           label="ملاحظات"
//         >
//           <TextArea
//             rows={3}
//             placeholder="أدخل أي ملاحظات إضافية"
//           />
//         </Form.Item>

//         {(replyMode || confirmMode) && referencedDocument && (
//           <div className="referenced-document-info">
//             <Divider>معلومات الكتاب المرجعي</Divider>
//             <p><strong>رقم الكتاب:</strong> {referencedDocument.documentNumber}</p>
//             <p><strong>العنوان:</strong> {referencedDocument.title}</p>
//             <p><strong>التاريخ:</strong> {new Date(referencedDocument.date).toLocaleDateString('ar-SA')}</p>
//           </div>
//         )}
//       </Form>
//     </Modal>
//   );
// };

// export default AddDocumentForm;