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
import usePermissionsStore from "./../../../store/permissionsStore";
import Url from "./../../../store/url.js";

export default function ViewAttendance() {
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.state?.id;
  const { isSidebarCollapsed, accessToken } = useAuthStore();
  const { hasAnyPermission } = usePermissionsStore();
  const [attendanceData, setAttendanceData] = useState(null);
  const [attendanceData2, setAttendanceData2] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  const hasUpdatePermission = hasAnyPermission("update");

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
        const response2 = await axios.get(
          `${Url}/api/office/${response.data.officeId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const data = response.data;
        const attendsdata = response2;
        setAttendanceData(data);
        setAttendanceData2(attendsdata);
        form.setFieldsValue({
          ...data,
          date: data.date ? data.date.replace(/:00.00.00Z$/, "") : "",
        });
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

      message.success("تم تحديث بيانات الحضور بنجاح");
      setEditModalVisible(false);
      const updatedData = response.data || updatedValues;
      setAttendanceData(updatedData);
    } catch (error) {
      console.error("Error Updating Attendance Details:", error);
      message.error(`حدث خطأ أثناء تعديل بيانات الحضور: ${error.message}`);
    }
  };

  const renderChart = (title, count, total) => {
    const data = [
      { name: "حاضر", value: count },
      { name: "غائب", value: total - count },
    ];

    const COLORS = ["#0088FE", "#FF8042"];

    return (
      <div className="chart-card">
        <div className="chart-content">
          <h3>{title}</h3>
          <h2>{`${count} / ${total}`}</h2>
        </div>
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
      </div>
    );
  };

  const renderTotalChart = () => {
    if (!attendanceData || !attendanceData2) return null;

    const totalPresent =
      attendanceData.receivingStaff +
      attendanceData.accountStaff +
      attendanceData.printingStaff +
      attendanceData.qualityStaff +
      attendanceData.deliveryStaff;

    const totalCapacity =
      attendanceData2?.data?.receivingStaff +
      attendanceData2?.data?.accountStaff +
      attendanceData2?.data?.printingStaff +
      attendanceData2?.data?.qualityStaff +
      attendanceData2?.data?.deliveryStaff;

    const absentCount = totalCapacity - totalPresent;

    const data = [
      { name: "حاضر", value: totalPresent },
      { name: "غائب", value: absentCount },
    ];

    const COLORS = ["#4CAF50", "#F44336"];

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
        <h2>{`الحاضرون: ${totalPresent} / ${totalCapacity}`}</h2>
      </div>
    );
  };

  if (!attendanceData || !attendanceData2) {
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
          التاريخ: {new Date(attendanceData.date).toLocaleDateString("en-CA")}
        </h1>
      </div>
      <div className="attendence-buttons">
        <Button onClick={handleBack} className="back-button">
          <Lele type="back" />
          الرجوع
        </Button>
        {hasUpdatePermission && (
          <Button
            onClick={() => setEditModalVisible(true)}
            className="edit-button-lecture">
            تعديل <Lele type="edit" />
          </Button>
        )}
      </div>

      <div className="display-container-charts">
        <div className="single-total-container">{renderTotalChart()}</div>
        <div className="charts-section">
          <div className="single-chart">
            {renderChart(
              "موظفي الحسابات",
              attendanceData.accountStaff,
              attendanceData2?.data?.accountStaff || 0
            )}
          </div>
          <div className="single-chart">
            {renderChart(
              "موظفي الطباعة",
              attendanceData.printingStaff,
              attendanceData2?.data?.printingStaff || 0
            )}
          </div>
          <div className="single-chart">
            {renderChart(
              "موظفي الجودة",
              attendanceData.qualityStaff,
              attendanceData2?.data?.qualityStaff || 0
            )}
          </div>
          <div className="single-chart">
            {renderChart(
              "موظفي التسليم",
              attendanceData.deliveryStaff,
              attendanceData2?.data?.deliveryStaff || 0
            )}
          </div>
          <div className="single-chart">
            {renderChart(
              "موظفي الاستلام",
              attendanceData.receivingStaff,
              attendanceData2?.data?.receivingStaff || 0
            )}
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
              <Input placeholder="التاريخ" type="date" />
            </Form.Item>
            <Form.Item
              name="note"
              label="الملاحظات"
              rules={[{ required: false }]}>
              <Input.TextArea
                placeholder="أدخل الملاحظات"
                defaultValue={"لا يوجد"}
              />
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
