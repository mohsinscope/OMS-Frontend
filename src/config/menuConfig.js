export const MENU_ITEMS = [
  {
<<<<<<< HEAD
    label: "الاحصائيات",
    icon: "stats",
    path: "/Stats",
    resource: "stats",
    role: ["Report"], // Always visible to all users
=======
    label: "المصاريف",
    icon: "bill",
    path: "/supervisor/Expensess",
    resource: "expenses",
    role: ["Expenses", "Supervisor"], // Role allowed to access
  },
  {
    label: "اضافة المصاريف",
    icon: "bill",
    path: "/supervisor/ExpensesRequests",
    resource: "expenses",
    role: ["Expenses", "Supervisor"], // Role allowed to access
>>>>>>> 9a20a5b456a1b521457140a142fff6b92c96e400
  },
  {
    label: "الحضور",
    icon: "attendence",
    path: "/supervisor/Attendence",
    resource: "attendence",
<<<<<<< HEAD
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
  
=======
    role: ["Attendence", "Supervisor"], // Role allowed to access
  },
  {
    label: "الجوازات التالفة",
    icon: "passport",
    path: "supervisor/damagedpasportshistory",
    resource: "passport",
    role: ["Passport", "Supervisor"],
  },
  {
    label: "الاجهزة التالفة",
    icon: "devices",
    path: "supervisor/damegedDevices",
    resource: "device",
    role: ["Devices", "Supervisor"],
  },
  {
    label: "المحاضر",
    icon: "Lecturer",
    path: "/supervisor/lecturer/history",
    resource: "device",
    role: ["Lecturer", "Supervisor"],
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
>>>>>>> 9a20a5b456a1b521457140a142fff6b92c96e400
