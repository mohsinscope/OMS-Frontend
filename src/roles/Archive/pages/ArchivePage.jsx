// src/pages/ArchivePage.jsx
import React, { useEffect, useState } from "react";
import {
  Layout,
  ConfigProvider,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Table,
  Space,
  Divider,
  message,
  Card,
  Badge,
  Tooltip,
  DatePicker
} from "antd";
import { 
  DownOutlined, 
  UpOutlined, 
  BellOutlined, 
  CheckCircleOutlined, 
  AuditOutlined, 
  ExclamationCircleOutlined, 
  StarOutlined, 
  BookOutlined,
  CloseCircleOutlined
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import ar_EG from "antd/lib/locale/ar_EG";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import "../styles/archiveStyles.css";
import useAuthStore from './../../../store/store.js';

const { Content } = Layout;
const { Option } = Select;


/* ─────────── ثوابت ─────────── */
const DOCUMENT_TYPES = { 1: "صادر", 2: "وارد" };

const RESPONSE_TYPES = {
  1: "اجابة وارد",
  2: "تأكيد وارد",
  3: "وارد جديد",
  4: "اجابة صادر",
  5: "تأكيد صادر",
  6: "صادر جديد",
};

const RESPONSE_MAP = {
  1: [1, 5, 6], // صادر
  2: [4, 2, 3], // وارد
};

const PARTY_TYPE_LABELS = {
  MainDepartment: "مديرية عامة",
  Department: "مديرية",
  Section: "قسم",
  Directorate: "شعبة",
};

// تعريف أنواع الإختصارات
const SHORTCUTS = [
  { 
    key: 'isRequiresReply', 
    label: 'يتطلب رد', 
    icon: <BellOutlined />, 
    color: '#1890ff',
    hoverColor: '#40a9ff',
    bgColor: 'rgba(24, 144, 255, 0.1)'
  },
  { 
    key: 'isReplied', 
    label: 'تم الرد', 
    icon: <CheckCircleOutlined />, 
    color: '#52c41a',
    hoverColor: '#73d13d',
    bgColor: 'rgba(82, 196, 26, 0.1)'
  },
  { 
    key: 'isNotAudited', 
    label: 'غير مدقق', 
    icon: <CloseCircleOutlined />, 
    color: '#f5222d',
    hoverColor: '#ff4d4f',
    bgColor: 'rgba(245, 34, 45, 0.1)',
    value: false,
    valueKey: 'isAudited'
  },
  { 
    key: 'isAudited', 
    label: 'تم التدقيق', 
    icon: <AuditOutlined />, 
    color: '#722ed1',
    hoverColor: '#9254de',
    bgColor: 'rgba(114, 46, 209, 0.1)'
  },
  { 
    key: 'isUrgent', 
    label: 'عاجل', 
    icon: <ExclamationCircleOutlined />, 
    color: '#fa8c16',
    hoverColor: '#ffa940',
    bgColor: 'rgba(250, 140, 22, 0.1)'
  },
  { 
    key: 'isImportant', 
    label: 'مهم', 
    icon: <StarOutlined />, 
    color: '#eb2f96',
    hoverColor: '#f759ab',
    bgColor: 'rgba(235, 47, 150, 0.1)'
  },
  { 
    key: 'isNeeded', 
    label: 'مطلوب', 
    icon: <BookOutlined />, 
    color: '#13c2c2',
    hoverColor: '#36cfc9',
    bgColor: 'rgba(19, 194, 194, 0.1)'
  }
];

export default function ArchivePage() {
  
const { permissions } = useAuthStore();
const hasCreatePermission = permissions.includes("DOCc");
  const [form] = Form.useForm();
  const navigate = useNavigate();

  /* تحكم بتفعيل حقل نوع الرد */
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);

  /* قوائم ثابتة */
  const [projectOptions, setProjectOptions] = useState([]);
  const [ministryOptions, setMinistryOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [ccOptions, setCcOptions] = useState([]);
  const [documentPartyOptions, setDocumentPartyOptions] = useState([]);

  /* متغيرات ديناميكية */
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedIsOfficial, setSelectedIsOfficial] = useState(true);
  const [selectedPartyType, setSelectedPartyType] = useState(null);

  /* إظهار / إخفاء الفلاتر الإضافية */
  const [showAdvanced, setShowAdvanced] = useState(false);

  /* بيانات الجدول */
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  /* عدادات لأزرار الاختصارات */
  const [shortcutCounts, setShortcutCounts] = useState({
    isRequiresReply: 0,
    isReplied: 0,
    isAudited: 0,
    isNotAudited: 0,
    isUrgent: 0,
    isImportant: 0,
    isNeeded: 0
  });

  /* الفلتر النشط حالياً */
  const [activeShortcut, setActiveShortcut] = useState(null);

  /* ───── تحميل القوائم المرجعية ───── */
  useEffect(() => {
    (async () => {
      try {
        const [projects, ministries, tags, ccs] = await Promise.all([
          axiosInstance.get("/api/Project?PageNumber=1&PageSize=100"),
          axiosInstance.get("/api/Ministry?PageNumber=1&PageSize=100"),
          axiosInstance.get("/api/Tags?PageNumber=1&PageSize=100"),
          axiosInstance.get("/api/DocumentCC?PageNumber=1&PageSize=100"),
        ]);
        setProjectOptions(projects.data);
        setMinistryOptions(ministries.data);
        setTagOptions(tags.data);
        setCcOptions(ccs.data);
      } catch {
        message.error("خطأ في تحميل القوائم");
      }
    })();
  }, []);

  /* جلب الجهات ديناميكياً */
  const fetchDocumentParties = async (
    pType = selectedPartyType,
    proj = selectedProject,
    isOff = selectedIsOfficial
  ) => {
    if (!proj || !pType) return;
    try {
      const res = await axiosInstance.get(
        `/api/DocumentParty/${proj}/${pType}/${isOff}`
      );
      setDocumentPartyOptions(res.data);
    } catch {
      message.error("خطأ في جلب الجهات");
    }
  };

  /* جلب الكتب */
  const fetchDocuments = async (vals = {}, pageNumber = 1) => {
    setLoading(true);
    try {
      const body = {
        documentNumber: vals.documentNumber ?? null,
        documentDate: vals.documentDate ?? null,
        title: vals.title ?? null,
        subject: vals.subject ?? null,
        documentType: vals.documentType ?? null,
        responseType: vals.responseType ?? null,
        projectId: vals.projectId ?? null,
        partyId: vals.PartyId ?? null,
        ministryId: vals.ministryId ?? null,
        isRequiresReply: vals.isRequiresReply ?? null,
        isReplied: vals.isReplied ?? null,
        isAudited: vals.isAudited ?? null,
        isUrgent: vals.isUrgent ?? null,
        isImportant: vals.isImportant ?? null,
        isNeeded: vals.isNeeded ?? null,
        notes: vals.notes ?? null,
        pageNumber,
        pageSize: pagination.pageSize,
      };

      if (vals.ccIds?.length || vals.tagIds?.length) {
        body.ccIds = vals.ccIds;
        body.tagIds = vals.tagIds;
      }

      const url =
        body.ccIds || body.tagIds
          ? "/api/Document/search-by-links"
          : "/api/Document/search";

      const res = await axiosInstance.post(url, body);

      /* حاول قراءة إجمالي الصفوف من رأس الاستجابة إن وُجد */
      const total =
        res.headers?.pagination
          ? JSON.parse(res.headers.pagination).totalItems
          : res.data.length;

      setData(res.data);
      setPagination((p) => ({ ...p, total, current: pageNumber }));
    } catch {
      message.error("فشل جلب النتائج");
    } finally {
      setLoading(false);
    }
  };

  /* جلب عدادات الاختصارات */
  const fetchShortcutCounts = async () => {
    try {
      const counts = {};
      
      // جلب العدادات لكل اختصار
      for (const shortcut of SHORTCUTS) {
        const body = {
          documentNumber: null,
          documentDate: null,
          title: null,
          subject: null,
          documentType: null,
          responseType: null,
          isRequiresReply: null,
          isReplied: null,
          isAudited: null,
          isUrgent: null,
          isImportant: null,
          isNeeded: null,
          notes: null,
          projectId: null,
          partyId: null,
          ministryId: null,
          parentDocumentId: null,
          profileId: null,
          ccIds: null,
          tagIds: null
        };
        
        // تعيين الخاصية المطلوبة فقط
        if (shortcut.value !== undefined && shortcut.valueKey) {
          // إذا كان الاختصار يتطلب قيمة محددة (مثل isAudited: false)
          body[shortcut.valueKey] = shortcut.value;
        } else {
          // القيم الافتراضية هي true
          body[shortcut.key] = true;
        }
        
        const res = await axiosInstance.post("/api/Document/count", body);
        // Check if res.data is an object with totalCount property
        counts[shortcut.key] = typeof res.data === 'object' && res.data.totalCount !== undefined ? 
                              res.data.totalCount : 
                              (typeof res.data === 'number' ? res.data : 0);
      }
      
      setShortcutCounts(counts);
    } catch {
      message.error("فشل جلب عدادات الاختصارات");
    }
  };

  /* تحميل أولي */
  useEffect(() => {
    fetchDocuments({}, 1);
    fetchShortcutCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* أعمدة الجدول */
  const columns = [
    { title: "رقم الكتاب", dataIndex: "documentNumber", key: "documentNumber" },
    { title: "العنوان", dataIndex: "title", key: "title" },
    {
      title: "الموضوع",
      dataIndex: "subject",
      key: "subject",
      ellipsis: true,
      render: (t) => (t && t.length > 50 ? `${t.slice(0, 50)}…` : t),
    },
    {
      title: "نوع الكتاب",
      dataIndex: "documentType",
      render: (v) => DOCUMENT_TYPES[v],
    },
    {
      title: "نوع الرد",
      dataIndex: "responseType",
      render: (v) => RESPONSE_TYPES[v],
    },
    {
      title: "مدقق",
      dataIndex: "isAudited",               // ← use the boolean field
      key: "isAudited",
      render: audited => audited ? "نعم" : "لا"
    },
    {
      title: "التاريخ",
      dataIndex: "documentDate",
      render: (v) => v ? dayjs(v).format("YYYY-MM-DD") : "",
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_, r) => (
        <Button
          type="primary"
          style={{ height: 40, width: "fit-content" }}
          onClick={() => navigate("/ViewArchivePage", { state: { id: r.id } })}
        >
          عرض
        </Button>
      ),
    },
  ];

  /* عند تغيير صفحة الجدول */
  const handleTableChange = (pag) => {
    setPagination((p) => ({ ...p, current: pag.current }));
    fetchDocuments(form.getFieldsValue(), pag.current);
  };

  /* التبديل بين الاختصارات */
  const handleShortcutClick = (shortcutKey) => {
    // البحث عن تعريف الاختصار المحدد
    const selectedShortcut = SHORTCUTS.find(s => s.key === shortcutKey);
    
    // إذا كان الاختصار نشطاً بالفعل، قم بإلغاء تنشيطه
    if (activeShortcut === shortcutKey) {
      setActiveShortcut(null);
      
      // إعادة تعيين جميع الحقول المتعلقة بالاختصارات
      const resetValues = {};
      SHORTCUTS.forEach(s => {
        if (s.valueKey) {
          resetValues[s.valueKey] = null;
        } else {
          resetValues[s.key] = null;
        }
      });
      
      form.setFieldsValue(resetValues);
      fetchDocuments({...form.getFieldsValue(), ...resetValues}, 1);
    } else {
      // تنشيط الاختصار الجديد
      setActiveShortcut(shortcutKey);
      
      // إعادة تعيين جميع الاختصارات في النموذج أولاً
      const resetValues = {};
      SHORTCUTS.forEach(s => {
        if (s.valueKey) {
          resetValues[s.valueKey] = null;
        } else {
          resetValues[s.key] = null;
        }
      });
      
      // ثم تعيين الاختصار النشط بالقيمة المناسبة
      if (selectedShortcut.value !== undefined && selectedShortcut.valueKey) {
        resetValues[selectedShortcut.valueKey] = selectedShortcut.value;
      } else {
        resetValues[shortcutKey] = true;
      }
      
      form.setFieldsValue(resetValues);
      fetchDocuments({...form.getFieldsValue(), ...resetValues}, 1);
    }
  };

  /* ─────────────ــ الواجهة ــ──────────── */
  return (
    <ConfigProvider locale={ar_EG} direction="rtl">
      <Layout className="archive-layout">
        <Content className="archive-content">
          {/* رأس الصفحة */}
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <h1 style={{ margin: 0 }}>الأرشيف</h1>
            </Col>
            <Col>
            {hasCreatePermission && 
            
              <Link to="/AddArchive">
                <Button type="primary" size="large">
                  أرشفة كتاب +
                </Button>
              </Link>
            }
            </Col>
          </Row>

          {/* شريط الاختصارات */}
          <Card 
            style={{ 
              marginBottom: 24,
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            bodyStyle={{ padding: '16px 12px' }}
          >
            <Row gutter={[12, 16]} justify="center">
              {SHORTCUTS.map((shortcut) => (
                <Col key={shortcut.key} xs={12} sm={8} md={4} lg={3}>
                  <Badge 
                    count={shortcutCounts[shortcut.key] || 0} 
                    overflowCount={999}
                    style={{ 
                      backgroundColor: shortcut.color,
                      fontSize: '12px'
                    }}
                  >
                    <Button
                      type={activeShortcut === shortcut.key ? "primary" : "default"}
                      icon={React.cloneElement(shortcut.icon, { 
                        style: { 
                          fontSize: '18px', 
                          marginRight: '6px',
                          color: activeShortcut === shortcut.key ? "#fff" : shortcut.color 
                        } 
                      })}
                      size="large"
                      style={{ 
                        width: '100%',
                        height: '48px',
                        color: activeShortcut === shortcut.key ? "#fff" : shortcut.color,
                        borderColor: activeShortcut === shortcut.key ? shortcut.color : '#d9d9d9',
                        backgroundColor: activeShortcut === shortcut.key ? shortcut.color : undefined,
                        borderRadius: '6px',
                        fontWeight: activeShortcut === shortcut.key ? 'bold' : 'normal',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={() => handleShortcutClick(shortcut.key)}
                    >
                      {shortcut.label}
                    </Button>
                  </Badge>
                </Col>
              ))}
            </Row>
          </Card>

          {/* نموذج البحث */}
          <Divider orientation="center">بحث</Divider>
          <Form
            form={form}
            layout="vertical"
            onFinish={(vals) => {
              fetchDocuments(vals, 1);
            }}
          >
            {/* حقول أساسية */}
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item name="documentNumber" label="رقم الكتاب">
                  <Input allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="title" label="عنوان الكتاب">
                  <Input allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="subject" label="الموضوع">
                  <Input allowClear />
                </Form.Item>
              </Col>
            </Row>

            {/* زر الفلاتر الإضافية */}
            <Button
              type="link"
              onClick={() => setShowAdvanced(!showAdvanced)}
              icon={showAdvanced ? <UpOutlined /> : <DownOutlined />}
              style={{ padding: 0, marginBottom: showAdvanced ? 24 : 0 }}
            >
              الفلاتر الإضافية
            </Button>

            {showAdvanced && (
              <>
                <Row gutter={16}>
                  {/* تاريخ الكتاب */}
                  <Col xs={24} md={6}>
                    <Form.Item label="تاريخ الكتاب">
                      <DatePicker 
                        style={{ width: '100%' }} 
                        format="YYYY-MM-DD"
                        onChange={(date) => {
                          if (date) {
                            // Format as ISO string then modify to match the required format
                            const formattedDate = date.format('YYYY-MM-DD') + 'T00:00:00Z';
                            // Set the hidden form field value
                            form.setFieldValue('documentDate', formattedDate);
                          } else {
                            // Clear the value if date is cleared
                            form.setFieldValue('documentDate', null);
                          }
                        }}
                      />
                      {/* Hidden field to store the actual formatted date value */}
                      <Form.Item name="documentDate" hidden noStyle></Form.Item>
                    </Form.Item>
                  </Col>

                  {/* نوع الكتاب */}
                  <Col xs={24} md={6}>
                    <Form.Item name="documentType" label="نوع الكتاب">
                      <Select
                        allowClear
                        onChange={(val) => {
                          setSelectedDocumentType(val || null);
                          form.setFieldsValue({ responseType: undefined });
                        }}
                      >
                        {Object.entries(DOCUMENT_TYPES).map(([v, l]) => (
                          <Option key={v} value={Number(v)}>
                            {l}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  {/* نوع الرد */}
                  <Col xs={24} md={6}>
                    <Form.Item name="responseType" label="نوع الرد">
                      <Select
                        allowClear
                        disabled={!selectedDocumentType}
                      >
                        {(selectedDocumentType
                          ? RESPONSE_MAP[selectedDocumentType]
                          : []
                        ).map((code) => (
                          <Option key={code} value={code}>
                            {RESPONSE_TYPES[code]}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  
                  {/* المشروع */}
                  <Col xs={24} md={6}>
                    <Form.Item name="projectId" label="المشروع">
                      <Select
                        showSearch
                        allowClear
                        filterOption={(i, o) =>
                          o.children.toLowerCase().includes(i.toLowerCase())
                        }
                        onChange={(val) => {
                          setSelectedProject(val);
                          form.setFieldsValue({ PartyId: undefined });
                          fetchDocumentParties(selectedPartyType, val);
                        }}
                      >
                        {projectOptions.map((p) => (
                          <Option key={p.id} value={p.id}>
                            {p.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  {/* جهة رسمية؟ - بلا قيمة ابتدائية */}
                  <Col xs={24} md={6}>
                    <Form.Item name="isOfficialParty" label="جهة رسمية؟">
                      <Select
                        allowClear
                        onChange={(v) => {
                          setSelectedIsOfficial(
                            v === undefined ? true : v /* fallback */
                          );
                          form.setFieldsValue({
                            ministryId: undefined,
                            PartyId: undefined,
                          });
                          fetchDocumentParties(
                            selectedPartyType,
                            selectedProject,
                            v === undefined ? true : v
                          );
                        }}
                      >
                        <Option value={true}>رسمية</Option>
                        <Option value={false}>غير رسمية</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  {/* الوزارة */}
                  <Col xs={24} md={6}>
                    <Form.Item name="ministryId" label="الوزارة">
                      <Select
                        disabled={!selectedIsOfficial}
                        showSearch
                        allowClear
                        filterOption={(i, o) =>
                          o.children.toLowerCase().includes(i.toLowerCase())
                        }
                      >
                        {ministryOptions.map((m) => (
                          <Option key={m.id} value={m.id}>
                            {m.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  {/* نوع الجهة */}
                  <Col xs={24} md={6}>
                    <Form.Item name="partyType" label="نوع الجهة">
                      <Select
                        allowClear
                        onChange={(v) => {
                          setSelectedPartyType(v);
                          form.setFieldsValue({ PartyId: undefined });
                          fetchDocumentParties(v);
                        }}
                      >
                        {Object.entries(PARTY_TYPE_LABELS).map(([k, v]) => (
                          <Option key={k} value={k}>
                            {v}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  {/* اسم الجهة */}
                  <Col xs={24} md={6}>
                    <Form.Item name="PartyId" label="اسم الجهة">
                      <Select
                        disabled={!selectedProject || !selectedPartyType}
                        showSearch
                        allowClear
                        filterOption={(i, o) =>
                          o.children.toLowerCase().includes(i.toLowerCase())
                        }
                      >
                        {documentPartyOptions
                          .filter((p) => p.isOfficial === selectedIsOfficial)
                          .map((p) => (
                            <Option key={p.id} value={p.id}>
                              {p.name}
                            </Option>
                          ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  {/* نسخة إلى */}
                  <Col xs={24} md={6}>
                    <Form.Item name="ccIds" label="نسخة إلى (CC)">
                      <Select
                        mode="multiple"
                        allowClear
                        showSearch
                        filterOption={(i, o) =>
                          o.children.toLowerCase().includes(i.toLowerCase())
                        }
                      >
                        {ccOptions.map((cc) => (
                          <Option key={cc.id} value={cc.id}>
                            {cc.recipientName}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  {/* الوسوم */}
                  <Col xs={24} md={6}>
                    <Form.Item name="tagIds" label="الوسوم">
                      <Select
                        mode="multiple"
                        allowClear
                        showSearch
                        filterOption={(i, o) =>
                          o.children.toLowerCase().includes(i.toLowerCase())
                        }
                      >
                        {tagOptions.map((t) => (
                          <Option key={t.id} value={t.id}>
                            {t.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  {/* ملاحظات */}
                  <Col xs={24} md={12}>
                    <Form.Item name="notes" label="ملاحظات">
                      <Input.TextArea allowClear rows={2} />
                    </Form.Item>
                  </Col>
                </Row>

                {/* حقول مخفية للاختصارات */}
                {SHORTCUTS.map(shortcut => {
                  // تحديد اسم الحقل المناسب
                  const fieldName = shortcut.valueKey || shortcut.key;
                  return (
                    <Form.Item 
                      key={fieldName} 
                      name={fieldName} 
                      hidden
                    >
                      <Input />
                    </Form.Item>
                  );
                })}
              </>
            )}

            {/* أزرار */}
            <Row>
              <Col span={24}>
                <Space style={{ marginTop: 16 }}>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    بحث
                  </Button>
                  <Button
                    onClick={() => {
                      form.resetFields();
                      setSelectedDocumentType(null);
                      setActiveShortcut(null);
                      fetchDocuments({}, 1);
                    }}
                  >
                    إعادة تعيين
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form>

          {/* جدول النتائج */}
          <Divider orientation="center">النتائج</Divider>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={{
              ...pagination,
              position: ["bottomCenter"],
              showSizeChanger: false,
            }}
            onChange={handleTableChange}
            scroll={{ x: true }}
          />
        </Content>
      </Layout>
    </ConfigProvider>
  );
}