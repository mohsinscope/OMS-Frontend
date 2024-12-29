export const MENU_ITEMS = [
  {
    label: "الاحصائيات",
    icon: "stats",
    path: "/Stats",
    resource: "stats",
    role: ["Report", "Admin"], // Always visible to all users
  },
  {
    label: "الحضور",
    icon: "attendence",
    path: "/supervisor/Attendence",
    resource: "attendence",
    role: [ "Supervisor", "Admin","Attendance"], // Role allowed to access
  },
 
  {
    label: "الأجهزة التالفة",
    icon: "devices",
    path: "/supervisor/damegedDevices",
    resource: "devices",
    role: [ "Supervisor", "Admin","DamagedDevice"], // Role allowed to access
  },
  
  {
    label: "الجوازات التالفة",
    icon: "passport",
    path: "/supervisor/damagedpasportshistory",

    role: [ "Supervisor", "Admin","DamagedPassport"], // Role allowed to access
  },
  
  {
    label: "المحاضر",
    icon: "Lecturer",
    path: "/supervisor/lecturer/history",

    role: ["Lecture", "Supervisor", "Admin"], // Role allowed to access
  },

  {
    label: "المصاريف",
    icon: "bill",
    path: "/supervisor/Expensess",
    resource: "expenses",
    role: ["Expenses", "Supervisor", "Admin"], // Role allowed to access
  },
  {
    label: "اضافة المصاريف",
    icon: "bill",
    path: "/supervisor/ExpensesRequests",
    resource: "expenses",
    role: ["Expenses", "Supervisor", "Admin"], // Role allowed to access
  },
  {
    label: "ادارة القيم",
    icon: "data",
    path: "/admin/listofvalues",

    role: ["Admin"], // Role allowed to access
  },
  {
    label: "ادارة المستخدمين",
    icon: "user",
    path: "/admin/users",

    role: ["Admin"], // Role allowed to access
  }
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
