import React, { useEffect, useState } from "react";
import { Row, Col, Form, Select, Spin } from "antd";
import useCascade from "../hooks/useCascade.jsx";

const { Option } = Select;
const spinner   = <Spin size="small" />;

/**
 * الاختيار الهرمى للجهات الرسمية
 * يعتمد على hook  useCascade لجلب الخيارات على حسب المستوى
 *
 * @param {boolean} disabled    - لتعطيل كامل المكوّن
 */
export default function OfficialPartySelector({ disabled = false }) {
  const form = Form.useFormInstance();

  /* hook مركزي لجلب القوائم */
  const {
    ministryOptions,      fetchMinistries,
    generalDirOptions,    fetchGeneralDirectorates,
    directorateOptions,   fetchDirectorates,
    departmentOptions,    fetchDepartments,
    sectionOptions,       fetchSections,
    resetBelow,
  } = useCascade();

  /*  ► حالات محلّية تمثِّل القيمة المختارة فعلياً فى كل ComboBox  */
  const [ministryId,          setMinistryId]          = useState(null);
  const [generalDirectorateId,setGeneralDirectorateId]= useState(null);
  const [directorateId,       setDirectorateId]       = useState(null);
  const [departmentId,        setDepartmentId]        = useState(null);
  const [sectionId,           setSectionId]           = useState(null);

  /*──────────────────────
    1. تحميل الوزارات أولاً
  ──────────────────────*/
  useEffect(() => { fetchMinistries(); }, [fetchMinistries]);

  /*──────────────────────
    2. مزامنة القيم المُعبّأة برمجياً مع الحالة المحليّة
       (تُفيد فى حالة prefillFromParent أو edit‑mode)
  ──────────────────────*/
  const watchedMinistryId          = Form.useWatch("ministryId",          form);
  const watchedGeneralDirectorateId= Form.useWatch("generalDirectorateId",form);
  const watchedDirectorateId       = Form.useWatch("directorateId",       form);
  const watchedDepartmentId        = Form.useWatch("departmentId",        form);
  const watchedSectionId           = Form.useWatch("sectionId",           form);

  /* كل watch يحدِّث الحالة ويجلب القوائم إن لزم */
  useEffect(() => {
    if (watchedMinistryId && watchedMinistryId !== ministryId) {
      setMinistryId(watchedMinistryId);
      fetchGeneralDirectorates(watchedMinistryId);
    }
  }, [watchedMinistryId]);          // eslint-disable-line

  useEffect(() => {
    if (watchedGeneralDirectorateId && watchedGeneralDirectorateId !== generalDirectorateId) {
      setGeneralDirectorateId(watchedGeneralDirectorateId);
      fetchDirectorates(watchedGeneralDirectorateId);
    }
  }, [watchedGeneralDirectorateId]); // eslint-disable-line

  useEffect(() => {
    if (watchedDirectorateId && watchedDirectorateId !== directorateId) {
      setDirectorateId(watchedDirectorateId);
      fetchDepartments(watchedDirectorateId);
    }
  }, [watchedDirectorateId]);        // eslint-disable-line

  useEffect(() => {
    if (watchedDepartmentId && watchedDepartmentId !== departmentId) {
      setDepartmentId(watchedDepartmentId);
      fetchSections(watchedDepartmentId);
    }
  }, [watchedDepartmentId]);         // eslint-disable-line

  useEffect(() => {
    if (watchedSectionId && watchedSectionId !== sectionId) {
      setSectionId(watchedSectionId);
    }
  }, [watchedSectionId]);            // eslint-disable-line

  /*──────────────────────
    3. دوال onChange لكل مستوى
  ──────────────────────*/
  const onMinistryChange = (val) => {
    setMinistryId(val);
    setGeneralDirectorateId(null);
    setDirectorateId(null);
    setDepartmentId(null);
    setSectionId(null);

    form.setFieldsValue({
      ministryId: val,
      generalDirectorateId: undefined,
      directorateId:        undefined,
      departmentId:         undefined,
      sectionId:            undefined,
    });
    resetBelow("ministry");
    if (val) fetchGeneralDirectorates(val);
  };

  const onGeneralDirChange = (val) => {
    setGeneralDirectorateId(val);
    setDirectorateId(null);
    setDepartmentId(null);
    setSectionId(null);

    form.setFieldsValue({
      generalDirectorateId: val,
      directorateId:        undefined,
      departmentId:         undefined,
      sectionId:            undefined,
    });
    resetBelow("general");
    if (val) fetchDirectorates(val);
  };

  const onDirectorateChange = (val) => {
    setDirectorateId(val);
    setDepartmentId(null);
    setSectionId(null);

    form.setFieldsValue({
      directorateId: val,
      departmentId:  undefined,
      sectionId:     undefined,
    });
    resetBelow("directorate");
    if (val) fetchDepartments(val);
  };

  const onDepartmentChange = (val) => {
    setDepartmentId(val);
    setSectionId(null);

    form.setFieldsValue({
      departmentId: val,
      sectionId:    undefined,
    });
    resetBelow("department");
    if (val) fetchSections(val);
  };

  const onSectionChange = (val) => {
    setSectionId(val);
    form.setFieldsValue({ sectionId: val });
  };

  /*──────────────────────
    4. واجهة المستخدم
  ──────────────────────*/
  return (
    <Row gutter={16}>
      {/* الوزارة */}
      <Col span={4}>
        <Form.Item
          name="ministryId"
          label="الوزارة"
          rules={disabled ? [] : [{ required: true, message: "اختر الوزارة" }]}
        >
          <Select
            allowClear
            disabled={disabled}
            value={ministryId}
            onChange={onMinistryChange}
            loading={!ministryOptions.length}
            suffixIcon={!ministryOptions.length ? spinner : undefined}
          >
            {ministryOptions.map((m) => (
              <Option key={m.id} value={m.id}>{m.name}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      {/* المديرية العامة */}
      <Col span={4}>
        <Form.Item name="generalDirectorateId" label="مديرية عامة">
          <Select
            allowClear
            disabled={disabled || !ministryId}
            value={generalDirectorateId}
            onChange={onGeneralDirChange}
            loading={!!ministryId && !generalDirOptions.length}
            suffixIcon={!generalDirOptions.length && ministryId ? spinner : undefined}
          >
            {generalDirOptions.map((g) => (
              <Option key={g.id} value={g.id}>{g.name}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      {/* جهات المديرية */}
      <Col span={4}>
        <Form.Item name="directorateId" label="جهات المديرية">
          <Select
            allowClear
            disabled={disabled || !generalDirectorateId}
            value={directorateId}
            onChange={onDirectorateChange}
            loading={!!generalDirectorateId && !directorateOptions.length}
            suffixIcon={!directorateOptions.length && generalDirectorateId ? spinner : undefined}
          >
            {directorateOptions.map((d) => (
              <Option key={d.id} value={d.id}>{d.name}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      {/* القسم */}
      <Col span={4}>
        <Form.Item name="departmentId" label="قسم">
          <Select
            allowClear
            disabled={disabled || !directorateId}
            value={departmentId}
            onChange={onDepartmentChange}
            loading={!!directorateId && !departmentOptions.length}
            suffixIcon={!departmentOptions.length && directorateId ? spinner : undefined}
          >
            {departmentOptions.map((d) => (
              <Option key={d.id} value={d.id}>{d.name}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      {/* الشعبة */}
      <Col span={4}>
        <Form.Item name="sectionId" label="شعبة">
          <Select
            allowClear
            disabled={disabled || !departmentId}
            value={sectionId}
            onChange={onSectionChange}
            loading={!!departmentId && !sectionOptions.length}
            suffixIcon={!sectionOptions.length && departmentId ? spinner : undefined}
          >
            {sectionOptions.map((s) => (
              <Option key={s.id} value={s.id}>{s.name}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
    </Row>
  );
}
