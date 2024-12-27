const Config = {
  "/admin/add-office": {
    getEndpoint: "/api/office",
    postEndpoint: "/api/office",
    putEndpoint: (id) => `/api/office/${id}`,
    deleteEndpoint: (id) => `/api/office/${id}`,
    columns: [
      { title: "اسم المكتب", dataIndex: "name", key: "name" },
      { title: "الكود", dataIndex: "code", key: "code" },
      {
        title: "موظفو الاستلام",
        dataIndex: "receivingStaff",
        key: "receivingStaff",
      },
      {
        title: "موظفو الحسابات",
        dataIndex: "accountStaff",
        key: "accountStaff",
      },
      {
        title: "موظفو الطباعة",
        dataIndex: "printingStaff",
        key: "printingStaff",
      },
      {
        title: "موظفوا الجودة",
        dataIndex: "qualityStaff",
        key: "qualityStaff",
      },
      {
        title: "موظفو التوصيل",
        dataIndex: "deliveryStaff",
        key: "deliveryStaff",
      },
    ],
    formFields: [
      { name: "name", label: "اسم المكتب", type: "text" },
      { name: "code", label: "الكود", type: "number" },
      { name: "receivingStaff", label: "موظفو الاستلام", type: "number" },
      { name: "accountStaff", label: "موظفو الحسابات", type: "number" },
      { name: "printingStaff", label: "موظفو الطباعة", type: "number" },
      { name: "qualityStaff", label: "موظفوا الجودة", type: "number" },
      { name: "deliveryStaff", label: "موظفو التوصيل", type: "number" },
      {
        name: "governorateId",
        label: "رقم المحافظة",
        type: "dropdown",
        optionsEndpoint: "/api/governorate?PageNumber=1&PageSize=100",
      },
    ],
  },
  "/admin/add-governorate": {
    getEndpoint: "/api/governorate",
    postEndpoint: "/api/governorate",
    putEndpoint: (id) => `/api/governorate/${id}`,
    deleteEndpoint: (id) => `/api/governorate/${id}`,
    columns: [
      { title: "اسم المحافظة", dataIndex: "name", key: "name" },
      { title: "الكود", dataIndex: "code", key: "code" },
    ],
    formFields: [
      { name: "name", label: "اسم المحافظة", type: "text" },
      { name: "code", label: "الكود", type: "text" },
    ],
  },
  "/admin/device-types": {
    getEndpoint: "/api/devicetype",
    postEndpoint: "/api/devicetype",
    putEndpoint: (id) => `/api/devicetype/${id}`,
    deleteEndpoint: (id) => `/api/devicetype/${id}`,
    columns: [
      { title: "اسم الجهاز", dataIndex: "name", key: "name" },
      { title: "التفاصيل", dataIndex: "description", key: "description" },
    ],
    formFields: [
      { name: "name", label: "اسم الجهاز", type: "text" },
      { name: "description", label: "التفاصيل", type: "text" },
    ],
  },
  "/admin/damage-types": {
    getEndpoint: "/api/damageddevicetype/all",
    postEndpoint: "/api/damageddevicetype/add",
    putEndpoint: (id) => `/api/damageddevicetype/${id}`,
    deleteEndpoint: (id) => `/api/damageddevicetype/${id}`,
    columns: [
      { title: "اسم تلف الجهاز", dataIndex: "name", key: "name" },
      { title: "التفاصيل", dataIndex: "description", key: "description" },
    ],
    formFields: [
      { name: "name", label: "اسم تلف الجهاز", type: "text" },
      { name: "description", label: "التفاصيل", type: "text" },
    ],
  },
  "/admin/passport-dammage-types": {
    getEndpoint: "/api/damagedtype/all",
    postEndpoint: "/api/damagedtype/add",
    putEndpoint: (id) => `/api/damagedtype/update/${id}`,
    deleteEndpoint: (id) => `/api/damagedtype/delete/${id}`,
    columns: [
      { title: "اسم تلف الجواز", dataIndex: "name", key: "name" },
      { title: "التفاصيل", dataIndex: "description", key: "description" },
    ],
    formFields: [
      { name: "name", label: "اسم تلف الجواز", type: "text" },
      { name: "description", label: "التفاصيل", type: "text" },
    ],
  },
 
 
};

export default Config;
