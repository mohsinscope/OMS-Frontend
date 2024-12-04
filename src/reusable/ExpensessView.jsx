import React from "react";
import { useLocation } from "react-router-dom";
import { Table } from "antd"; // Importing Table component
import "./styles/ExpensessView.css";
import Dashboard from "./../pages/dashBoard.jsx";

export default function ExpensessView() {
  const location = useLocation();
  const expense = location.state?.expense; // Get expense details from state

  if (!expense) {
    return <p>لا توجد تفاصيل لعرضها.</p>;
  }

  // Table columns based on the provided structure
  const columns = [
    {
      title: "سعر الصرف الكلي",
      dataIndex: "سعر الصرف الكلي",
      key: "سعر الصرف الكلي",
      align: "center",
    },
    {
      title: "اسم المكتب",
      dataIndex: "اسم المكتب",
      key: "اسم المكتب",
      align: "center",
    },
    {
      title: "المحافظة",
      dataIndex: "المحافظة",
      key: "المحافظة",
      align: "center",
    },
    {
      title: "اسم المشرف",
      dataIndex: "اسم المشرف",
      key: "اسم المشرف",
      align: "center",
    },
    {
      title: "رقم الطلب",
      dataIndex: "رقم الطلب",
      key: "رقم الطلب",
      align: "center",
    },
  ];

  // Table data from the expense object
  const tableData = [
    {
      key: "1",
      "رقم الطلب": expense["رقم الطلب"] || "غير متوفر",
      "اسم المشرف": expense["اسم المشرف"] || "غير متوفر",
      "المحافظة": expense["المحافظة"] || "غير متوفر",
      "اسم المكتب": expense["اسم المكتب"] || "غير متوفر",
      "سعر الصرف الكلي": expense["سعر الصرف الكلي"] || "غير متوفر",
    },
  ];

  return (
    <>
      <Dashboard />
      <h1 className="expensess-date">{`التاريخ: ${expense.التاريخ}`}</h1>
      

      <div className="expensess-view-container">
      {/* Table Section */}
      <Table
        className="expense-details-table"
        columns={columns}
        dataSource={tableData}
        bordered
        pagination={false}
      />
        <button className="expenssses-print-button">طباعة</button>
        <hr />
        <div className="expensess-view-small-containers">
          {/* Dedicated image container */}
          {expense.img && (
            <div className="expensess-image-container">
              <img
                src={expense.img}
                alt="تفاصيل الصورة"
                onError={(e) => (e.target.src = "/path/to/placeholder.jpg")} // Fallback for invalid image
                className="expense-image"
              />
              <h3 className="image-caption">اضغط للتكبير</h3>
            </div>
          )}

          {/* Dynamic mapping of other expense details */}
          <div className="expensess-details-container" dir="rtl">
            {Object.entries(expense)
              .filter(([key]) => key !== "details" && key !== "img") // Exclude "details" and "img" keys
              .map(([key, value], index) => (
                <div key={index} className="expensess-detail-item">
                  <p>
                    {key}: {value || "غير متوفر"}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}
