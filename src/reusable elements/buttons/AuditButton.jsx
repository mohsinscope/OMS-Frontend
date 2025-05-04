import React, { useState } from "react";
import { Modal, Button, message ,ConfigProvider, } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import axiosInstance from "./../../intercepters/axiosInstance.js";
import Url from "./../../store/url.js";

const AuditButton = ({ documentId, onAuditSuccess }) => {
  const [modalVisible, setModalVisible] = useState(false);

  // Ensure a document ID is provided
  if (!documentId) return null;

  // Dynamically build the audit endpoint
  const endpoint = `${Url}/api/Document/${documentId}/audit`;

  const handleAudit = async () => {
    try {
      await axiosInstance.post(endpoint);
      message.success("تم تدقيق الكتاب بنجاح");
      setModalVisible(false);
      // Either use a callback or simply refresh the page
      if (onAuditSuccess) onAuditSuccess();
      else window.location.reload();
    } catch (error) {
      console.error("Audit error:", error);
      message.error("حدث خطأ أثناء تدقيق الكتاب");
    }
  };

  return (
    <>
      <Button
        type="primary"
        icon={<CheckOutlined />}
        onClick={() => setModalVisible(true)}
      className="audit-button"
      >
        تدقيق الكتاب
      </Button>
      <ConfigProvider direction="rtl">


      <Modal
        visible={modalVisible}
        title="تأكيد التدقيق"
        onOk={handleAudit}
        onCancel={() => setModalVisible(false)}
        okText="تأكيد"
        cancelText="إلغاء"
      >
        <p>هل أنت متأكد أنك تريد تدقيق هذا الكتاب</p>
      </Modal>
      </ConfigProvider>
    </>
  );
};

export default AuditButton;
