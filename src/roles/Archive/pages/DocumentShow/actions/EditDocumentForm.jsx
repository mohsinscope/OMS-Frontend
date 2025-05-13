import React, { useState, useEffect } from "react";
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
  Space,
} from "antd";
import { InboxOutlined, CheckCircleOutlined } from "@ant-design/icons";
import useAuthStore from './../../../../../store/store.js';
import moment from "moment";
import axiosInstance from '../../../../../intercepters/axiosInstance.js';
import Url from '../../../../../store/url.js';
import MinioImagePreviewer from './../../../../../reusable/MinIoImagePreViewer.jsx';


const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

// Helper function to get response type value
const getResponseTypeValue = (side, option) => {
  if (side === "وارد") {
    if (option === "اجابة صادر") return 4;
    if (option === "تأكيد وارد") return 2;
    if (option === "وارد جديد") return 3;
  } else if (side === "صادر") {
    if (option === "اجابة وارد") return 1;
    if (option === "تأكيد صادر") return 5;
    if (option === "صادر جديد") return 6;
  }
  return null;
};

// Helper function to get document option choices
const getDocumentOptionChoices = (side) => {
  if (side === "صادر") return ["اجابة وارد", "تأكيد صادر", "صادر جديد"];
  if (side === "وارد")  return ["اجابة صادر", "تأكيد وارد", "وارد جديد"];
  return [];
};

// Helper function to get response type string from value
const getResponseTypeString = (value) => {
  switch (value) {
    case 1: return "اجابة وارد";
    case 2: return "تأكيد وارد";
    case 3: return "وارد جديد";
    case 4: return "اجابة صادر";
    case 5: return "تأكيد صادر";
    case 6: return "صادر جديد";
    default: return null;
  }
};

