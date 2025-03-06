import React from "react";
import { Modal, Button } from "antd";

const DeleteConfirmationModal = ({ visible, onCancel, onConfirm }) => {
  return (
    <Modal
      title="تأكيد الحذف"
      visible={visible}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          إلغاء
        </Button>,
        <Button key="confirm" type="primary" danger onClick={onConfirm}>
          تأكيد
        </Button>,
      ]}
      onCancel={onCancel} // Keep modal dismissible with close button
    >
      <p>هل أنت متأكد أنك تريد حذف هذا المصروف؟</p>
    </Modal>
  );
};

export default DeleteConfirmationModal;
