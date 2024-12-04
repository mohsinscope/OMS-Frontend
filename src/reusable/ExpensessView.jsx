import React from "react";
import { useLocation } from "react-router-dom";
import "./styles/ExpensessView.css";
import Dashboard from "./../pages/dashBoard.jsx";

export default function ExpensessView() {
  const location = useLocation();
  const expense = location.state?.expense; // Get expense details from state

  if (!expense) {
    return <p>لا توجد تفاصيل لعرضها.</p>;
  }

  return (
    <>
      <Dashboard />
      <h1 className="expensess-date">{`التاريخ: ${expense.التاريخ}`}</h1>
      <div className="expensess-view-container">
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
