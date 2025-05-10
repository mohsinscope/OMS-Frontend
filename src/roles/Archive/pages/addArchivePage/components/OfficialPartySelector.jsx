import React, { useEffect } from "react";
import { Row, Col, Form, Select } from "antd";
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

  useEffect(() => { fetchMinistries(); }, [fetchMinistries]);

  const onMinistryChange = val => {
    form.setFieldsValue({
      generalDirectorateId: undefined,
      directorateId:        undefined,
      departmentId:         undefined,
      sectionId:            undefined,
    });
    resetBelow("ministry");
    if (val) fetchGeneralDirectorates(val);
  };

  const onGeneralDirChange = val => {
    form.setFieldsValue({ directorateId: undefined, departmentId: undefined, sectionId: undefined });
    resetBelow("general");
    if (val) fetchDirectorates(val);
  };

  const onDirectorateChange = val => {
    form.setFieldsValue({ departmentId: undefined, sectionId: undefined });
    resetBelow("directorate");
    if (val) fetchDepartments(val);
  };

  const onDepartmentChange = val => {
    form.setFieldsValue({ sectionId: undefined });
    resetBelow("department");
    if (val) fetchSections(val);
  };

  return (
    <Row gutter={16}>
      <Col span={4}>
        <Form.Item
          name="ministryId"
          label="الوزارة"
          rules={!disabled ? [{ required: true, message: "اختر الوزارة" }] : []}
        >
          <Select
            onChange={onMinistryChange}
            disabled={disabled}
            loading={!ministryOptions.length}
          >
            {ministryOptions.map(m => (
              <Option key={m.id} value={m.id}>{m.name}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      <Col span={4}>
        <Form.Item
          name="generalDirectorateId"
          label="مديرية عامة"
          rules={!disabled ? [{ required: true, message: "اختر المديرية العامة" }] : []}
        >
          <Select
            onChange={onGeneralDirChange}
            disabled={disabled || !generalDirOptions.length}
          >
            {generalDirOptions.map(g => (
              <Option key={g.id} value={g.id}>{g.name}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      <Col span={4}>
        <Form.Item
          name="directorateId"
          label="مديرية"
          rules={!disabled ? [{ required: true, message: "اختر المديرية" }] : []}
        >
          <Select
            onChange={onDirectorateChange}
            disabled={disabled || !directorateOptions.length}
          >
            {directorateOptions.map(d => (
              <Option key={d.id} value={d.id}>{d.name}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      <Col span={4}>
        <Form.Item
          name="departmentId"
          label="قسم"
          rules={!disabled ? [{ required: true, message: "اختر القسم" }] : []}
        >
          <Select
            onChange={onDepartmentChange}
            disabled={disabled || !departmentOptions.length}
          >
            {departmentOptions.map(d => (
              <Option key={d.id} value={d.id}>{d.name}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      <Col span={4}>
        <Form.Item
          name="sectionId"
          label="شعبة"
          rules={!disabled ? [{ required: false, message: "اختر الشعبة" }] : []}
        >
          <Select
            disabled={disabled || !sectionOptions.length}
          >
            {sectionOptions.map(s => (
              <Option key={s.id} value={s.id}>{s.name}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
    </Row>
  );
}
