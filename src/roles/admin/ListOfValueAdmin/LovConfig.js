// LovConfig.js
import Config from './../../../store/configrationOfListOfValue';

export const LOV_MENU_ITEMS = [
  { label: "المكاتب",               icon: "office",         path: "/admin/add-office",            permission: "LOVo" },
  { label: "المحافظات",            icon: "iraq",           path: "/admin/add-governorate",       permission: "LOVg" },
  { label: "نوع تلف الجهاز",       icon: "broken",         path: "/admin/damage-types",          permission: "LOVdd" },
  { label: "انواع الاجهزة",        icon: "add-device",     path: "/admin/device-types",          permission: "LOVdd" },
  { label: "انواع تلف الجوازات",    icon: "passport",       path: "/admin/passport-dammage-types",permission: "LOVdp" },
  { label: "الشركات",              icon: "building",       path: "/admin/companies",             permission: "LOVc" },
  { label: "انواع المحاضر",        icon: "lecturersType",  path: "/admin/lecture-types",         permission: "LOVc" },
  { label: "حد الصرفيات",          icon: "threshold",      path: "/admin/thrshhold",             permission: "LOVt" },
  { label: "انواع الصرفيات",       icon: "bill",           path: "/admin/expensess-types",       permission: "LOVe" },
  { label: "انواع التبليغات",      icon: "report",         path: "/admin/report-type",           permission: "LOVo" },
  { label: "تقارير البريد الإلكتروني", icon: "email",       path: "/admin/email-report",          permission: "LOVo" },

  // ✅ NEW (already in your list, just keeping it here correctly): Role → Permissions
  { label: "الصلاحيات للمناصب",     icon: "role",           path: "/admin/permtions",             permission: "LOVo" },

  { label: "اضافة جهة غير حكومية", icon: "Archive",        path: "/admin/private-party",         permission: "LOVDOC" },
  { label: "مشاريع",               icon: "projects",       path: "/admin/Archive-projects",      permission: "LOVDOC" },
  { label: "جهات الإحالة (CC)",     icon: "cc",             path: "/admin/document-cc",           permission: "LOVDOC" },
  { label: "الوزارات",             icon: "ministry",       path: "/admin/ministry-hierarchy",    permission: "LOVDOC" },
  { label: " (tags) الوسوم",        icon: "tag",            path: "/admin/tags",                  permission: "LOVDOC" },
];

export const hasLOVPermission = (permissions = []) => {
  const lovPermissions = ["LOVt", "LOVe", "LOVc", "LOVdd", "LOVdp", "LOVo", "LOVg"];
  return Array.isArray(permissions) && permissions.some(perm => lovPermissions.includes(perm));
};

export const getAuthorizedLOVRoutes = (permissions = []) => {
  if (!Array.isArray(permissions)) return [];
  return LOV_MENU_ITEMS.filter(item => permissions.includes(item.permission));
};

// Merge app-wide config with our list-of-value map.
// We add a minimal config for /admin/permtions so the page activates cleanly.
export const LOVConfig = {
  ...Config,
  "/admin/permtions": {
    label: "الصلاحيات للمناصب",
    // not used by the custom UI, but harmless for your generic loader:
    getEndpoint: "/api/Permission/all-permissions?pageNumber=1&pageSize=100",
    columns: [],
    formFields: [],
  },
};

export default LOVConfig;
