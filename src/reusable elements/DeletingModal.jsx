import React from "react";
import { Modal } from "antd";

const DeleteConfirmationModal = ({ visible, onCancel, onConfirm }) => {
  return (
    <Modal
      title="تأكيد الحذف"
      visible={visible}
      onCancel={onCancel}
      onOk={onConfirm}
    >
      <p>هل أنت متأكد أنك تريد حذف هذا المصروف؟</p>
    </Modal>
  );
};

export default DeleteConfirmationModal;
