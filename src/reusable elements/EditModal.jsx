import React from "react";
import { Modal, Form, Input, Select, Upload, Button, Image } from "antd";
import { UploadOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";

const EditModal = ({ visible, onCancel, onSave, editingRecord, setEditingRecord }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0); // State to track the current image index

  // Function to handle image upload
  const handleImageUpload = ({ file }) => {
    const reader = new FileReader();
    reader.onload = () => {
      setEditingRecord((prev) => ({
        ...prev,
        attachments: [
          ...(prev.attachments || []),
          { name: file.name, url: reader.result },
        ],
      }));
    };
    reader.readAsDataURL(file);
    return false;
  };

  // Function to go to the next image
  const handleNext = () => {
    if (editingRecord?.attachments && currentIndex < editingRecord.attachments.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Function to go to the previous image
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <Modal
      title="تعديل المصروف"
      visible={visible}
      onCancel={onCancel}
      onOk={onSave}
    >
      <Form layout="vertical">
        {/* Expense Type */}
        <Form.Item label="نوع المصروف">
          <Select
            value={editingRecord?.expenseType}
            onChange={(value) =>
              setEditingRecord((prev) => ({ ...prev, expenseType: value }))
            }
          >
            <Select.Option value="نثرية">نثرية</Select.Option>
            <Select.Option value="Hotel Stay">Hotel Stay</Select.Option>
          </Select>
        </Form.Item>

        {/* Total Amount */}
        <Form.Item label="السعر">
          <Input
            value={editingRecord?.totalAmount}
            onChange={(e) =>
              setEditingRecord((prev) => ({
                ...prev,
                totalAmount: e.target.value,
              }))
            }
          />
        </Form.Item>

        {/* Quantity */}
        <Form.Item label="الكمية">
          <Input
            value={editingRecord?.quantity}
            onChange={(e) =>
              setEditingRecord((prev) => ({
                ...prev,
                quantity: e.target.value,
              }))
            }
          />
        </Form.Item>

        {/* Date */}
        <Form.Item label="التاريخ">
          <Input
            type="date"
            value={editingRecord?.date}
            onChange={(e) =>
              setEditingRecord((prev) => ({
                ...prev,
                date: e.target.value,
              }))
            }
          />
        </Form.Item>

        {/* Remarks */}
        <Form.Item label="الملاحظات">
          <Input.TextArea
            rows={4}
            value={editingRecord?.remarks}
            onChange={(e) =>
              setEditingRecord((prev) => ({
                ...prev,
                remarks: e.target.value,
              }))
            }
          />
        </Form.Item>

        {/* Attachments */}
        <Form.Item label="المرفقات">
          <Upload
            accept="image/*"
            customRequest={handleImageUpload}
            showUploadList={false}
            multiple
          >
            <Button icon={<UploadOutlined />}>رفع الملفات</Button>
          </Upload>

          {/* Image Previewer */}
          {editingRecord?.attachments?.length > 0 && (
            <div className="image-previewer-container">
              <div className="image-display">
                <Image
                  width={300}
                  height={300}
                  src={editingRecord.attachments[currentIndex]?.url}
                  alt={`Image ${currentIndex + 1}`}
                />
              </div>

              {/* Pagination Controls */}
              <div className="image-pagination-controls">
                <Button
                  icon={<LeftOutlined />}
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  السابق
                </Button>
                <span className="pagination-info">
                  {currentIndex + 1} / {editingRecord.attachments.length}
                </span>
                <Button
                  icon={<RightOutlined />}
                  onClick={handleNext}
                  disabled={currentIndex === editingRecord.attachments.length - 1}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditModal;
