import { useEffect, useState } from "react";
import { Table, Tag, message, Spin } from "antd";
import axiosInstance from "../../../../intercepters/axiosInstance";
import Url from "../../../../store/url";
import dayjs from "dayjs";

const ACTION_TYPES = {
  1: { label: "تم الإنشاء",   color: "blue"   },
  2: { label: "تم التعديل",   color: "orange" },
  3: { label: "تم الحذف",     color: "red"    },
  4: { label: "تم التدقيق",   color: "green"  },
  5: { label: "ربط/إلغاء ربط", color: "purple" },
};

export default function DocumentHistory({ documentId }) {
  const [loading, setLoading] = useState(false);
  const [rows,    setRows]    = useState([]);

  /* جلب البيانات */
  useEffect(() => {
    if (!documentId) return;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.get(
          `${Url}/api/Document/${documentId}/history`
        );
        setRows(data);
      } catch (e) {
        message.error("تعذّر جلب سجلّ الإجراءات");
      } finally {
        setLoading(false);
      }
    })();
  }, [documentId]);

  /* أعمدة الجدول */
  const columns = [
    {
      title: "التاريخ",
      dataIndex: "actionDate",
      key: "actionDate",
      render: (v) => dayjs(v).format("YYYY‑MM‑DD HH:mm"),
      width: 180,
    },
    {
      title: "النوع",
      dataIndex: "actionType",
      key: "actionType",
      width: 150,
      render: (v) => (
        <Tag color={ACTION_TYPES[v]?.color || "default"}>
          {ACTION_TYPES[v]?.label || v}
        </Tag>
      ),
    },
    {
      title: "ملاحظات",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
    },
  ];

  return loading ? (
    <Spin />
  ) : (
    <Table
      columns={columns}
      dataSource={rows}
      rowKey="id"
      pagination={{ pageSize: 10 }}
      scroll={{ x: "max-content" }}
    />
  );
}
