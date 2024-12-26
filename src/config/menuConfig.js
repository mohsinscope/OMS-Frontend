export const MENU_ITEMS = [
  {
    label: "الاحصائيات",
    icon: "stats",
    path: "/Stats",
    resource: "stats",
    role: ["Report"], // Always visible to all users
  },
  {
    label: "الحضور",
    icon: "attendence",
    path: "/supervisor/Attendence",
    resource: "attendence",
    role: ["Attendence","Supervisor"], // Role allowed to access
  },
    {
      label: "الأجهزة التالفة",
      icon: "devices",
      path: "supervisor/damegedDevices",
      resource: "devices",
      role: ["Damaged_Devices","Supervisor"], // Role allowed to access
    },
    {
      label: "المصاريف",
      icon: "bill",
      path: "/supervisor/Expensess",
      resource: "expenses",
      role: ["Expenses","Supervisor"], // Role allowed to access
    },
    {
        label: "اضافة المصاريف",
        icon: "bill",
        path: "/supervisor/ExpensesRequests",
        resource: "expenses",
        role: ["Expenses","Supervisor"], // Role allowed to access
      },
  
  ];
  
  export const COMMON_MENU_ITEMS = [
 
    
    {
      label: "الإعدادات",
      icon: "settings",
      path: "/settings",
      role: [], // Always visible to all users
    },
    {
      label: "تسجيل الخروج",
      icon: "logout",
      action: "logout",
      role: [], // Always visible to all users
    },
  ];
  