import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  Spin,
  message,
  Modal,
  Form,
  Input,
  Button,
  ConfigProvider,
} from "antd";
import axios from "axios";
import Lele from "./../../../reusable elements/icons.jsx";
import "./attendenceView.css";
import useAuthStore from "./../../../store/store";
import Url from "./../../../store/url.js";

export default function ViewAttendance() {
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.state?.id;
  const { isSidebarCollapsed, accessToken } = useAuthStore();
  const [attendanceData, setAttendanceData] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    const fetchAttendanceDetails = async () => {
      try {
        const response = await axios.get(`${Url}/api/Attendance/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = response.data;
        setAttendanceData(data);
        form.setFieldsValue({
          ...data,
          date: data.date ? data.date.replace(/:00.000Z$/, "") : "",
        }); // Pre-fill the form with fetched data
      } catch (error) {
        console.error("Error fetching attendance details:", error);
        message.error("حدث خطأ أثناء جلب بيانات الحضور.");
      }
    };

    if (id) fetchAttendanceDetails();
  }, [id, form, accessToken]);

  const handleSaveEdit = async (values) => {
    try {
      const updatedValues = {
        Id: id,
        receivingStaff: values.receivingStaff,
        accountStaff: values.accountStaff,
        printingStaff: values.printingStaff,
        qualityStaff: values.qualityStaff,
        deliveryStaff: values.deliveryStaff,
        date: values.date
          ? new Date(values.date).toISOString()
          : attendanceData.date,
        note: values.note || "",
        workingHours: values.workingHours,
        officeId: attendanceData.officeId,
        governorateId: attendanceData.governorateId,
        profileId: attendanceData.profileId,
      };

      console.log("Sending Updated Values:", updatedValues);

      const response = await axios.put(
        `${Url}/api/Attendance/${id}`,
        updatedValues,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // On success, update attendanceData with the latest values
      message.success("تم تحديث بيانات الحضور بنجاح");
      setEditModalVisible(false);
      const updatedData = response.data || updatedValues; // Use server response or edited values
      setAttendanceData(updatedData); // Trigger re-render of charts
    } catch (error) {
      console.error("Error Updating Attendance Details:", error);
      message.error(`حدث خطأ أثناء تعديل بيانات الحضور: ${error.message}`);
    }
  };

  const renderChart = (title, count) => {
    const data = [
      { name: "حاضر", value: count },
      { name: "غائب", value: 10 - count },
    ];

    const COLORS = ["#0088FE", "#FF8042"];

    return (
      <div className="chart-card">
        <h3>{title}</h3>
        <PieChart width={120} height={120}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={50}
            paddingAngle={5}
            dataKey="value">
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
        <p>{`${count} موظفين`}</p>
      </div>
    );
  };

  const renderTotalChart = () => {
    if (!attendanceData) return null;

    const totalPresent =
      attendanceData.receivingStaff +
      attendanceData.accountStaff +
      attendanceData.printingStaff +
      attendanceData.qualityStaff +
      attendanceData.deliveryStaff;

    const data = [
      { name: "حاضر", value: totalPresent },
      { name: "غائب", value: 50 - totalPresent }, // Assuming max capacity of 50 employees
    ];

    const COLORS = ["#4CAF50", "#F44336"]; // Green for present, red for absent

    return (
      <div className="total-chart-container">
        <h2>إجمالي الحضور</h2>
        <PieChart width={400} height={400}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={100}
            outerRadius={150}
            paddingAngle={5}
            dataKey="value">
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
        <p>{`الحاضرون: ${totalPresent} موظفين`}</p>
      </div>
    );
  };

  if (!attendanceData) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className={`attendence-view-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : "attendence-view-container"
      }`}
      dir="rtl">
      <div className="header">
        <h1>
          التاريخ: {new Date(attendanceData.date).toLocaleDateString("en-GB")}
        </h1>
      </div>
      <div className="attendence-buttons">
        <Button onClick={handleBack} className="back-button">
          <Lele type="back" />
          الرجوع
        </Button>
        <Button
          onClick={() => setEditModalVisible(true)}
          className="edit-button-lecture">
          تعديل <Lele type="edit" />
        </Button>
      </div>

      <div className="display-container-charts">
        <div className="single-total-container">
          {/* Total Attendance Chart */}
          {renderTotalChart()}
        </div>
        <div className="charts-section">
          <div className="single-chart">
            {renderChart("موظفي الحسابات", attendanceData.accountStaff)}
          </div>
          <div className="single-chart">
            {renderChart("موظفي الطباعة", attendanceData.printingStaff)}
          </div>
          <div className="single-chart">
            {renderChart("موظفي الجودة", attendanceData.qualityStaff)}
          </div>
          <div className="single-chart">
            {renderChart("موظفي التسليم", attendanceData.deliveryStaff)}
          </div>
          <div className="single-chart">
            {renderChart("موظفي الاستلام", attendanceData.receivingStaff)}
          </div>
        </div>
      </div>

      <ConfigProvider direction="rtl">
        <Modal
          className="model-container"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={null}>
          <h1>تعديل بيانات الحضور</h1>
          <Form
            form={form}
            onFinish={handleSaveEdit}
            layout="vertical"
            className="Admin-user-add-model-container-form">
            <Form.Item
              name="receivingStaff"
              label="موظفي الاستلام"
              rules={[
                { required: true, message: "يرجى إدخال عدد موظفي الاستلام" },
              ]}>
              <Input placeholder="عدد موظفي الاستلام" type="number" />
            </Form.Item>
            <Form.Item
              name="accountStaff"
              label="موظفي الحسابات"
              rules={[
                { required: true, message: "يرجى إدخال عدد موظفي الحسابات" },
              ]}>
              <Input placeholder="عدد موظفي الحسابات" type="number" />
            </Form.Item>
            <Form.Item
              name="printingStaff"
              label="موظفي الطباعة"
              rules={[
                { required: true, message: "يرجى إدخال عدد موظفي الطباعة" },
              ]}>
              <Input placeholder="عدد موظفي الطباعة" type="number" />
            </Form.Item>
            <Form.Item
              name="qualityStaff"
              label="موظفي الجودة"
              rules={[
                { required: true, message: "يرجى إدخال عدد موظفي الجودة" },
              ]}>
              <Input placeholder="عدد موظفي الجودة" type="number" />
            </Form.Item>
            <Form.Item
              name="deliveryStaff"
              label="موظفي التسليم"
              rules={[
                { required: true, message: "يرجى إدخال عدد موظفي التسليم" },
              ]}>
              <Input placeholder="عدد موظفي التسليم" type="number" />
            </Form.Item>
            <Form.Item
              name="date"
              label="التاريخ"
              rules={[{ required: true, message: "يرجى إدخال التاريخ" }]}>
              <Input placeholder="التاريخ" type="datetime-local" />
            </Form.Item>
            <Form.Item
              name="note"
              label="الملاحظات"
              rules={[{ required: false }]}>
              <Input.TextArea placeholder="أدخل الملاحظات" />
            </Form.Item>
            <Form.Item
              name="workingHours"
              label="عدد ساعات العمل"
              rules={[
                { required: true, message: "يرجى إدخال عدد ساعات العمل" },
              ]}>
              <Input placeholder="عدد ساعات العمل" type="number" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>
              حفظ التعديلات
            </Button>
          </Form>
        </Modal>
      </ConfigProvider>
    </div>
  );
}
