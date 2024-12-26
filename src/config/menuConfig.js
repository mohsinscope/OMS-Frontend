export const MENU_ITEMS = [
    {
      label: "الأجهزة التالفة",
      icon: "devices",
      path: "supervisor/damegedDevices",
      resource: "devices",
      role: ["Damaged_Devices"], // Role allowed to access
    },
    {
      label: "المصاريف",
      icon: "bill",
      path: "/supervisor/Expensess",
      resource: "expenses",
      role: ["Expenses"], // Role allowed to access
    },
    {
        label: "اضافة المصاريف",
        icon: "bill",
        path: "/supervisor/Expensess",
        resource: "expenses",
        role: ["Expenses"], // Role allowed to access
      },
    {
        label: "الحضور",
        icon: "attendence",
        path: "/supervisor/Attendence",
        resource: "attendence",
        role: ["Attendence"], // Role allowed to access
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
  