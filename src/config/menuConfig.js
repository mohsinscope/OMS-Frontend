// menuConfig.js
export const MENU_ITEMS = [
  {
    label: "الاحصائيات",
    icon: "stats",
    path: "/Stats",
    requiredPermission: "Rr",
    role: []
  },
  {
    label: "الحضور",
    icon: "attendence",
    path: "/supervisor/Attendence",
    requiredPermission: "Ar",
    role: []
  },
  {
    label: "الأجهزة التالفة",
    icon: "devices",
    path: "/supervisor/damegedDevices",
    requiredPermission: "DDr",
    role: []
  },
  {
    label: "المصاريف",
    icon: "bill",
    path: "/supervisor/Expensess",
    requiredPermission: "EXr",
    role: []
  },
  {
    label: "طلبات المصاريف",
    icon: "money-add",
    path: "/supervisor/ExpensesRequests",
    requiredPermission: "EXc",
    role: []
  },
  {
    label: "الجوازات التالفة",
    icon: "passport",
    path: "/supervisor/damagedpasportshistory",
    requiredPermission: "DPr",
    role: []
  },
  {
    label: "المحاضر",
    icon: "Lecturer",
    path: "/supervisor/lecturer/history",
    requiredPermission: "Lr",
    role: []
  },

  {
    label: "ادارة القيم",
    icon: "data",
    path: "/admin/listofvalues",
    requiredPermission: "LOV",
    role: []
  },
  {
    label: "ادارة المستخدمين",
    icon: "user",
    path: "/admin/users",
    requiredPermission: null,
    role: ["Admin","SuperAdmin"]
  },
  {
    label:  "ادارة الحظر",
    icon: "ban",
    path: "/admin/ban",
    requiredPermission: null,
    role: ["Admin","SuperAdmin"]
  }
];

export const COMMON_MENU_ITEMS = [
  {
    label: "الإعدادات",
    icon: "settings",
    path: "/settings",
    role: []
  },
  {
    label: "تسجيل الخروج",
    icon: "logout",
    action: "logout",
    role: []
  }
];