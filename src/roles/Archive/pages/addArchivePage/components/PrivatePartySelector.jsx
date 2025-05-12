import React, { useEffect, useState } from "react";
import { Form, Select } from "antd";
import axiosInstance from './../../../../../intercepters/axiosInstance.js';

const { Option } = Select;

export default function PrivatePartySelector({ disabled }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosInstance.get("/api/PrivateParty?PageNumber=1&PageSize=100");
        setOptions(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Form.Item
      name="privatePartyId"
      label="قطاع خاص"
      rules={!disabled ? [{ required: true, message: "اختر الجهة الخاصة" }] : []}
    >
      <Select disabled={disabled} loading={loading}>
        {options.map(p => (
          <Option key={p.id} value={p.id}>{p.name}</Option>
        ))}
      </Select>
    </Form.Item>
  );
}
