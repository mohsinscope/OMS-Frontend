import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Upload, 
  Button, 
  message, 
  Row, 
  Col,
  Divider,
  Layout,
  ConfigProvider,
  Breadcrumb,
  Modal,
  Descriptions
} from 'antd';
import { 
  InboxOutlined,
  ArrowLeftOutlined 
} from '@ant-design/icons';
import { useArchive } from './../contexts/ArchiveContext.jsx';
import { Link, useNavigate } from 'react-router-dom';
import ar_EG from 'antd/lib/locale/ar_EG';
import axiosInstance from './../../../intercepters/axiosInstance.js';
import moment from 'moment';
import '../styles/addArchivePage.css';
import useAuthStore from './../../../store/store.js';
import ImagePreviewer from "./../../../reusable/ImagePreViewer.jsx";

const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Content, Header } = Layout;

const { profile } = useAuthStore.getState();

// Stub function to simulate fetching a document by its number.
// Replace this with your actual API call as needed.
async function fetchDocumentByNumber(documentNumber) {
  try {
    const response = await axiosInstance.get(`/api/Document/bynumber/${documentNumber}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching document by number:", error);
    throw new Error("Failed to fetch document by number");
  }
}

// Helper to map response options to integer values.
const getResponseTypeValue = (documentSide, documentOption) => {
  if(documentSide === 'وارد'){
    if(documentOption === 'اجابة وارد') return 1;
    if(documentOption === 'تأكيد وارد') return 2;
    if(documentOption === 'وارد جديد') return 3;
  } else if(documentSide === 'صادر'){
    if(documentOption === 'اجابة صادر') return 4;
    if(documentOption === 'تأكيد صادر') return 5;
    if(documentOption === 'صادر جديد') return 6;
  }
  return null;
};

const AddDocumentPage = ({
  editMode = false, 
  replyMode = false,
  confirmMode = false,
  referencedDocument = null,
  initialValues = {},
}) => {
  const [form] = Form.useForm();
  const { addDocument, updateDocument } = useArchive();
  const [fileList, setFileList] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [fetchedDocumentData, setFetchedDocumentData] = useState(null);
  const [projectOptions, setProjectOptions] = useState([]);
  const [documentPartyOptions, setDocumentPartyOptions] = useState([]);
  const [selectedDocumentSide, setSelectedDocumentSide] = useState(initialValues.documentSide || null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const navigate = useNavigate();

  const getPageTitle = () => {
    if (editMode) return 'تعديل كتاب';
    if (replyMode) return 'إضافة رد على كتاب';
    if (confirmMode) return 'تأكيد استلام كتاب';
    return 'إضافة كتاب جديد';
  };

  // Static choices for document side and response options.
  const documentSideOptions = ['صادر', 'وارد'];
  const getDocumentOptionChoices = (side) => {
    if (side === 'صادر') {
      return ['اجابة صادر', 'تأكيد صادر', 'صادر جديد'];
    } else if (side === 'وارد') {
      return ['اجابة وارد', 'تأكيد وارد', 'وارد جديد'];
    }
    return [];
  };

  // Fetch projects and document party (الجهة) options.
  useEffect(() => {
    async function fetchData() {
      try {
        const [projectsResponse, partiesResponse] = await Promise.all([
          axiosInstance.get("/api/Project?PageNumber=1&PageSize=100"),
          axiosInstance.get("/api/DocumentParty?PageNumber=1&PageSize=100")
        ]);
        setProjectOptions(projectsResponse.data);
        setDocumentPartyOptions(partiesResponse.data);
      } catch (error) {
        console.error("Error fetching data", error);
        message.error("حدث خطأ أثناء جلب بيانات المشروع والجهات");
      }
    }
    fetchData();
  }, []);

  // Update state when user selects a document side.
  const handleDocumentSideChange = (value) => {
    setSelectedDocumentSide(value);
    form.setFieldsValue({ documentOption: undefined });
  };

  // Set initial values on mount.
  useEffect(() => {
    if (editMode && initialValues) {
      setSelectedDocumentSide(initialValues.documentSide);
      if (initialValues.fileUrl) {
        setFileList([
          {
            uid: '-1',
            name: initialValues.fileName || 'Current file',
            status: 'done',
            url: initialValues.fileUrl
          }
        ]);
        // For images, add their URL to previewUrls.
        if (initialValues.fileUrl && initialValues.fileType && initialValues.fileType.startsWith('image/')) {
          setPreviewUrls([initialValues.fileUrl]);
        }
      }
      form.setFieldsValue({
        ...initialValues,
        date: initialValues.date ? moment(initialValues.date) : null,
      });
    } else if ((replyMode || confirmMode) && referencedDocument) {
      const documentSide = replyMode ? 
        (referencedDocument.documentType === 1 ? 'وارد' : 'صادر') : 
        (referencedDocument.documentType === 1 ? 'صادر' : 'وارد');
      
      setSelectedDocumentSide(documentSide);
      
      const documentOption = replyMode ? 
        (documentSide === 'وارد' ? 'اجابة وارد' : 'اجابة صادر') :
        (documentSide === 'وارد' ? 'تأكيد وارد' : 'تأكيد صادر');
      
      form.setFieldsValue({
        documentSide,
        documentOption,
        replyDocumentNumber: referencedDocument.documentNumber,
        project: referencedDocument.projectId,
        entity: referencedDocument.partyId,
      });
      setFetchedDocumentData(referencedDocument);
    }
  }, [form, initialValues, editMode, replyMode, confirmMode, referencedDocument]);

  // File Upload props.
  const fileUploadProps = {
    name: 'file',
    multiple: true,
    fileList,
    beforeUpload: (file) => {
      const isAllowedType = file.type === 'application/pdf' ||
                            file.type === 'image/jpeg' ||
                            file.type === 'image/png';
      if (!isAllowedType) {
        message.error('يمكنك فقط رفع ملفات PDF أو صور!');
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('يجب أن يكون حجم الملف أقل من 10 ميجابايت!');
        return false;
      }
      // NEW logic for multiple PDF files:
      const updatedFiles = [...fileList, file].filter((file) => {
        if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
          message.error("يرجى رفع ملفات PDF أو صور فقط!");
          return false;
        }
        return true;
      });
      setFileList(updatedFiles);
      // Generate new preview URLs (for images only)
      const newPreviews = updatedFiles.map((file) =>
        file.type.startsWith("image/") && file.originFileObj ? URL.createObjectURL(file.originFileObj) : null
      );
      setPreviewUrls(newPreviews);
      return false;
    },
    onRemove: () => {
      setFileList([]);
      setPreviewUrls([]);
    },
  };

  // Handler for deleting an image from the preview.
  const handleDeleteImage = (index) => {
    const newPreviews = [...previewUrls];
    newPreviews.splice(index, 1);
    setPreviewUrls(newPreviews);
    const newFileList = [...fileList];
    newFileList.splice(index, 1);
    setFileList(newFileList);
  };

  const handleFetchReplyDocument = async () => {
    try {
      const docNum = form.getFieldValue('replyDocumentNumber');
      if (!docNum) {
        message.error('يرجى إدخال رقم الكتاب المراد الرد عليه');
        return;
      }
      const docData = await fetchDocumentByNumber(docNum);
      setFetchedDocumentData(docData);
      message.success('تم جلب بيانات الكتاب');
    } catch (err) {
      message.error('حدث خطأ أثناء جلب بيانات الكتاب');
      console.error(err);
    }
  };

  const openViewModal = () => {
    setViewModalVisible(true);
  };

  const closeViewModal = () => {
    setViewModalVisible(false);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      
      if (values.date) {
        const formattedDate = values.date.format('YYYY-MM-DD') + 'T00:00:00Z';
        values.date = formattedDate;
      }
      
      let formData = new FormData();
      formData.append('DocumentNumber', values.documentNumber);
      formData.append('Title', values.title);
      
      const documentTypeValue = selectedDocumentSide === 'صادر' ? 1 : 2;
      formData.append('DocumentType', documentTypeValue);
      
      const responseTypeValue = getResponseTypeValue(selectedDocumentSide, values.documentOption);
      formData.append('ResponseType', responseTypeValue);
      
      formData.append('ProjectId', values.project);
      formData.append('DocumentDate', values.date);
      
      formData.append('IsRequiresReply', values.isRequiresReply.toString());
      
      formData.append('PartyId', values.entity);
      formData.append('Subject', values.subject);
      
      if (fetchedDocumentData && responseTypeValue !== (selectedDocumentSide === 'صادر' ? 6 : 3)) {
        formData.append('ParentDocumentId', fetchedDocumentData.id);
      }
      
      if (values.copiedTo && values.copiedTo.length > 0) {
        formData.append('CCId', values.copiedTo.join(','));
      }
      
      if (fileList.length > 0) {
        fileList.forEach(file => {
          if(file instanceof File) {
            formData.append('File', file);
          }
        });
      }
      
      formData.append('ProfileId', profile.profileId);
      
      const response = await axiosInstance.post('/api/Document/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      message.success('تم إضافة الكتاب بنجاح');
      setSubmitting(false);
      navigate('/archive');
      return response.data;
    } catch (error) {
      setSubmitting(false);
      console.error('Error submitting form:', error);
      if (error.response) {
        const status = error.response.status;
        const errData = error.response.data;
        if (status === 400) {
          const errorMessages = errData.errors ? 
            Object.values(errData.errors).flat().join(', ') : 
            errData.message || 'البيانات المدخلة غير صحيحة';
          message.error(errorMessages);
        } else if (status === 500) {
          message.error(errData.message || 'حدث خطأ أثناء إنشاء المستند');
        } else {
          message.error(errData.message || 'حدث خطأ أثناء معالجة الطلب');
        }
      } else {
        message.error('حدث خطأ في الاتصال بالخادم');
      }
    }
  };

  return (
    <ConfigProvider locale={ar_EG} direction="rtl">
      <Layout className="document-page-layout">
        <Header className="document-page-header">
          <h1>{getPageTitle()}</h1>
          <Breadcrumb className="document-breadcrumb">
            <Breadcrumb.Item>
              <Link to="/archive">الأرشيف</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{getPageTitle()}</Breadcrumb.Item>
          </Breadcrumb>
        </Header>
        <Content className="document-page-content">
          <div className="document-page-container">
            <Row gutter={24}>
              {/* Left Column: Display Parent/Referenced Document Info */}
              {(replyMode || confirmMode) && fetchedDocumentData && (
                <Col xs={24}>
                  <div className="referenced-document-info">
                    <Divider>معلومات الكتاب المراد الرد عليه</Divider>
                    <p><strong>رقم الكتاب:</strong> {fetchedDocumentData.documentNumber}</p>
                    <p><strong>العنوان:</strong> {fetchedDocumentData.title}</p>
                    <p>
                      <strong>التاريخ:</strong> {fetchedDocumentData.documentDate ? new Date(fetchedDocumentData.documentDate).toLocaleDateString('ar-EA') : 'غير محدد'}
                    </p>
                    <Button type="default" onClick={openViewModal}>
                      عرض بيانات الكتاب
                    </Button>
                  </div>
                </Col>
              )}
              {/* Right Column: Data Input Form */}
              <Col xs={24}>
                <Form 
                  form={form} 
                  layout="vertical" 
                  labelAlign="right" 
                  className="document-form" 
                  initialValues={initialValues}
                  preserve={false}
                >
                  <Row gutter={16}>
                    <Col xs={24} sm={6}>
                      <Form.Item
                        name="documentSide"
                        label="نوع الكتاب"
                        rules={[{ required: true, message: 'الرجاء اختيار نوع الكتاب' }]}
                        initialValue={selectedDocumentSide}
                      >
                        <Select 
                          placeholder="اختر صادر أو وارد" 
                          onChange={handleDocumentSideChange}
                          disabled={replyMode || confirmMode}
                        >
                          {documentSideOptions.map(side => (
                            <Option key={side} value={side}>{side}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                      <Form.Item
                        name="documentOption"
                        label="خيارات الكتاب"
                        rules={[{ required: true, message: 'الرجاء اختيار خيار الكتاب' }]}
                        disabled={replyMode || confirmMode}
                      >
                        <Select placeholder="اختر الخيار" disabled={!selectedDocumentSide}>
                          {selectedDocumentSide && getDocumentOptionChoices(selectedDocumentSide).map(option => (
                            <Option key={option} value={option}>{option}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={2}>
                      <Form.Item
                        name="isRequiresReply"
                        label="يتطلب رد؟"
                        rules={[{ required: true, message: 'الرجاء اختيار نعم أو لا' }]}
                        initialValue={false}
                      >
                        <Select placeholder="اختر نعم أو لا">
                          <Option value={true}>نعم</Option>
                          <Option value={false}>لا</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={4}>
                      <Form.Item
                        name="entity"
                        label="الجهة"
                        rules={[{ required: true, message: 'الرجاء اختيار الجهة' }]}
                      >
                        <Select
                          placeholder="اختر الجهة"
                          showSearch
                          filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                          }
                        >
                          {documentPartyOptions.map((docu) => (
                            <Option key={docu.id} value={docu.id}>{docu.name}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                      <Form.Item
                        name="copiedTo"
                        label="نسخة منه الى"
                      >
                        <Select
                          mode="multiple"
                          placeholder="اختر الجهات"
                          allowClear
                          loading={documentPartyOptions.length === 0}
                        >
                          {documentPartyOptions.map((docu) => (
                            <Option key={docu.id} value={docu.id}>{docu.name}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col xs={24} sm={6}>
                      <Form.Item
                        name="project"
                        label="المشروع"
                        rules={[{ required: true, message: 'الرجاء اختيار المشروع' }]}
                      >
                        <Select 
                          placeholder="اختر المشروع"
                          loading={projectOptions.length === 0}
                          showSearch
                          filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                          }
                        >
                          {projectOptions.map((proj) => (
                            <Option key={proj.id} value={proj.id}>{proj.name}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                      <Form.Item
                        name="documentNumber"
                        label="رقم الكتاب"
                        rules={[{ required: true, message: 'الرجاء إدخال رقم الكتاب' }]}
                      >
                        <Input placeholder="أدخل رقم الكتاب" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                      <Form.Item
                        name="title"
                        label="عنوان الكتاب"
                        rules={[{ required: true, message: 'الرجاء إدخال عنوان الكتاب' }]}
                      >
                        <Input placeholder="أدخل عنوان الكتاب" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                      <Form.Item
                        name="date"
                        label="تاريخ الكتاب"
                        rules={[{ required: true, message: 'الرجاء اختيار تاريخ الكتاب' }]}
                      >
                        <DatePicker 
                          
                          placeholder="اختر التاريخ" 
                          style={{ width: '100%' }}
                          format="YYYY-MM-DD"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="subject"
                        label="الموضوع"
                        rules={[{ required: true, message: 'الرجاء إدخال موضوع الكتاب' }]}
                      >
                        <TextArea rows={4} placeholder="أدخل موضوع الكتاب" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="notes"
                        label="ملاحظات"
                        labelCol={{ span: 24 }}
                        wrapperCol={{ span: 24 }}
                      >
                        <TextArea rows={4} placeholder="أدخل أي ملاحظات إضافية" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item shouldUpdate={(prevValues, curValues) => 
                    prevValues.documentOption !== curValues.documentOption || 
                    prevValues.documentSide !== curValues.documentSide
                  }>
                    {({ getFieldValue }) => {
                      const option = getFieldValue('documentOption');
                      const side = getFieldValue('documentSide') || selectedDocumentSide;
                      if (side && option && ((option.includes('اجابة') || option.includes('تأكيد')) && !option.includes('جديد'))) {
                        return (
                          <Row gutter={16}>
                            <Col xs={24} sm={6}>
                              <Form.Item
                                name="replyDocumentNumber"
                                label="رقم الكتاب المراد الرد عليه"
                                rules={[{ required: true, message: 'الرجاء إدخال رقم الكتاب المراد الرد عليه' }]}
                              >
                                <Input placeholder="أدخل رقم الكتاب المراد الرد عليه" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={6}>
                              <Form.Item label="&nbsp;">
                                <Button 
                                  type="primary" 
                                  onClick={handleFetchReplyDocument}
                                >
                                  بحث
                                </Button>
                              </Form.Item>
                            </Col>
                          </Row>
                        );
                      }
                      return null;
                    }}
                  </Form.Item>
                  {fetchedDocumentData && (
                    <div style={{ marginBottom: '16px', backgroundColor: '#fafafa', padding: '10px', border: '1px solid #e8e8e8', borderRadius: '4px' }}>
                      <p><strong>بيانات الكتاب المراد الرد عليه:</strong></p>
                      <p>رقم الكتاب: {fetchedDocumentData.documentNumber}</p>
                      <p>العنوان: {fetchedDocumentData.title}</p>
                      <p>الموضوع: {fetchedDocumentData.subject}</p>
                      <p>
                        <strong>التاريخ:</strong> {fetchedDocumentData.documentDate ? new Date(fetchedDocumentData.documentDate).toLocaleDateString('ar-EA') : 'غير محدد'}
                      </p>
                      <Button type="default" onClick={openViewModal}>
                        عرض بيانات الكتاب
                      </Button>
                    </div>
                  )}
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Divider>إرفاق ملف</Divider>
                      <Form.Item name="attachment">
                        <Dragger {...fileUploadProps}>
                          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                          <p className="ant-upload-text">انقر أو اسحب ملف لرفعه هنا</p>
                          <p className="ant-upload-hint">
                            يدعم النظام رفع ملفات PDF أو صور (JPG، PNG)
                          </p>
                        </Dragger>
                      </Form.Item>
                    </Col>
                    {previewUrls.length > 0 && (
                      <Col xs={24} sm={12}>
                        <Divider>معاينة الصورة</Divider>
                        <ImagePreviewer
                          uploadedImages={previewUrls}
                          defaultWidth={600}
                          defaultHeight={300}
                          onDeleteImage={handleDeleteImage}
                        />
                      </Col>
                    )}
                  </Row>
                </Form>
              </Col>
            </Row>
          </div>
          <div className="form-actions">
            <Button className="submit-button" type="primary" onClick={handleSubmit} loading={submitting} size="large">
              {editMode ? 'حفظ التغييرات' : 'حفظ'} 
            </Button>
            <Button danger  className="add-back-button" onClick={() => navigate('/archive')} size="large">
              العودة <ArrowLeftOutlined />
            </Button>
          </div>
        </Content>
      </Layout>
      <Modal
        open={viewModalVisible}
        title="بيانات الكتاب المراد الرد عليه"
        onCancel={closeViewModal}
        footer={[
          <Button key="close" type="primary" onClick={closeViewModal}>
            اغلاق
          </Button>
        ]}
      >
        {fetchedDocumentData ? (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="المعرف">{fetchedDocumentData.id}</Descriptions.Item>
            <Descriptions.Item label="رقم الكتاب">{fetchedDocumentData.documentNumber}</Descriptions.Item>
            <Descriptions.Item label="عنوان الكتاب">{fetchedDocumentData.title}</Descriptions.Item>
            <Descriptions.Item label="نوع المستند">{fetchedDocumentData.documentType}</Descriptions.Item>
            <Descriptions.Item label="نوع الرد">{fetchedDocumentData.responseType}</Descriptions.Item>
            <Descriptions.Item label="الموضوع">{fetchedDocumentData.subject}</Descriptions.Item>
            <Descriptions.Item label="هل يحتاج لرد؟">{fetchedDocumentData.isRequiresReply ? 'نعم' : 'لا'}</Descriptions.Item>
            <Descriptions.Item label="معرف المشروع">{fetchedDocumentData.projectId}</Descriptions.Item>
            <Descriptions.Item label="تاريخ الكتاب">{fetchedDocumentData.documentDate ? new Date(fetchedDocumentData.documentDate).toLocaleDateString('ar-EA') : '-'}</Descriptions.Item>
            <Descriptions.Item label="معرف الجهة">{fetchedDocumentData.partyId}</Descriptions.Item>
            <Descriptions.Item label="نسخة منه الى">{fetchedDocumentData.ccId || '-'}</Descriptions.Item>
            <Descriptions.Item label="معرف الملف الشخصي">{fetchedDocumentData.profileId}</Descriptions.Item>
            <Descriptions.Item label="تم الرد؟">{fetchedDocumentData.isReplied ? 'نعم' : 'لا'}</Descriptions.Item>
            <Descriptions.Item label="تم التدقيق؟">{fetchedDocumentData.isAudited ? 'نعم' : 'لا'}</Descriptions.Item>
            <Descriptions.Item label="المستندات الفرعية">
              {fetchedDocumentData.childDocuments && fetchedDocumentData.childDocuments.length > 0 ? 
                JSON.stringify(fetchedDocumentData.childDocuments) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="تاريخ الإنشاء">
              {fetchedDocumentData.datecreated ? new Date(fetchedDocumentData.datecreated).toLocaleDateString('ar-EA') : '-'}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <p>لا توجد بيانات للعرض</p>
        )}
      </Modal>
    </ConfigProvider>
  );
};

export default AddDocumentPage;
