import React from "react";
import { useLocation } from "react-router-dom"; // Used to access the current route's location
import { DataTable } from "mantine-datatable"; // DataTable component from Mantine
import { ActionIcon, Group } from "@mantine/core"; // UI components from Mantine for icons and grouping
import { Icon } from "@iconify/react"; // Icon library
import Dashboard from "../../../pages/dashBoard.jsx"; // Import the Dashboard component
import './adminExpensess.css'; // Import CSS for styling

const AdminExpenses = () => {
  const location = useLocation(); // Access the current location object, useful for breadcrumb or context

  // Array holding expense records
  const expenseRecords = [
    {
      id: 1,
      governorate: "بغداد", // Governorate name
      office: "الرصافة", // Office name
      supervisorName: "محمد علي", // Supervisor's name
      cost: "500000 دينار", // Cost of the expense
      date: "2024-11-30", // Expense date
    },
    {
      id: 2,
      governorate: "نينوى",
      office: "الموصل",
      supervisorName: "احمد كريم",
      cost: "300000 دينار",
      date: "2024-11-29",
    },
  ];

  // Function to handle modal display for actions (view, edit, delete)
  const showModal = ({ expense, action }) => {
    // Placeholder for action handling, replace alert with modal logic
    alert(`Action: ${action}, Expense: ${JSON.stringify(expense)}`);
  };

  return (
    <>
      <Dashboard /> {/* Include the Dashboard navigation */}
      <div className="expenses-container" dir="rtl"> {/* Main container for expenses */}
        <h1 className="expenses-header">قائمة المصاريف</h1> {/* Header for the expenses list */}

        {/* DataTable for displaying expense records */}
        <DataTable
          className="expenses-table" // Custom styling class
          withTableBorder // Enable borders around the table
          withColumnBorders // Enable borders around columns
          highlightOnHover // Highlight row on hover
          records={expenseRecords} // Data to display in the table
          key="id" // Unique key for records
          noRecordsText="لا توجد بيانات" // Message when no records are present
          columns={[
            { accessor: "governorate", title: "المحافظة" }, // Governorate column
            { accessor: "office", title: "المكتب" }, // Office column
            { accessor: "supervisorName", title: "اسم المشرف" }, // Supervisor name column
            { accessor: "cost", title: "الكلفة" }, // Cost column
            { accessor: "date", title: "التاريخ" }, // Date column
            {
              accessor: "actions", // Column for action buttons
              title: "العمليات",
              render: (expense) => (
                // Group to layout action buttons in a row
                <Group
                  gap={4}
                  wrap="nowrap"
                  className="expenses-actions-group"
                >
                  {/* View Action */}
                  <ActionIcon
                    size="sm"
                    variant="subtle" // Subtle background style
                    color="green" // Green color for view action
                    className="expenses-action-icon"
                    onClick={() => showModal({ expense, action: "view" })}
                  >
                    <Icon icon="mdi:eye" width="16" /> {/* Eye icon for view */}
                  </ActionIcon>

                  {/* Edit Action */}
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="blue" // Blue color for edit action
                    className="expenses-action-icon"
                    onClick={() => showModal({ expense, action: "edit" })}
                  >
                    <Icon icon="mdi:pencil" width="16" /> {/* Pencil icon for edit */}
                  </ActionIcon>

                  {/* Delete Action */}
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red" // Red color for delete action
                    className="expenses-action-icon"
                    onClick={() => showModal({ expense, action: "delete" })}
                  >
                    <Icon icon="mdi:trash-can" width="16" /> {/* Trash can icon for delete */}
                  </ActionIcon>
                </Group>
              ),
            },
          ]}
        />
      </div>
    </>
  );
};

export default AdminExpenses;
