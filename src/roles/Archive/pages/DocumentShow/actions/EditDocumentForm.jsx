/*  src/pages/archive/actions/EditDocumentForm.jsx
    نموذج تعديل مستند – يرسل كل الحقول + (المرفق الاختياري) في طلب
    واحد (multipart/form-data) إلى ‎/api/Document/{DocumentId}
--------------------------------------------------------------- */

import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  Button,
  Row,
  Col,
  message,
  Divider,
  Space,
  Tag,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axiosInstance from "./../../../../../intercepters/axiosInstance.js";
import Url from "./../../../../../store/url.js";

const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

/* خيارات نوع الرد */
const RESPONSE_TYPES = {
  1: "اجابة وارد",
  2: "تأكيد وارد",
  3: "وارد جديد",
  4: "اجابة صادر",
  5: "تأكيد صادر",
  6: "صادر جديد",
};

export default function EditDocumentForm({
  initialData,            // بيانات الكتاب الحالية (تتضمن id و parentDocumentId وغيرها)
  initialImageUrl = "",   // رابط المرفق الحالى (إن وجد)
  onClose,
  onUpdateSuccess,
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  /* القوائم المنسدلة */
  const [projectOptions, setProjectOptions] = useState([]);
  const [ministryOptions, setMinistryOptions] = useState([]);
  const [partyOptions, setPartyOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [ccOptions, setCcOptions] = useState([]);
  
  /* تتبع القيم المختارة للتأكد من معالجتها بشكل صحيح */
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCcs, setSelectedCcs] = useState([]);

  /* الملف الجديد (اختياري) */
  const [fileList, setFileList] = useState([]);

  /* ───── تحميل القوائم المرجعية مرة واحدة ───── */
  useEffect(() => {
    (async () => {
      try {
        const [projects, ministries, parties, tags, ccs] = await Promise.all([
          axiosInstance.get("/api/Project?PageNumber=1&PageSize=100"),
          axiosInstance.get("/api/Ministry?PageNumber=1&PageSize=100"),
          axiosInstance.get("/api/DocumentParty?PageNumber=1&PageSize=100"),
          axiosInstance.get("/api/Tags?PageNumber=1&PageSize=100"),
          axiosInstance.get("/api/DocumentCC?PageNumber=1&PageSize=100"),
        ]);
        setProjectOptions(projects.data);
        setMinistryOptions(ministries.data);
        setPartyOptions(parties.data);
        setTagOptions(tags.data);
        setCcOptions(ccs.data);
      } catch {
        message.error("فشل تحميل القوائم المرجعية");
      }
    })();
  }, []);

  /* ───── تعبئة القيم الابتدائية ───── */
  useEffect(() => {
    if (!initialData) return;
    
    // تحويل المصفوفات إلى تنسيق يفهمه النموذج
    const formattedCcIds = initialData.ccIds || [];
    const formattedTagIds = initialData.tagIds || [];
    
    setSelectedTags(formattedTagIds);
    setSelectedCcs(formattedCcIds);
    
    form.setFieldsValue({
      documentNumber: initialData.documentNumber,
      title: initialData.title,
      documentType: initialData.documentType,
      responseType: initialData.responseType,
      projectId: initialData.projectId,
      partyId: initialData.partyId,
      ministryId: initialData.ministryId,
      documentDate: dayjs(initialData.documentDate),
      isRequiresReply: initialData.isRequiresReply,
      isUrgent: initialData.isUrgent,
      isImportant: initialData.isImportant,
      isNeeded: initialData.isNeeded,
      subject: initialData.subject,
      notes: initialData.notes,
      ccIds: formattedCcIds,
      tagIds: formattedTagIds,
    });
  }, [initialData, form]);

  /* ───── إعدادات الرفع ───── */
  const uploadProps = {
    name: "file",
    fileList,
    beforeUpload: (f) => {
      const ok =
        ["application/pdf", "image/jpeg", "image/png"].includes(f.type) &&
        f.size / 1024 / 1024 < 10;
      if (ok) setFileList([f]);
      else message.error("يُسمح بملف PDF أو JPG/PNG أقل من 10 MB");
      return false;            // منع الرفع التلقائي
    },
    onRemove: () => setFileList([]),
  };

  /* ───── التعامل مع اختيار وسوم جديدة ───── */
  const handleTagsChange = (values) => {
    setSelectedTags(values);
  };

  /* ───── التعامل مع اختيار نسخ جديدة ───── */
  const handleCCsChange = (values) => {
    setSelectedCcs(values);
  };

  /* ───── الحفظ ───── */
  const handleSubmit = async (vals) => {
    try {
      setSubmitting(true);

      /* بناء FormData */
      const fd = new FormData();
      fd.append("DocumentId", initialData.id);                           // ⬅️ إضافة DocumentId
      fd.append("DocumentNumber", vals.documentNumber);
      fd.append("Title", vals.title);
      fd.append("DocumentType", vals.documentType);
      fd.append("ResponseType", vals.responseType);
      fd.append("Subject", vals.subject);

      fd.append(
        "DocumentDate",
        `${dayjs(vals.documentDate).format("YYYY-MM-DD")}T00:00:00Z`
      );

      fd.append("IsRequiresReply", vals.isRequiresReply);
      fd.append("IsUrgent", vals.isUrgent);
      fd.append("IsImportant", vals.isImportant);
      fd.append("IsNeeded", vals.isNeeded);

      fd.append("ProjectId", vals.projectId);
      fd.append("PartyId", vals.partyId);
      fd.append("ParentDocumentId", initialData.parentDocumentId ?? "");
      fd.append("MinistryId", vals.ministryId ?? "");
      fd.append("Notes", vals.notes ?? "");

      // التأكد من إرسال القيم المتعددة بشكل صحيح
      if (vals.ccIds && vals.ccIds.length > 0) {
        vals.ccIds.forEach(id => {
          fd.append("CCIds", id);
        });
      }

      if (vals.tagIds && vals.tagIds.length > 0) {
        vals.tagIds.forEach(id => {
          fd.append("TagIds", id);
        });
      }

      if (fileList.length) {
        fd.append("Files", fileList[0], fileList[0].name);
      }

      /* endpoint يتضمن معرف المستند */
      await axiosInstance.put(
        `${Url}/api/Document/${initialData.id}`,   // ⬅️  /Document/{id}
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      message.success("تم حفظ التعديلات بنجاح");
      onUpdateSuccess();
    } catch (e) {
      console.error("Error saving document:", e);
      message.error(e.response?.data?.message || "فشل حفظ التعديلات");
    } finally {
      setSubmitting(false);
    }
  };

  /* ───── الواجهة ───── */
  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      {/* الصف 1 */}
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="documentNumber"
            label="رقم الكتاب"
            rules={[{ required: true, message: "أدخل رقم الكتاب" }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="title"
            label="عنوان الكتاب"
            rules={[{ required: true, message: "أدخل العنوان" }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="documentDate"
            label="تاريخ الكتاب"
            rules={[{ required: true, message: "اختر التاريخ" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>

      {/* الصف 2 */}
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item
            name="documentType"
            label="نوع الكتاب"
            rules={[{ required: true, message: "اختر النوع" }]}
          >
            <Select>
              <Option value={1}>صادر</Option>
              <Option value={2}>وارد</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="responseType"
            label="نوع الرد"
            rules={[{ required: true, message: "اختر" }]}
          >
            <Select>
              {Object.entries(RESPONSE_TYPES).map(([k, v]) => (
                <Option key={k} value={Number(k)}>
                  {v}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="isRequiresReply"
            label="يتطلب رد؟"
            rules={[{ required: true, message: "اختر" }]}
          >
            <Select>
              <Option value={true}>نعم</Option>
              <Option value={false}>لا</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="isUrgent"
            label="عاجل؟"
            rules={[{ required: true, message: "اختر" }]}
          >
            <Select>
              <Option value={true}>نعم</Option>
              <Option value={false}>لا</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {/* الصف 3 */}
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item
            name="isImportant"
            label="مهم؟"
            rules={[{ required: true, message: "اختر" }]}
          >
            <Select>
              <Option value={true}>نعم</Option>
              <Option value={false}>لا</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="isNeeded"
            label="يستلزم إجراء؟"
            rules={[{ required: true, message: "اختر" }]}
          >
            <Select>
              <Option value={true}>نعم</Option>
              <Option value={false}>لا</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="projectId"
            label="المشروع"
            rules={[{ required: true, message: "اختر المشروع" }]}
          >
            <Select showSearch>
              {projectOptions.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="ministryId" label="الوزارة">
            <Select allowClear showSearch>
              {ministryOptions.map((m) => (
                <Option key={m.id} value={m.id}>
                  {m.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {/* الصف 4 */}
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="partyId"
            label="الجهة"
            rules={[{ required: true, message: "اختر الجهة" }]}
          >
            <Select showSearch>
              {partyOptions.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
        <Form.Item name="ccIds" label="نسخة إلى (CC)">
  <Select
    mode="multiple"
    allowClear
    showSearch
    maxTagCount="responsive"          // ⬅️ Auto-fit: يظهر ‎“+N”‎ حين يضيق الحقل
    maxTagTextLength={18}             // ⬅️ يختصر النصوص الطويلة داخل التاج
    maxTagPlaceholder={(omitted) => `+${omitted.length}`}
    optionFilterProp="children"
    onChange={handleCCsChange}
    style={{ width: "100%" }}
  >
    {ccOptions.map((cc) => (
      <Option key={cc.id} value={cc.id} label={cc.recipientName}>
        {cc.recipientName}
      </Option>
    ))}
  </Select>
</Form.Item>

        </Col>
        <Col span={8}>
        
<Form.Item name="tagIds" label="وسوم">
  <Select
    mode="multiple"
    allowClear
    showSearch
    maxTagCount="responsive"
    maxTagTextLength={14}
    maxTagPlaceholder={(omitted) => `+${omitted.length}`}
    optionFilterProp="children"
    onChange={handleTagsChange}
    style={{ width: "100%" }}
  >
    {tagOptions.map((t) => (
      <Option key={t.id} value={t.id} label={t.name}>
        {t.name}
      </Option>
    ))}
  </Select>
</Form.Item>
       
          
        </Col>
      </Row>

      {/* الموضوع / الملاحظات */}
      <Form.Item
        name="subject"
        label="الموضوع"
        rules={[{ required: true, message: "أدخل الموضوع" }]}
      >
        <TextArea rows={3} />
      </Form.Item>
      <Form.Item name="notes" label="ملاحظات">
        <TextArea rows={3} />
      </Form.Item>

      {/* معاينة المرفق الحالى */}
      {initialImageUrl && (
        <>
          <Divider orientation="left" plain>
            المرفق الحالى
          </Divider>
          <img
            src={initialImageUrl}
            alt="المرفق الحالى"
            style={{
              width: "100%",
              maxHeight: 260,
              objectFit: "contain",
              border: "1px solid #d9d9d9",
              borderRadius: 8,
              marginBottom: 16,
            }}
          />
        </>
      )}

      {/* مرفق جديد (اختياري) */}
      <Divider orientation="left" plain>
        استبدال المرفق (اختياري)
      </Divider>
      <Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          انقر أو اسحب ملف PDF / JPG / PNG هنا لإرساله مع التعديلات
        </p>
      </Dragger>

      {/* أزرار الحفظ */}
      <Divider />
      <Space>
        <Button type="primary" htmlType="submit" loading={submitting}>
          حفظ
        </Button>
        <Button onClick={onClose}>إلغاء</Button>
      </Space>
    </Form>
  );
}