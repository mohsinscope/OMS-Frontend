import React, { useState } from "react";
import { Modal, Button, message, ConfigProvider } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import axiosInstance from "./../../intercepters/axiosInstance.js";
import Url from "./../../store/url.js";

const AuditButton = ({ documentId, profileId, onAuditSuccess }) => {
  const [modalVisible, setModalVisible] = useState(false);

  if (!documentId || !profileId) return null;

  const endpoint = `${Url}/api/Document/${documentId}/audit`;

  const handleAudit = async () => {
    try {
      await axiosInstance.post(endpoint, { profileId });
      message.success("تم تدقيق الكتاب بنجاح");
      setModalVisible(false);
      onAuditSuccess?.();
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
          open={modalVisible}
          title="تأكيد التدقيق"
   onOk={handleAudit}
   onCancel={() => setModalVisible(false)}
   closable={false}                                  // ← no “×”
   modalRender={(modal) => <div dir="rtl">{modal}</div>}  // ← force RTL
          okText="تأكيد"
          cancelText="إلغاء"
        >
          <p>هل أنت متأكد أنك تريد تدقيق هذا الكتاب؟</p>
        </Modal>
      </ConfigProvider>
    </>
  );
};

export default AuditButton;
