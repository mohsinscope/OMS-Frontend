import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { message, Modal, Form, Input, Button, ConfigProvider, Select } from "antd";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import Lele from "./../../../reusable elements/icons.jsx";
import "./attendenceView.css";
import useAuthStore from "./../../../store/store";
import Url from "./../../../store/url.js";

export default function ViewAttendance() {
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.state?.id;

  const { isSidebarCollapsed, accessToken, permissions, roles } = useAuthStore();
  const [attendanceData, setAttendanceData] = useState(null);
  const [attendanceData2, setAttendanceData2] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false); // State for delete modal
  const isSuperAdmin = roles == "SuperAdmin";

  const [form] = Form.useForm();
  const hasUpdatePermission = permissions.includes("Au");

  // Navigate back handler
  const handleBack = () => {
    navigate(-1);
  };

  // Fetch attendance details
  useEffect(() => {
    const fetchAttendanceDetails = async () => {
      try {
        const response = await axiosInstance.get(`${Url}/api/Attendance/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = response.data;

        const response2 = await axiosInstance.get(`${Url}/api/office/${data.officeId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const attendsdata = response2;

        setAttendanceData(data);
        setAttendanceData2(attendsdata);

        const dateOnly = data.date ? new Date(data.date).toISOString().split("T")[0] : "";
        form.setFieldsValue({
          ...data,
          date: dateOnly,
        });
      } catch (error) {
        console.error("Error fetching attendance details:", error);
        message.error("حدث خطأ أثناء جلب بيانات الحضور.");
      }
    };

    if (id) fetchAttendanceDetails();
  }, [id, form, accessToken]);

  // Handle updating attendance
  const handleSaveEdit = async (values) => {
    try {
      const updatedDate = values.date ? new Date(values.date).toISOString() : attendanceData.date;
      const updatedValues = {
        Id: id,
        receivingStaff: values.receivingStaff,
        accountStaff: values.accountStaff,
        printingStaff: values.printingStaff,
        qualityStaff: values.qualityStaff,
        deliveryStaff: values.deliveryStaff,
        date: updatedDate,
        note: values.note || "",
        workingHours: values.workingHours,
        officeId: attendanceData.officeId,
        governorateId: attendanceData.governorateId,
        profileId: attendanceData.profileId,
      };

      const response = await axiosInstance.put(`${Url}/api/Attendance/${id}`, updatedValues, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      message.success("تم تحديث بيانات الحضور بنجاح");
      setEditModalVisible(false);
      setAttendanceData(response.data || updatedValues);
    } catch (error) {
      console.error("Error Updating Attendance Details:", error);
      message.error(`حدث خطأ أثناء تعديل بيانات الحضور: ${error.message}`);
    }
  };

  // Handle deleting attendance
  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`${Url}/api/Attendance/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      message.success("تم حذف بيانات الحضور بنجاح");
      setDeleteModalVisible(false);
      navigate(-1); // Navigate back after deletion
    } catch (error) {
      console.error("Error deleting attendance:", error);
      message.error("حدث خطأ أثناء حذف بيانات الحضور.");
    }
  };

  // Render a single chart
  const renderChart = (title, count, total, numberOfAttendance) => {
    const data = [
      { name: "حاضر", value: total },
      { name: "غائب", value: count - total },
    ];

    const COLORS = ["#04AA6D", "#F44336"];

    return (
      <div className="chart-card">
        <div className="chart-content">
          <h2>
            {title} {numberOfAttendance}
          </h2>
          <h3>{`الحاضرون ${total}`}</h3>
        </div>
        <PieChart width={120} height={120}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={50}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </div>
    );
  };

  // Render the total (all staff) chart
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

    const COLORS = ["#04AA6D", "#F44336"];

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
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
      dir="rtl"
    >
      <div className="header">
        <h1>التاريخ: {new Date(attendanceData.date).toLocaleDateString("en-CA")}</h1>
        <h3>
          المحافظة /
          <span style={{ color: "blue", fontWeight: "bold" }}>
            {attendanceData.governorateName}
          </span>{" "}
          | المكتب /
          <span style={{ color: "blue", fontWeight: "bold" }}>
            {attendanceData.officeName}
          </span>
        </h3>
        <h3>
          الملاحظات:{" "}
          <span style={{ color: "#666", fontStyle: "italic" }}>
            {attendanceData.note || "لا يوجد"}
          </span>
        </h3>
      </div>

      <div className="attendence-buttons">
        <Button onClick={handleBack} className="back-button">
          <Lele type="back" />
          الرجوع
        </Button>
        {hasUpdatePermission && (
          <Button onClick={() => setEditModalVisible(true)} className="edit-button-lecture">
            تعديل <Lele type="edit" />
          </Button>
        )}
        {isSuperAdmin && ( // Only show delete button for SuperAdmin
          <Button
            danger
            type="primary"
            onClick={() => setDeleteModalVisible(true)}
            className="delete-button"
          
          >
            حذف <Lele type="delete" />
          </Button>
        )}
      </div>

      <div className="display-container-charts">
        <div className="single-total-container">{renderTotalChart()}</div>
        <div className="charts-section">
          <div className="single-chart">
            {renderChart(
              "محطات الحسابات",
              attendanceData2?.data?.accountStaff,
              attendanceData.accountStaff,
              attendanceData2?.data?.accountStaff || 0
            )}
          </div>
          <div className="single-chart">
            {renderChart(
              "محطات الطباعة",
              attendanceData2?.data?.printingStaff,
              attendanceData.printingStaff,
              attendanceData2?.data?.printingStaff || 0
            )}
          </div>
          <div className="single-chart">
            {renderChart(
              "محطات الجودة",
              attendanceData2?.data?.qualityStaff,
              attendanceData.qualityStaff,
              attendanceData2?.data?.qualityStaff || 0
            )}
          </div>
          <div className="single-chart">
            {renderChart(
              "محطات التسليم",
              attendanceData2?.data?.deliveryStaff,
              attendanceData.deliveryStaff,
              attendanceData2?.data?.deliveryStaff || 0
            )}
          </div>
          <div className="single-chart">
            {renderChart(
              "محطات الاستلام",
              attendanceData2?.data?.receivingStaff,
              attendanceData.receivingStaff,
              attendanceData2?.data?.receivingStaff || 0
            )}
          </div>
        </div>
      </div>

      <ConfigProvider direction="rtl">
        {/* Edit Modal */}
        <Modal
          className="model-container"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={null}
        >
          <h1>تعديل بيانات الحضور</h1>
          <Form form={form} onFinish={handleSaveEdit} layout="vertical">
            {/* Form fields */}
          </Form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          title="تأكيد الحذف"
          open={deleteModalVisible}
          onOk={handleDelete}
          onCancel={() => setDeleteModalVisible(false)}
          okText="حذف"
          cancelText="إلغاء"
        >
          <p>هل أنت متأكد أنك تريد حذف بيانات الحضور هذه؟</p>
        </Modal>
      </ConfigProvider>
    </div>
  );
}