// src/pages/addArchivePage/AddDocumentPage.jsx
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
  Layout,
  ConfigProvider,
  Space,
} from "antd";
import {
  InboxOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import moment from "moment";

import OfficialPartySelector from './../../addArchivePage/components/OfficialPartySelector.jsx';
import PrivatePartySelector from './../../addArchivePage/components/PrivatePartySelector.jsx';

import useAuthStore from './../../../../../store/store.js';

import ar_EG from "antd/lib/locale/ar_EG";
import axiosInstance from './../../../../../intercepters/axiosInstance.js';

const { Header, Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

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

const getDocumentOptionChoices = (side) => {
  if (side === "صادر") return ["اجابة وارد", "تأكيد صادر", "صادر جديد"];
  if (side === "وارد")  return ["اجابة صادر", "تأكيد وارد", "وارد جديد"];
  return [];
};

export default function AddDocumentPage({
  editMode = false,
  initialValues = {},
}) {
  const [form] = Form.useForm();
  const navigate  = useNavigate();
  const profileId = useAuthStore((s) => s.profile?.profileId);

  const [projectOptions, setProjectOptions] = useState([]);
  const [ccOptions,      setCcOptions]      = useState([]);
  const [tagOptions,     setTagOptions]     = useState([]);
  const [fileList,       setFileList]       = useState([]);
  const [previewUrls,    setPreviewUrls]    = useState([]);

  const [selectedDocumentSide, setSelectedDocumentSide] = useState(
    editMode ? initialValues.documentSide : null
  );
  const [isOfficial, setIsOfficial] = useState(
    editMode ? initialValues.isOfficialParty : true
  );

  useEffect(() => {
    (async () => {
      try {
        const [projs, ccs, tags] = await Promise.all([
          axiosInstance.get("/api/Project?PageNumber=1&PageSize=10000"),
          axiosInstance.get("/api/DocumentCC?PageNumber=1&PageSize=1000"),
          axiosInstance.get("/api/Tags?PageNumber=1&PageSize=1000"),
        ]);
        setProjectOptions(projs.data);
        setCcOptions(ccs.data);
        setTagOptions(tags.data);
      } catch {
        message.error("خطأ في تحميل القوائم الثابتة");
      }
    })();
  }, []);

  useEffect(() => {
    if (!editMode || !initialValues.fileUrl) return;
    const f = {
      uid: "-1",
      name: initialValues.fileName || "Current file",
      status: "done",
      url: initialValues.fileUrl,
    };
    setFileList([f]);
    if (initialValues.fileType?.startsWith("image/")) {
      setPreviewUrls([initialValues.fileUrl]);
    }
  }, [editMode, initialValues]);

  const fileUploadProps = {
    name: "file",
    multiple: true,
    fileList,
    beforeUpload: (file) => {
      const ok =
        ["application/pdf", "image/jpeg", "image/png"].includes(file.type) &&
        file.size / 1024 / 1024 < 10;
      if (!ok) {
        message.error("يسمح فقط بملفات PDF أو JPG/PNG أقل من 10MB");
        return false;
      }
      setFileList((prev) => [...prev, file]);
      if (file.type.startsWith("image/")) {
        setPreviewUrls((prev) => [...prev, URL.createObjectURL(file)]);
      }
      return false;
    },
    onRemove: (file) => {
      setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
      setPreviewUrls((prev) =>
        prev.filter((_, i) => fileList[i]?.uid !== file.uid)
      );
    },
  };

  const handleSubmit = async () => {
    try {
      const vals = await form.validateFields();
      if (!profileId) return message.error("تعذّر تحديد المستخدم");
      const fd = new FormData();
      fd.append("ProfileId", profileId);
      fd.append("Subject",   vals.subject);
      fd.append("Notes",     vals.notes || "");
      fd.append("ProjectId", vals.projectId);
      fd.append("DocumentNumber", vals.documentNumber);
      fd.append(
        editMode ? "ReplyDate" : "DocumentDate",
        vals.date.format("YYYY-MM-DDT00:00:00[Z]")
      );
      fd.append(
        editMode ? "ReplyType" : "DocumentType",
        selectedDocumentSide === "صادر" ? "1" : "2"
      );
      fd.append(
        "ResponseType",
        getResponseTypeValue(selectedDocumentSide, vals.ResponseType)
      );
      if (isOfficial) {
        fd.append("MinistryId",           vals.ministryId);
        fd.append("GeneralDirectorateId", vals.generalDirectorateId);
        fd.append("DirectorateId",        vals.directorateId);
        fd.append("DepartmentId",         vals.departmentId);
        fd.append("SectionId",            vals.sectionId);
      } else {
        fd.append("PrivatePartyId",       vals.privatePartyId);
      }
      ["isRequiresReply","isUrgent","isImportant","isNeeded"].forEach((f) =>
        fd.append(f, vals[f])
      );
      (vals.ccIds   || []).forEach((id) => fd.append("CCIds",  id));
      (vals.tagIds  || []).forEach((id) => fd.append("TagIds", id));
      fileList.forEach((f) => fd.append("Files", f.originFileObj || f, f.name));

      const url    = editMode ? `/api/Document/${initialValues.id}` : "/api/Document";
      const method = editMode ? "put" : "post";
      await axiosInstance[method](url, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.success(editMode ? "تم حفظ التغييرات" : "تم إضافة الكتاب");
      navigate("/archive");
    } catch (e) {
      message.error(e.response?.data?.message || "خطأ في حفظ البيانات");
    }
  };

  return (
    <ConfigProvider locale={ar_EG} direction="rtl">
      <Layout style={{ background: "none" }}>
        <Header style={{ background: "#fff", padding: 16 }}>
          <h1>{editMode ? "تعديل كتاب" : "إضافة كتاب جديد"}</h1>
        </Header>
        <Content style={{ padding: 24, background: "#fff" }}>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              // official/private toggle
              isOfficialParty: initialValues.isOfficialParty ?? true,
              // classification
              documentSide:    initialValues.documentSide,
              ResponseType:    initialValues.responseTypeString,
              // basics
              documentNumber:  initialValues.documentNumber,
              date:            initialValues.date ? moment(initialValues.date) : undefined,
              projectId:       initialValues.projectId,
              ccIds:           initialValues.ccIds,
              tagIds:          initialValues.tagIds,
              // flags
              isRequiresReply: initialValues.isRequiresReply,
              isUrgent:        initialValues.isUrgent,
              isImportant:     initialValues.isImportant,
              isNeeded:        initialValues.isNeeded,
              subject:         initialValues.subject,
              notes:           initialValues.notes,
              // cascade
              ministryId:           initialValues.ministryId,
              generalDirectorateId: initialValues.generalDirectorateId,
              directorateId:        initialValues.directorateId,
              departmentId:         initialValues.departmentId,
              sectionId:            initialValues.sectionId,
              // private
              privatePartyId:       initialValues.privatePartyId,
            }}
          >
            {/* official/private */}
            <Divider orientation="left">نوع الجهة</Divider>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item
                  name="isOfficialParty"
                  label="جهة رسمية؟"
                  rules={[{ required: true, message: "اختر" }]}
                >
                  <Select
                    onChange={(v) => {
                      setIsOfficial(v);
                      form.resetFields([
                        "ministryId","generalDirectorateId","directorateId",
                        "departmentId","sectionId","privatePartyId",
                      ]);
                    }}
                  >
                    <Option value={true}>رسمية</Option>
                    <Option value={false}>غير رسمية</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={18}>
                <OfficialPartySelector disabled={!form.getFieldValue("isOfficialParty")} />
                <PrivatePartySelector  disabled={ form.getFieldValue("isOfficialParty")} />
              </Col>
            </Row>

            {/* classification */}
            <Divider orientation="left">تصنيف الكتاب</Divider>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item
                  name="documentSide"
                  label="نوع الكتاب"
                  rules={[{ required: true, message: "اختر" }]}
                >
                  <Select
                    onChange={(v) => {
                      setSelectedDocumentSide(v);
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
                    {getDocumentOptionChoices(selectedDocumentSide).map((opt) => (
                      <Option key={opt}>{opt}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* basic details */}
            <Divider orientation="left">تفاصيل أساسية</Divider>
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
                    {projectOptions.map((p) => (
                      <Option key={p.id} value={p.id}>
                        {p.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* attributes */}
            <Divider orientation="left">سمات الكتاب</Divider>
            <Row gutter={16}>
              {["isRequiresReply","isUrgent","isImportant","isNeeded"].map(
                (field, i) => (
                  <Col span={6} key={field}>
                    <Form.Item
                      name={field}
                      label={["يتطلب رد؟","عاجل؟","مهم؟","يستلزم إجراء؟"][i]}
                      rules={[{ required: true, message: "اختر" }]}
                    >
                      <Select>
                        <Option value={true}>نعم</Option>
                        <Option value={false}>لا</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                )
              )}
            </Row>

            {/* subject & notes */}
            <Divider orientation="left">الموضوع والملاحظات</Divider>
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

            {/* attachments */}
            <Divider orientation="left">المرفقات</Divider>
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
                {previewUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt=""
                    style={{
                      width: "100%",
                      maxHeight: 120,
                      objectFit: "contain",
                      marginBottom: 8,
                    }}
                  />
                ))}
              </Col>
            </Row>
          </Form>

          {/* actions */}
          <Space style={{ marginTop: 24 }}>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleSubmit}
            >
              {editMode ? "حفظ التغييرات" : "حفظ"}
            </Button>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/archive")}
            >
              العودة
            </Button>
          </Space>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