// Helper to convert document type number to side string
const getDocumentSide = (documentType) => {
  return documentType === 1 ? "وارد" : "صادر";
};

 const EditDocumentForm = ({ initialData, initialImageUrl, onClose, onUpdateSuccess }) => {
   // اقرأ فقط ما تحتاجه من الـ Store (أفضل أداءً)
   const profile     = useAuthStore(state => state.profile);
   const profileId   = profile?.profileId;
   const isTags      = ["Director", "SuperAdmin", "manager"]
                         .includes(profile?.position);

   const [form] = Form.useForm();

  // State for dynamic form data
  const [projectOptions, setProjectOptions] = useState([]);
  const [ccOptions, setCcOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [ministryOptions, setMinistryOptions] = useState([]);
  const [directorateOptions, setDirectorateOptions] = useState([]);
  const [generalDirectorateOptions, setGeneralDirectorateOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [privatePartyOptions, setPrivatePartyOptions] = useState([]);
  
  // State for document side and response type
  const [selectedDocumentSide, setSelectedDocumentSide] = useState(
    getDocumentSide(initialData?.documentType)
  );
  
  // State for official/private party selector
  const [isOfficial, setIsOfficial] = useState(
    initialData ? (initialData.ministryId != null) : true
  );
  
  // State for file upload
  const [fileList, setFileList] = useState([]);
const [listsReady, setListsReady] = useState(false);

  // Load all dropdown options
useEffect(() => {
  const fetchData = async () => {
    try {
      const [
        projsRes,
        ccsRes,
        tagsRes,
        ministriesRes,
        privatePartiesRes,
      ] = await Promise.all([
        axiosInstance.get(`${Url}/api/Project?PageNumber=1&PageSize=10000`),
        axiosInstance.get(`${Url}/api/DocumentCC?PageNumber=1&PageSize=1000`),
        axiosInstance.get(`${Url}/api/Tags?PageNumber=1&PageSize=1000`),
        axiosInstance.get(`${Url}/api/Ministry?PageNumber=1&PageSize=1000`),
        axiosInstance.get(`${Url}/api/PrivateParty?PageNumber=1&PageSize=1000`),
      ]);

      setProjectOptions(projsRes.data);
      setCcOptions(ccsRes.data);
       const tagRows = Array.isArray(tagsRes.data) ? tagsRes.data       // raw array
                  : Array.isArray(tagsRes.data?.data) ? tagsRes.data.data : [];
 setTagOptions(tagRows);
      setMinistryOptions(ministriesRes.data);
      setPrivatePartyOptions(privatePartiesRes.data);

      /* 🔑 everything is ready now */
      setListsReady(true);
    } catch (err) {
      console.error("Error loading dropdown options:", err);
      message.error("خطأ في تحميل القوائم الثابتة");
    }
  };

  fetchData();
}, []);


  // Load dependent dropdowns when ministry changes
  const handleMinistryChange = async (ministryId) => {
    if (!ministryId) {
      setGeneralDirectorateOptions([]);
      form.resetFields(['generalDirectorateId', 'directorateId', 'departmentId', 'sectionId']);
      return;
    }

    try {
      const response = await axiosInstance.get(`${Url}/api/GeneralDirectorate/ByMinistry/${ministryId}`);
      setGeneralDirectorateOptions(response.data);
      form.resetFields(['generalDirectorateId', 'directorateId', 'departmentId', 'sectionId']);
    } catch (error) {
      console.error("Error loading general directorates:", error);
      message.error("خطأ في تحميل المديريات العامة");
    }
  };

  // Load dependent dropdowns when general directorate changes
  const handleGeneralDirectorateChange = async (generalDirectorateId) => {
    if (!generalDirectorateId) {
      setDirectorateOptions([]);
      form.resetFields(['directorateId', 'departmentId', 'sectionId']);
      return;
    }

    try {
      const response = await axiosInstance.get(`${Url}/api/Directorate/ByGeneralDirectorate/${generalDirectorateId}`);
      setDirectorateOptions(response.data);
      form.resetFields(['directorateId', 'departmentId', 'sectionId']);
    } catch (error) {
      console.error("Error loading directorates:", error);
      message.error("خطأ في تحميل المديريات");
    }
  };

  // Load dependent dropdowns when directorate changes
  const handleDirectorateChange = async (directorateId) => {
    if (!directorateId) {
      setDepartmentOptions([]);
      form.resetFields(['departmentId', 'sectionId']);
      return;
    }

    try {
      const response = await axiosInstance.get(`${Url}/api/Department/ByDirectorate/${directorateId}`);
      setDepartmentOptions(response.data);
      form.resetFields(['departmentId', 'sectionId']);
    } catch (error) {
      console.error("Error loading departments:", error);
      message.error("خطأ في تحميل الأقسام");
    }
  };

  // Load dependent dropdowns when department changes
  const handleDepartmentChange = async (departmentId) => {
    if (!departmentId) {
      setSectionOptions([]);
      form.resetFields(['sectionId']);
      return;
    }

    try {
      const response = await axiosInstance.get(`${Url}/api/Section/ByDepartment/${departmentId}`);
      setSectionOptions(response.data);
      form.resetFields(['sectionId']);
    } catch (error) {
      console.error("Error loading sections:", error);
      message.error("خطأ في تحميل الشعب");
    }
  };

  // Setup initial file if available
  useEffect(() => {
    if (!initialImageUrl) return;
    
    const file = {
      uid: "-1",
      name: "Current file",
      status: "done",
      url: initialImageUrl,
    };
    
    setFileList([file]);
  }, [initialImageUrl]);

  // Setup initial form values
 useEffect(() => {
  // Wait until *both* the record and the dropdown lists are loaded
  if (!initialData || !listsReady) return;

  /* ───── derive helper values ───── */
  const responseTypeString = getResponseTypeString(initialData.responseType);
  const isOfficialParty    = initialData.ministryId != null;

  /* ───── seed every form field ───── */
  form.setFieldsValue({
    /* basic info */
    documentNumber : initialData.documentNumber,
    title          : initialData.title,
    subject        : initialData.subject,
    notes          : initialData.notes,
    date           : initialData.documentDate
                     ? moment(initialData.documentDate)
                     : undefined,

    /* classification */
    documentSide : getDocumentSide(initialData.documentType),
    ResponseType : responseTypeString,

    /* relationships */
    projectId : initialData.projectId,
    ccIds     : initialData.ccIds  || [],
    tagIds: initialData.tagIds || [],                  // ← RIGHT

    /* flags */
    isRequiresReply : initialData.isRequiresReply,
    isUrgent        : initialData.isUrgent,
    isImportant     : initialData.isImportant,
    isNeeded        : initialData.isNeeded,

    /* party selector */
    isOfficialParty : isOfficialParty,

    /* cascade for official party */
    ...(isOfficialParty
      ? {
          ministryId           : initialData.ministryId,
          generalDirectorateId : initialData.generalDirectorateId,
          directorateId        : initialData.directorateId,
          departmentId         : initialData.departmentId,
          sectionId            : initialData.sectionId,
        }
      : {
          /* private party */
          privatePartyId       : initialData.privatePartyId,
        }),
  });

  /* ───── keep UI‑level state in sync ───── */
  setSelectedDocumentSide(getDocumentSide(initialData.documentType));
  setIsOfficial(isOfficialParty);

  /* ───── preload cascaded dropdowns exactly once ───── */
  if (isOfficialParty) {
    if (initialData.ministryId)           handleMinistryChange(initialData.ministryId);
    if (initialData.generalDirectorateId) handleGeneralDirectorateChange(initialData.generalDirectorateId);
    if (initialData.directorateId)        handleDirectorateChange(initialData.directorateId);
    if (initialData.departmentId)         handleDepartmentChange(initialData.departmentId);
  }

  // eslint‑disable‑next‑line react-hooks/exhaustive-deps
}, [initialData, listsReady]);


  // Handle file upload props
  const fileUploadProps = {
    name: "file",
    multiple: true,
    fileList,
    beforeUpload: (file) => {
      const isAcceptedType = ["application/pdf", "image/jpeg", "image/png"].includes(file.type);
      const isAcceptedSize = file.size / 1024 / 1024 < 10;
      
      if (!isAcceptedType || !isAcceptedSize) {
        message.error("يسمح فقط بملفات PDF أو JPG/PNG أقل من 10MB");
        return false;
      }
      
      setFileList((prev) => [...prev, file]);
      
      return false; // Prevent auto upload
    },
    onRemove: (file) => {
      setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
    },
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (!profileId) {
        return message.error("تعذّر تحديد المستخدم");
      }
      
      const formData = new FormData();
      
      // Basic fields - matching exact field names from Postman images
      formData.append("ProfileId", profileId);
      
      // Document identifiers
      formData.append("DocumentId", initialData?.id || "");
      formData.append("DocumentNumber", values.documentNumber);
      
      // Content fields
      formData.append("Title", values.title);
      formData.append("Subject", values.subject);
      formData.append("Notes", values.notes || "");
      
      // IDs
      formData.append("ProjectId", values.projectId);
      formData.append("ParentDocumentId", initialData?.parentDocumentId || "");
      
      // Document type fields
      formData.append("DocumentType", values.documentSide === "وارد" ? "1" : "2");
      formData.append("ResponseType", getResponseTypeValue(values.documentSide, values.ResponseType));
      
      // Document date
      formData.append("DocumentDate", values.date.format("YYYY-MM-DDT00:00:00[Z]"));
      
      // Boolean flags - exact field names from Postman screenshot
      formData.append("IsRequiresReply", values.isRequiresReply);
      formData.append("IsUrgent", values.isUrgent);
      formData.append("IsImportant", values.isImportant);
      formData.append("IsNeeded", values.isNeeded);
      
      // Party information - matching the fields shown in Image 2
      if (values.isOfficialParty) {
        formData.append("MinistryId", values.ministryId);
        formData.append("GeneralDirectorateId", values.generalDirectorateId || "");
        formData.append("DirectorateId", values.directorateId || "");
        formData.append("DepartmentId", values.departmentId || "");
        formData.append("SectionId", values.sectionId || "");
        formData.append("PrivatePartyId", ""); // Empty when using official party
      } else {
        formData.append("PrivatePartyId", values.privatePartyId);
        // Empty values for official party fields
        formData.append("MinistryId", "");
        formData.append("GeneralDirectorateId", "");
        formData.append("DirectorateId", "");
        formData.append("DepartmentId", "");
        formData.append("SectionId", "");
      }
      
      // Arrays - handle ccIds as seen in AddDocumentPage.jsx
    // CC recipients
if (values.ccIds && values.ccIds.length) {
  values.ccIds.forEach((id, idx) => {
    // pick ONE of the two styles – don’t mix them
    formData.append(`CCIds[${idx}]`, id);      // bracketed index
    // formData.append("CCIds", id);           // or plain repeated name
  });
}
  if (values.tagIds && values.tagIds.length) {
  values.tagIds.forEach((id, idx) => {
    formData.append(`TagIds[${idx}]`, id);      // or formData.append("TagIds", id);
  });
}
      // Files - keep track if we're uploading a new main attachment
      let hasNewMainAttachment = false;
      
      fileList.forEach((file) => {
        // Skip files that are already uploaded and have a URL
        if (!file.originFileObj && file.url) {
          return;
        }
        
        formData.append("Files", file.originFileObj || file, file.name);
        hasNewMainAttachment = true;
      });
      
      // If we have a main attachment ID and we're not uploading new files
      if (initialData?.mainAttachmentId && !hasNewMainAttachment) {
        formData.append("MainAttachmentId", initialData.mainAttachmentId);
      }
      
      // Send the update request based on URL seen in Postman
      if (initialData?.id) {
        // Update existing document
        await axiosInstance.put(
          `${Url}/api/Document/${initialData.id}`, 
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        message.success("تم تحديث الكتاب بنجاح");
      } else {
        // Create new document
        await axiosInstance.post(
          `${Url}/api/Document`, 
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        message.success("تم إنشاء الكتاب بنجاح");
      }
      
      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || "خطأ في حفظ البيانات");
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
    >
      {/* official/private party section */}
      <Divider orientation="left" style={{marginTop:"20px"}}>نوع الجهة</Divider>
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item
            name="isOfficialParty"
            label="جهة رسمية؟"
            rules={[{ required: true, message: "اختر" }]}
            initialValue={true}
          >
            <Select
              onChange={(value) => {
                setIsOfficial(value);
                form.resetFields([
                  "ministryId", "generalDirectorateId", "directorateId",
                  "departmentId", "sectionId", "privatePartyId",
                ]);
              }}
            >
              <Option value={true}>رسمية</Option>
              <Option value={false}>غير رسمية</Option>
            </Select>
          </Form.Item>
        </Col>
        
        {/* Official party fields - first row (Ministry, General Directorate) */}
        {isOfficial && (
          <>
            <Col span={9}>
              <Form.Item
                name="ministryId"
                label="الوزارة"
                rules={[{ required: isOfficial, message: "اختر الوزارة" }]}
              >
                <Select
                  showSearch
                  placeholder="اختر الوزارة"
                  optionFilterProp="children"
                  disabled={!isOfficial}
                  onChange={handleMinistryChange}
                >
                  {ministryOptions.map(ministry => (
                    <Option key={ministry.id} value={ministry.id}>
                      {ministry.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={9}>
              <Form.Item
                name="generalDirectorateId"
                label="مديرية عامة"
                rules={[{ required: false }]}
              >
                <Select
                  showSearch
                  placeholder="اختر المديرية العامة"
                  optionFilterProp="children"
                  disabled={!isOfficial || !form.getFieldValue("ministryId")}
                  onChange={handleGeneralDirectorateChange}
                >
                  {generalDirectorateOptions.map(gd => (
                    <Option key={gd.id} value={gd.id}>
                      {gd.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </>
        )}
        
        {/* Private party field */}
        {!isOfficial && (
          <Col span={18}>
            <Form.Item
              name="privatePartyId"
              label="الجهة الخاصة"
              rules={[{ required: !isOfficial, message: "اختر الجهة الخاصة" }]}
            >
              <Select
                showSearch
                placeholder="اختر الجهة الخاصة"
                optionFilterProp="children"
                disabled={isOfficial}
              >
                {privatePartyOptions.map(party => (
                  <Option key={party.id} value={party.id}>
                    {party.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        )}
      </Row>

      {/* Official party fields - second row (Directorate, Department, Section) */}
      {isOfficial && (
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="directorateId"
              label="مديرية"
              rules={[{ required: false }]}
            >
              <Select
                showSearch
                placeholder="اختر المديرية"
                optionFilterProp="children"
                disabled={!isOfficial || !form.getFieldValue("generalDirectorateId")}
                onChange={handleDirectorateChange}
              >
                {directorateOptions.map(directorate => (
                  <Option key={directorate.id} value={directorate.id}>
                    {directorate.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="departmentId"
              label="قسم"
              rules={[{ required: false }]}
            >
              <Select
                showSearch
                placeholder="اختر القسم"
                optionFilterProp="children"
                disabled={!isOfficial || !form.getFieldValue("directorateId")}
                onChange={handleDepartmentChange}
              >
                {departmentOptions.map(department => (
                  <Option key={department.id} value={department.id}>
                    {department.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="sectionId"
              label="شعبة"
              rules={[{ required: false }]}
            >
              <Select
                showSearch
                placeholder="اختر الشعبة"
                optionFilterProp="children"
                disabled={!isOfficial || !form.getFieldValue("departmentId")}
              >
                {sectionOptions.map(section => (
                  <Option key={section.id} value={section.id}>
                    {section.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      )}

      {/* Document classification section */}
      <Divider orientation="left" style={{marginTop:"20px"}}>تصنيف الكتاب</Divider>
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item
            name="documentSide"
            label="نوع الكتاب"
            rules={[{ required: true, message: "اختر" }]}
          >
            <Select
              onChange={(value) => {
                setSelectedDocumentSide(value);
                form.setFieldValue("ResponseType", undefined);
              }}
            >
              <Option value="صادر">صادر</Option>
              <Option value="وارد">وارد</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="ResponseType"
            label="خيارات الكتاب"
            rules={[{ required: true, message: "اختر" }]}
          >
            <Select disabled={!selectedDocumentSide}>
              {getDocumentOptionChoices(selectedDocumentSide).map((option) => (
                <Option key={option} value={option}>{option}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {/* Basic document details */}
      <Divider orientation="left" style={{marginTop:"20px"}}>تفاصيل أساسية</Divider>
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item
            name="documentNumber"
            label="رقم الكتاب"
            rules={[{ required: true, message: "أدخل الرقم" }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="title"
            label="عنوان الكتاب"
            rules={[{ required: true, message: "أدخل العنوان" }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="ccIds" label="نسخة إلى (CC)">
            <Select
              mode="multiple"
              allowClear
              showSearch
              optionFilterProp="children"
                maxTagCount="responsive"
                 maxTagPlaceholder={(omitted) => `+${omitted.length}`}
            >
              {ccOptions.map((cc) => (
                <Option key={cc.id} value={cc.id}>
                  {cc.recipientName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="date"
            label="تاريخ الكتاب"
            rules={[{ required: true, message: "اختر التاريخ" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="projectId"
            label="المشروع"
            rules={[{ required: true, message: "اختر المشروع" }]}
          >
            <Select showSearch optionFilterProp="children">
              {projectOptions.map((project) => (
                <Option key={project.id} value={project.id}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        {isTags && 
        
                <Col span={6}>
          <Form.Item name="tagIds" label="الوسوم (tags)">
            <Select
              mode="multiple"
              allowClear
              showSearch
              optionFilterProp="children"
                 maxTagCount="responsive"
   maxTagPlaceholder={(omitted) => `+${omitted.length}`}
            >
              {tagOptions.map((tag) => (
                <Option key={tag.id} value={tag.id}>
                  {tag.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        
        
        }

      </Row>

      {/* Document attributes */}
      <Divider orientation="left" style={{marginTop:"20px"}}>سمات الكتاب</Divider>
      <Row gutter={16}>
        {[
          { name: "isRequiresReply", label: "يتطلب رد؟" },
          { name: "isUrgent", label: "عاجل؟" },
          { name: "isImportant", label: "مهم؟" },
          { name: "isNeeded", label: "يستلزم إجراء؟" }
        ].map((item) => (
          <Col span={6} key={item.name}>
            <Form.Item
              name={item.name}
              label={item.label}
              rules={[{ required: true, message: "اختر" }]}
            >
              <Select>
                <Option value={true}>نعم</Option>
                <Option value={false}>لا</Option>
              </Select>
            </Form.Item>
          </Col>
        ))}
      </Row>

      {/* Subject and notes section */}
      <Divider orientation="left" style={{marginTop:"20px"}}>الموضوع والملاحظات</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="subject"
            label="الموضوع"
            rules={[{ required: true, message: "أدخل الموضوع" }]}
          >
            <TextArea rows={3} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="notes" label="ملاحظات">
            <TextArea rows={3} />
          </Form.Item>
        </Col>
      </Row>

      {/* Attachments section */}
      <Divider orientation="left" style={{marginTop:"20px"}}>المرفقات</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="attachment">
            <Dragger {...fileUploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                اسحب أو اختر ملف PDF / JPG / PNG
              </p>
              <p className="ant-upload-hint">≤ 10MB</p>
            </Dragger>
          </Form.Item>
        </Col>
        <Col span={12}>
          {initialData?.id && (
            <MinioImagePreviewer
              entityType="Document"
              entityId={initialData.id}
              defaultWidth={400}
              defaultHeight={200}
            />
          )}
        </Col>
      </Row>

      {/* Form actions */}
      <Space style={{ marginTop: 24 }}>
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={handleSubmit}
        >
          {initialData ? "حفظ التغييرات" : "إنشاء الكتاب"}
        </Button>
        <Button onClick={onClose}>
          إلغاء
        </Button>
      </Space>
    </Form>
  );
};

export default EditDocumentForm;