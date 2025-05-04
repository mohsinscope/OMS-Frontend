import React, { useState } from "react";
import { Button, Modal, message, ConfigProvider } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import axiosInstance from "./../../intercepters/axiosInstance.js";
import Url from "./../../store/url.js";
import './buttons-style.css';

const DeleteButton = ({ documentId, onDeleteSuccess }) => {
  const [modalVisible, setModalVisible] = useState(false);
  // Dynamically build the endpoint using the provided documentId
  const endpoint = `${Url}/api/Document/${documentId}`;

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(endpoint);
      message.success("تم حذف الكتاب بنجاح");
      setModalVisible(false);
      if (onDeleteSuccess) onDeleteSuccess();
    } catch (error) {
      message.error("حدث خطأ أثناء حذف الكتاب");
    }
  };

  return (
    <>
      <Button
        danger
        type="primary"
        icon={<DeleteOutlined />}
        size="large"
        className="delete-button"
        onClick={() => setModalVisible(true)}
      >
        حذف الكتاب
      </Button>
      <ConfigProvider direction="rtl">
      <Modal
        title="تأكيد الحذف"
        visible={modalVisible}
        onOk={handleDelete}
        onCancel={() => setModalVisible(false)}
        okText="حذف"
        cancelText="إلغاء"
      >
        <p>هل أنت متأكد أنك تريد حذف هذا الكتاب</p>
      </Modal>
      </ConfigProvider>
    </>
  );
};

export default DeleteButton;
