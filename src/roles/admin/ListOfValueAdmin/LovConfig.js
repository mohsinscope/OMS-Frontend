// LovConfig.js
import Config from './../../../store/configrationOfListOfValue';

export const LOV_MENU_ITEMS = [
  {
    label: "المكاتب",
    icon: "office",
    path: "/admin/add-office",
    permission: "LOVo"
  },
  {
    label: "المحافظات",
    icon: "iraq",
    path: "/admin/add-governorate",
    permission: "LOVg"
  },
  {
    label: "نوع تلف الجهاز",
    icon: "broken",
    path: "/admin/damage-types",
    permission: "LOVdd"
  },
  {
    label: "انواع الاجهزة",
    icon: "add-device",
    path: "/admin/device-types",
    permission: "LOVdd"
  },
  {
    label: "انواع تلف الجوازات",
    icon: "passport",
    path: "/admin/passport-dammage-types",
    permission: "LOVdp"
  },
  {
    label: "الشركات",
    icon: "building",
    path: "/admin/companies",
    permission: "LOVc"
  },
  {
    label: "انواع المحاضر",
    icon: "lecturersType",
    path: "/admin/lecture-types",
    permission: "LOVc"
  },
  {
    label: "حد الصرفيات",
    icon: "threshold",
    path: "/admin/thrshhold",
    permission: "LOVt"
  },
  {
    label: "انواع الصرفيات",
    icon: "bill",
    path: "/admin/expensess-types",
    permission: "LOVe"
  }
  ,
  {
    label: "انواع التبليغات",
    icon: "report",
    path: "/admin/report-type",
    permission: "LOVo"
  },
  {
    label: "تقارير البريد الإلكتروني",
    icon: "email", // Ensure you have an icon for email reports
    path: "/admin/email-report",
    permission: "LOVo" // Use an appropriate permission code
  },
  {
    label: "اضافة جهة",
    icon: "Archive", // Ensure you have an icon for email reports
    path: "/admin/Archive-party",
    permission: "LOVo" // Use an appropriate permission code
  },
  {
    label: "مشاريع",
    icon: "projects", // Ensure you have an icon for email reports
    path: "/admin/Archive-projects",
    permission: "LOVc" // Use an appropriate permission code
  },{
    label: "جهات الإحالة (CC)",
    icon: "cc",              // أضف أيقونة cc إلى ملف icons.jsx إن لم تكن موجودة
    path: "/admin/document-cc",
    permission: "LOVc"
  },
  {
    label: "الوزارات",
    icon: "ministry",        // أيقونة تمثل وزارة
    path: "/admin/ministry",
    permission: "LOVc"
  },
  {
    label: " (tags) الوسوم",
    icon: "tag",             // أيقونة تمثل Tag
    path: "/admin/tags",
    permission: "LOVc"
  },
];

export const hasLOVPermission = (permissions = []) => {
  const lovPermissions = ["LOVt", "LOVe", "LOVc", "LOVdd", "LOVdp", "LOVo", "LOVg"];
  return Array.isArray(permissions) && permissions.some(perm => lovPermissions.includes(perm));
};

export const getAuthorizedLOVRoutes = (permissions = []) => {
  if (!Array.isArray(permissions)) return [];
  return LOV_MENU_ITEMS.filter(item => permissions.includes(item.permission));
};

export const LOVConfig = {
  ...Config
};

export default LOVConfig;