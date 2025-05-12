import React, { useEffect, useState } from "react";
import { Row, Col, Form, Select, Spin } from "antd";
import useCascade from "../hooks/useCascade.jsx";

const { Option } = Select;

export default function OfficialPartySelector({ disabled }) {
  const form = Form.useFormInstance();
  const {
    ministryOptions,      fetchMinistries,
    generalDirOptions,    fetchGeneralDirectorates,
    directorateOptions,   fetchDirectorates,
    departmentOptions,    fetchDepartments,
    sectionOptions,       fetchSections,
    resetBelow,
  } = useCascade();

  /* -------- حالات محلية لكل مستوى -------- */
  const [ministryId,          setMinistryId]          = useState(null);
  const [generalDirectorateId,setGeneralDirectorateId]= useState(null);
  const [directorateId,       setDirectorateId]       = useState(null);
  const [departmentId,        setDepartmentId]        = useState(null);
  const [sectionId,           setSectionId]           = useState(null);


useEffect(() => {
  console.log("➡️ Current selection:", {
    ministryId,
    generalDirectorateId,
    directorateId,
    departmentId,
    sectionId,
  });
}, [ministryId, generalDirectorateId, directorateId, departmentId, sectionId]);

  /* تحميل الوزارات */
  useEffect(() => { fetchMinistries(); }, [fetchMinistries]);

  /* دوال التغيير */
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

  const spinner = <Spin size="small" />;

  /* -------- واجهة المستخدم -------- */
  return (
    <Row gutter={16}>
      {/* الوزارة */}
      <Col span={4}>
        <Form.Item
          name="ministryId"
          label="الوزارة"
          rules={!disabled ? [{ required: true, message: "اختر الوزارة" }] : []}
        >
          <Select
            allowClear
            value={ministryId}
            onChange={onMinistryChange}
            disabled={disabled}
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
            value={generalDirectorateId}
            onChange={onGeneralDirChange}
            disabled={disabled || !ministryId}
            loading={!!ministryId && !generalDirOptions.length}
            suffixIcon={!generalDirOptions.length && ministryId ? spinner : undefined}
          >
            {generalDirOptions.map((g) => (
              <Option key={g.id} value={g.id}>{g.name}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      {/* المديرية */}
      <Col span={4}>
        <Form.Item name="directorateId" label="جهات المديرية">
          <Select
            allowClear
            value={directorateId}
            onChange={onDirectorateChange}
            disabled={disabled || !generalDirectorateId}
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
            value={departmentId}
            onChange={onDepartmentChange}
            disabled={disabled || !directorateId}
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
            value={sectionId}
            onChange={onSectionChange}
            disabled={disabled || !departmentId}
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
