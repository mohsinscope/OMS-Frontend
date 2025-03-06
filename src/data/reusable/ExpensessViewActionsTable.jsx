import React, { useState, useEffect } from "react";
import { Table, ConfigProvider, message } from "antd";
import axiosInstance from "./../intercepters/axiosInstance.js";
import Url from "./../store/url";
import useAuthStore from "./../store/store";

export default function ExpensessViewActionsTable({ monthlyExpensesId }) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    const fetchActions = async () => {
      if (!monthlyExpensesId) return;

      try {
        setLoading(true);
        const response = await axiosInstance.get(
          `${Url}/api/Actions/${monthlyExpensesId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setActions(response.data);
      } catch (error) {
        console.error("Error fetching actions:", error);
        message.error("حدث خطأ في جلب سجل الإجراءات");
      } finally {
        setLoading(false);
      }
    };

    fetchActions();
  }, [monthlyExpensesId, accessToken]);

  // Function to format time with AM/PM in Arabic
  const formatTime = (date) => {
    const d = new Date(date);
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const isPM = hours >= 12;
    const formattedHours = hours % 12 || 12;
    
    return `${formattedHours}:${minutes} ${isPM ? 'م' : 'ص'}`;
  };

  // Function to format date
  const formatDate = (date) => {
    return new Date(date).toISOString().split('T')[0];
  };

  const columns = [
    {
      title: "نوع الإجراء",
      dataIndex: "actionType",
      key: "actionType",
      align: "right",
      width: "35%",
    },
    {
      title: "الملاحظات",
      dataIndex: "notes",
      key: "notes",
      align: "right",
      width: "35%",
    },
    {
      title: "التاريخ",
      dataIndex: "dateCreated",
      key: "date",
      align: "center",
      width: "15%",
      render: (date) => formatDate(date),
    },
    {
      title: "الوقت",
      dataIndex: "dateCreated",
      key: "time",
      align: "center",
      width: "15%",
      render: (date) => formatTime(date),
    },
  ];

  return (
    <div style={{ marginTop: "24px", width: "100%" }}>
      <h1 className="header-content">
        سجل الإجراءات
      </h1>
      <ConfigProvider direction="rtl">
        <Table
          loading={loading}
          dataSource={actions}
          columns={columns}
          bordered={true}
          rowKey="id"
          pagination={{ 
            pageSize: 5, 
            position: ["bottomCenter"],
            showSizeChanger: false,
          }}
          
          className="actions-table"
          style={{
            width: "100%"
          }}
          locale={{ emptyText: "لا توجد إجراءات" }}
        />
      </ConfigProvider>
    </div>
  );
}