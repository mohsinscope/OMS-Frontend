// src/pages/ArchivePage.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Layout, ConfigProvider, Form, Input, Select, Button, Row, Col,
  Table, Space, Divider, message, Card, Badge, DatePicker
} from "antd";
import {
  DownOutlined, UpOutlined, BellOutlined, CheckCircleOutlined,
  AuditOutlined, ExclamationCircleOutlined, StarOutlined,
  BookOutlined, CloseCircleOutlined
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import ar_EG from "antd/lib/locale/ar_EG";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import "../styles/archiveStyles.css";
import useAuthStore from "./../../../store/store.js";

const { Content } = Layout;
const { Option }  = Select;

/* ثابتات */
const DOCUMENT_TYPES = { 1: "وارد", 2: "صادر" };
const RESPONSE_TYPES = {
  1:"اجابة وارد",2:"تأكيد وارد",3:"وارد جديد",
  4:"اجابة صادر",5:"تأكيد صادر",6:"صادر جديد"
};
const RESPONSE_MAP = { 1:[1,5,6], 2:[4,2,3] };

const SHORTCUTS = [
  { key:"isRequiresReply",label:"يتطلب رد",icon:<BellOutlined/>,color:"#1890ff" },
  { key:"isReplied",      label:"تم الرد",  icon:<CheckCircleOutlined/>,color:"#52c41a" },
  { key:"isNotAudited",   label:"غير مدقق", icon:<CloseCircleOutlined/>,color:"#f5222d",value:false,valueKey:"isAudited" },
  { key:"isAudited",      label:"تم التدقيق",icon:<AuditOutlined/>,color:"#722ed1" },
  { key:"isUrgent",       label:"عاجل",     icon:<ExclamationCircleOutlined/>,color:"#fa8c16" },
  { key:"isImportant",    label:"مهم",      icon:<StarOutlined/>,color:"#eb2f96" },
  { key:"isNeeded",       label:"مطلوب",    icon:<BookOutlined/>,color:"#13c2c2" }
];

export default function ArchivePage() {
  const { permissions } = useAuthStore();
  const hasCreatePermission = permissions.includes("DOCc");

  const [form] = Form.useForm();
  const navigate = useNavigate();

  /* ───────── state العام ───────── */
  const [selectedDocumentType,setSelectedDocumentType] = useState(null);
  const [showAdvanced,setShowAdvanced]   = useState(false);
  const [data,setData]                   = useState([]);
  const [loading,setLoading]             = useState(false);
  const [pagination,setPagination]       = useState({current:1,pageSize:10,total:0});
  const [shortcutCounts,setShortcutCounts] = useState({});
  const [activeShortcut,setActiveShortcut] = useState(null);

  /* ───────── قوائم ثابتة ───────── */
  const [projectOptions,setProjectOptions] = useState([]);
  const [tagOptions,setTagOptions]         = useState([]);
  const [ccOptions,setCcOptions]           = useState([]);

  /* ───────── قوائم الجهة الرسمية ───────── */
  const [ministryOptions,setMinistryOptions]             = useState([]);
  const [generalDirOptions,setGeneralDirOptions]         = useState([]);
  const [directorateOptions,setDirectorateOptions]       = useState([]);
  const [departmentOptions,setDepartmentOptions]         = useState([]);
  const [sectionOptions,setSectionOptions]               = useState([]);

  /* ───────── قوائم الجهة غير الرسمية ───────── */
  const [privatePartyOptions,setPrivatePartyOptions]     = useState([]);

  /* ───────── API helpers ───────── */
  const fetchAllStatic = useCallback(async() => {
    try{
      const [proj,tags,cc,minis,priv] = await Promise.all([
        axiosInstance.get("/api/Project?PageNumber=1&PageSize=1000"),
        axiosInstance.get("/api/Tags?PageNumber=1&PageSize=1000"),
        axiosInstance.get("/api/DocumentCC?PageNumber=1&PageSize=1000"),
        axiosInstance.get("/api/Ministry?PageNumber=1&PageSize=1000"),
        axiosInstance.get("/api/PrivateParty?PageNumber=1&PageSize=1000")
      ]);
      setProjectOptions(proj.data);
      setTagOptions(tags.data);
      setCcOptions(cc.data);
      setMinistryOptions(minis.data);
      setPrivatePartyOptions(priv.data);
    }catch{ message.error("تعذّر تحميل القوائم الثابتة"); }
  },[]);

  /* ───────── مديرية عامة ───────── */
const fetchGeneralDirectorates = async (ministryId) => {
  setGeneralDirOptions([]); setDirectorateOptions([]); setDepartmentOptions([]); setSectionOptions([]);
  if (!ministryId) return;

  try {
    const { data } = await axiosInstance.get(
      `/api/GeneralDirectorate/ByMinistry/${ministryId}`
    );
    setGeneralDirOptions(data);
  } catch (error) {
    if (error.response?.status === 404) {
      message.error("لا توجد مديرية عامة متصلة بهذه الوزارة");
    } else {
      message.error("خطأ في تحميل المديريات العامة");
      console.error(error);
    }
    setGeneralDirOptions([]);
  }
};

/* ───────── مديرية ───────── */
const fetchDirectorates = async (generalId) => {
  setDirectorateOptions([]); setDepartmentOptions([]); setSectionOptions([]);
  if (!generalId) return;

  try {
    const { data } = await axiosInstance.get(
      `/api/Directorate/ByGeneralDirectorate/${generalId}`
    );
    setDirectorateOptions(data);
  } catch (error) {
    if (error.response?.status === 404) {
      message.error("لا توجد مديرية متصلة بهذه المديرية العامة");
    } else {
      message.error("خطأ في تحميل المديريات");
      console.error(error);
    }
    setDirectorateOptions([]);
  }
};

/* ───────── قسم ───────── */
const fetchDepartments = async (dirId) => {
  setDepartmentOptions([]); setSectionOptions([]);
  if (!dirId) return;

  try {
    const { data } = await axiosInstance.get(
      `/api/Department/ByDirectorate/${dirId}`
    );
    setDepartmentOptions(data);
  } catch (error) {
    if (error.response?.status === 404) {
      message.error("لا يوجد قسم متصل بهذه المديرية");
    } else {
      message.error("خطأ في تحميل الأقسام");
      console.error(error);
    }
    setDepartmentOptions([]);
  }
};

/* ───────── شعبة ───────── */
const fetchSections = async (depId) => {
  setSectionOptions([]);
  if (!depId) return;

  try {
    const { data } = await axiosInstance.get(
      `/api/Section/ByDepartment/${depId}`
    );
    setSectionOptions(data);
  } catch (error) {
    if (error.response?.status === 404) {
      message.error("لا توجد شعبة متصله بهذا القسم");
    } else {
      message.error("خطأ في تحميل الشعب");
      console.error(error);
    }
    setSectionOptions([]);
  }
};

  /* ───────── تحميل أولي ───────── */
  useEffect(()=>{ fetchAllStatic(); },[fetchAllStatic]);

  /* ───────── جلب الكتب ───────── */
  const fetchDocuments = async(vals={},page=1)=>{
    setLoading(true);
    try{
      const body={
        documentNumber:vals.documentNumber??null,
        documentDate:  vals.documentDate??null,
        title:         vals.title??null,
        subject:       vals.subject??null,
        documentType:  vals.documentType??null,
        responseType:  vals.responseType??null,
        isRequiresReply:vals.isRequiresReply??null,
        isReplied:      vals.isReplied??null,
        isAudited:      vals.isAudited??null,
        isUrgent:       vals.isUrgent??null,
        isImportant:    vals.isImportant??null,
        isNeeded:       vals.isNeeded??null,
        notes:          vals.notes??null,
        projectId:            vals.projectId??null,
        privatePartyId:       vals.privatePartyId??null,
        sectionId:            vals.sectionId??null,
        departmentId:         vals.departmentId??null,
        directorateId:        vals.directorateId??null,
        generalDirectorateId: vals.generalDirectorateId??null,
        ministryId:           vals.ministryId??null,
        parentDocumentId:null, profileId:null,
        pageNumber:page, pageSize:pagination.pageSize
      };
      if(vals.ccIds?.length||vals.tagIds?.length){
        body.ccIds=vals.ccIds; body.tagIds=vals.tagIds;
      }
      const url = body.ccIds||body.tagIds
        ? "/api/Document/search-by-links"
        : "/api/Document/search";

      const res = await axiosInstance.post(url,body);
      const total = res.headers?.pagination
        ? JSON.parse(res.headers.pagination).totalItems
        : res.data.length;
      setData(res.data);
      setPagination(p=>({...p,total,current:page}));
    }finally{ setLoading(false); }
  };

  useEffect(()=>{ fetchDocuments({},1); },[]);

  /* ───────── عدادات الاختصارات ───────── */
  useEffect(()=>{
    (async()=>{
      try{
        const counts={};
        for(const sc of SHORTCUTS){
          const body={
            documentNumber:null,documentDate:null,title:null,subject:null,
            documentType:null,responseType:null,isRequiresReply:null,isReplied:null,
            isAudited:null,isUrgent:null,isImportant:null,isNeeded:null,notes:null,
            projectId:null,privatePartyId:null,sectionId:null,departmentId:null,
            directorateId:null,generalDirectorateId:null,ministryId:null,
            parentDocumentId:null,profileId:null,ccIds:null,tagIds:null
          };
          sc.valueKey? body[sc.valueKey]=sc.value : body[sc.key]=true;
          const r=await axiosInstance.post("/api/Document/count",body);
          counts[sc.key]=r.data?.totalCount??r.data??0;
        }
        setShortcutCounts(counts);
      }catch{ message.error("فشل جلب عدادات الاختصارات"); }
    })();
  },[]);

  /* ───────── أعمدة الجدول ───────── */
  const columns=[
    {title:"رقم الكتاب",dataIndex:"documentNumber"},
    {title:"العنوان",   dataIndex:"title"},
    {title:"الموضوع",   dataIndex:"subject",ellipsis:true,
      render:t=>t&&t.length>50?`${t.slice(0,50)}…`:t},
    {title:"نوع الكتاب",dataIndex:"documentType",render:v=>DOCUMENT_TYPES[v]},
    {title:"نوع الرد",  dataIndex:"responseType",render:v=>RESPONSE_TYPES[v]},
    {title:"مدقق",      dataIndex:"isAudited",render:v=>v?"نعم":"لا"},
    {title:"التاريخ",   dataIndex:"documentDate",render:v=>v?dayjs(v).format("YYYY-MM-DD"):""},
    {title:"الإجراءات", render:(_,r)=>
      <Button type="primary" onClick={()=>navigate("/ViewArchivePage",{state:{id:r.id}})}>عرض</Button>}
  ];

  /* ───────── التبديل بين الاختصارات ───────── */
  const toggleShortcut=key=>{
    const sc=SHORTCUTS.find(s=>s.key===key);
    const reset={}; SHORTCUTS.forEach(s=>{reset[s.valueKey||s.key]=null;});
    if(activeShortcut===key){ setActiveShortcut(null); }
    else{ setActiveShortcut(key);
      sc.valueKey?reset[sc.valueKey]=sc.value:reset[key]=true; }
    form.setFieldsValue(reset);
    fetchDocuments({...form.getFieldsValue(),...reset},1);
  };

  /* ───────── واجهة الاستخدام ───────── */
  return (
    <ConfigProvider locale={ar_EG} direction="rtl">
      <Layout className="archive-layout">
        <Content className="archive-content">

          {/* رأس الصفحة */}
          <Row justify="space-between" align="middle" style={{marginBottom:16}}>
            <Col><h1 style={{margin:0}}>الأرشيف</h1></Col>
            <Col>{hasCreatePermission&&(
              <Link to="/AddArchive"><Button type="primary" size="large">أرشفة كتاب +</Button></Link>
            )}</Col>
          </Row>

          {/* شريط الاختصارات */}
          <Card bodyStyle={{padding:"16px 12px"}}
                style={{marginBottom:24,borderRadius:8,boxShadow:"0 2px 8px rgba(0,0,0,.1)"}}>
            <Row gutter={[12,16]} justify="center">
              {SHORTCUTS.map(sc=>(
                <Col key={sc.key} xs={12} sm={8} md={4} lg={3}>
                  <Badge count={shortcutCounts[sc.key]||0} overflowCount={999}
                         style={{backgroundColor:sc.color,fontSize:12}}>
                    <Button type={activeShortcut===sc.key?"primary":"default"} size="large"
                      icon={React.cloneElement(sc.icon,{style:{fontSize:18,marginRight:6,color:activeShortcut===sc.key?"#fff":sc.color}})}
                      style={{width:"100%",height:48,color:activeShortcut===sc.key?"#fff":sc.color,
                              borderColor:activeShortcut===sc.key?sc.color:"#d9d9d9",
                              backgroundColor:activeShortcut===sc.key?sc.color:undefined,
                              borderRadius:6,fontWeight:activeShortcut===sc.key?"bold":"normal"}}
                      onClick={()=>toggleShortcut(sc.key)}>
                      {sc.label}
                    </Button>
                  </Badge>
                </Col>
              ))}
            </Row>
          </Card>

          {/* نموذج البحث */}
          <Divider orientation="center">بحث</Divider>
          <Form form={form} layout="vertical" onFinish={v=>fetchDocuments(v,1)}>

            {/* أساسي */}
            <Row gutter={16}>
              <Col xs={24} md={8}><Form.Item name="documentNumber" label="رقم الكتاب"><Input allowClear/></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="title"          label="عنوان الكتاب"><Input allowClear/></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="subject"        label="الموضوع"><Input allowClear/></Form.Item></Col>
            </Row>

            {/* زر الفلاتر */}
            <Button type="link" icon={showAdvanced?<UpOutlined/>:<DownOutlined/>}
                    onClick={()=>setShowAdvanced(!showAdvanced)}
                    style={{padding:0,marginBottom:showAdvanced?24:0}}>
              الفلاتر الإضافية
            </Button>

            {showAdvanced&&(
              <>
                {/* تاريخ / نوع الكتاب / الرد / المشروع */}

                <Divider orientation="center">المعلومات الاساسية</Divider>
                <Row gutter={16}>
                  <Col xs={24} md={6}>
                    <Form.Item label="تاريخ الكتاب">
                      <DatePicker style={{width:"100%"}} format="YYYY-MM-DD"
                        onChange={d=>form.setFieldValue("documentDate",
                          d?`${d.format("YYYY-MM-DD")}T00:00:00Z`:null)}/>
                      <Form.Item name="documentDate" hidden noStyle/>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="documentType" label="نوع الكتاب">
                      <Select allowClear
                        onChange={v=>{setSelectedDocumentType(v||null);form.setFieldsValue({responseType:undefined});}}>
                        {Object.entries(DOCUMENT_TYPES).map(([v,l])=>
                          <Option key={v} value={Number(v)}>{l}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="responseType" label="نوع الرد">
                      <Select allowClear disabled={!selectedDocumentType}>
                        {(selectedDocumentType?RESPONSE_MAP[selectedDocumentType]:[]).map(code=>
                          <Option key={code} value={code}>{RESPONSE_TYPES[code]}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="projectId" label="المشروع">
                      <Select allowClear showSearch
                        filterOption={(i,o)=>o.children.toLowerCase().includes(i.toLowerCase())}>
                        {projectOptions.map(p=><Option key={p.id} value={p.id}>{p.name}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {/* الجهة الرسمية – كاسكاد */}
                <Divider orientation="center">الجهة الرسمية</Divider>
                <Row gutter={16}>
                  <Col xs={24} md={6}>
                    <Form.Item name="ministryId" label="الوزارة">
                      <Select allowClear showSearch
                        onChange={val=>{
                          form.setFieldsValue({
                            generalDirectorateId:undefined,directorateId:undefined,
                            departmentId:undefined,sectionId:undefined
                          });
                          fetchGeneralDirectorates(val);
                        }}
                        filterOption={(i,o)=>o.children.toLowerCase().includes(i.toLowerCase())}>
                        {ministryOptions.map(m=><Option key={m.id} value={m.id}>{m.name}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="generalDirectorateId" label="مديرية عامة">
                      <Select allowClear showSearch
                        onChange={val=>{
                          form.setFieldsValue({directorateId:undefined,departmentId:undefined,sectionId:undefined});
                          fetchDirectorates(val);
                        }}
                        disabled={!generalDirOptions.length}
                        filterOption={(i,o)=>o.children.toLowerCase().includes(i.toLowerCase())}>
                        {generalDirOptions.map(g=><Option key={g.id} value={g.id}>{g.name}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="directorateId" label="مديرية">
                      <Select allowClear showSearch
                        onChange={val=>{
                          form.setFieldsValue({departmentId:undefined,sectionId:undefined});
                          fetchDepartments(val);
                        }}
                        disabled={!directorateOptions.length}
                        filterOption={(i,o)=>o.children.toLowerCase().includes(i.toLowerCase())}>
                        {directorateOptions.map(d=><Option key={d.id} value={d.id}>{d.name}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="departmentId" label="قسم">
                      <Select allowClear showSearch
                        onChange={val=>{
                          form.setFieldsValue({sectionId:undefined});
                          fetchSections(val);
                        }}
                        disabled={!departmentOptions.length}
                        filterOption={(i,o)=>o.children.toLowerCase().includes(i.toLowerCase())}>
                        {departmentOptions.map(dep=><Option key={dep.id} value={dep.id}>{dep.name}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="sectionId" label="شعبة">
                      <Select allowClear showSearch
                        disabled={!sectionOptions.length}
                        filterOption={(i,o)=>o.children.toLowerCase().includes(i.toLowerCase())}>
                        {sectionOptions.map(sec=><Option key={sec.id} value={sec.id}>{sec.name}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="privatePartyId" label="الجهة الخاصة">
                      <Select allowClear showSearch
                        loading={!privatePartyOptions.length}
                        filterOption={(i,o)=>o.children.toLowerCase().includes(i.toLowerCase())}>
                        {privatePartyOptions.map(pv=><Option key={pv.id} value={pv.id}>{pv.name}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

    
                {/* CC / Tags / Notes */}
                <Divider orientation="center">معلومات اضافية</Divider>
                <Row gutter={16}>
                  <Col xs={24} md={6}>
                    <Form.Item name="ccIds" label="نسخة إلى (CC)">
                      <Select mode="multiple" allowClear showSearch
                        filterOption={(i,o)=>o.children.toLowerCase().includes(i.toLowerCase())}>
                        {ccOptions.map(cc=><Option key={cc.id} value={cc.id}>{cc.recipientName}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="tagIds" label="الوسوم">
                      <Select mode="multiple" allowClear showSearch
                        filterOption={(i,o)=>o.children.toLowerCase().includes(i.toLowerCase())}>
                        {tagOptions.map(t=><Option key={t.id} value={t.id}>{t.name}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="notes" label="ملاحظات">
                      <Input.TextArea rows={2} allowClear/>
                    </Form.Item>
                  </Col>
                </Row>

                {/* حقول الاختصارات مخفية */}
                {SHORTCUTS.map(s=>
                  <Form.Item key={s.valueKey||s.key} name={s.valueKey||s.key} hidden>
                    <Input/>
                  </Form.Item>)}
              </>
            )}

            {/* أزرار */}
            <Row><Col span={24}>
              <Space style={{marginTop:16}}>
                <Button type="primary" htmlType="submit" loading={loading}>بحث</Button>
                <Button onClick={()=>{
                  form.resetFields();
                  setSelectedDocumentType(null);
                  setActiveShortcut(null);
                  setGeneralDirOptions([]);setDirectorateOptions([]);
                  setDepartmentOptions([]);setSectionOptions([]);
                  fetchDocuments({},1);
                }}>
                  إعادة تعيين
                </Button>
              </Space>
            </Col></Row>
          </Form>

          {/* جدول النتائج */}
          <Divider orientation="center">النتائج</Divider>
          <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
            pagination={{...pagination,position:["bottomCenter"],showSizeChanger:false}}
            onChange={p=>{
              setPagination(prev=>({...prev,current:p.current}));
              fetchDocuments(form.getFieldsValue(),p.current);
            }}
            scroll={{x:true}}/>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
