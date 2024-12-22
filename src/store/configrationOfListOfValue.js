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
  "/admin/device-dammage-types": {
    getEndpoint: "/api/damageddevice",
    postEndpoint: "/api/damageddevice",
    putEndpoint: (id) => `/api/damageddevice/${id}`,
    deleteEndpoint: (id) => `/api/damageddevice/${id}`,
    columns: [
      { title: "التاريخ", dataIndex: "date", key: "date" },
      {
        title: "اسم الجهاز",
        dataIndex: "deviceTypeName",
        key: "deviceTypeName",
      },
      {
        title: "المحافظة",
        dataIndex: "governorateName",
        key: "governorateName",
      },
      { title: "اسم المكتب", dataIndex: "officeName", key: "officeName" },
      {
        title: "اسم المستخدم",
        dataIndex: "profileFullName",
        key: "profileFullName",
      },
    ],
    formFields: [
      { name: "serialNumber", label: "الرقم التسلسلي", type: "text" },
      { name: "date", label: "التاريخ", type: "date" },
      {
        name: "damagedDeviceTypeId",
        label: "نوع التلف",
        type: "dropdown",
        optionsEndpoint: "/api/damageddevicetype/all",
      },
      {
        name: "deviceTypeId",
        label: "نوع الجهاز",
        type: "dropdown",
        optionsEndpoint: "/api/devicetype",
      },
      {
        name: "governorateId",
        label: "اسم المحافظة",
        type: "dropdown",
        optionsEndpoint: "/api/governorate?PageNumber=1&PageSize=100",
      },
      {
        name: "officeId",
        label: "اسم المكتب",
        type: "dropdown",
        optionsEndpoint: "/api/office?PageNumber=1&PageSize=100",
      },
      {
        name: "profileId",
        label: "اسم المستخدم",
        type: "dropdown",
        optionsEndpoint: "/api/profile?PageNumber=1&PageSize=100",
      },
    ],
  },
  "/admin/passport-dammage": {
    getEndpoint: "/api/damagedpassport",
    postEndpoint: "/api/damagedpassport",
    putEndpoint: (id) => `/api/damagedpassport/${id}`,
    deleteEndpoint: (id) => `/api/damagedpassport/${id}`,
    columns: [
      { title: "التاريخ", dataIndex: "date", key: "date" },
      {
        title: "رقم الجواز",
        dataIndex: "passportNumber",
        key: "passportNumber",
      },
      {
        title: "نوع تلف الجواز",
        dataIndex: "damagedTypeName",
        key: "damagedTypeName",
      },
      {
        title: "المحافظة",
        dataIndex: "governorateName",
        key: "governorateName",
      },
      { title: "اسم المكتب", dataIndex: "officeName", key: "officeName" },
      {
        title: "اسم المستخدم",
        dataIndex: "profileFullName",
        key: "profileFullName",
      },
    ],
    formFields: [
      { name: "date", label: "التاريخ", type: "date" },
      { name: "passportNumber", label: "رقم الجواز", type: "text" },
      {
        name: "damagedTypeId",
        label: "نوع تلف الجواز",
        type: "dropdown",
        optionsEndpoint: "/api/damagedtype/all",
      },
      {
        name: "governorateId",
        label: "المحافظة",
        type: "dropdown",
        optionsEndpoint: "/api/governorate?PageNumber=1&PageSize=100",
      },
      {
        name: "officeId",
        label: "اسم المكتب",
        type: "dropdown",
        optionsEndpoint: "/api/office?PageNumber=1&PageSize=100",
      },
      {
        name: "profileId",
        label: "اسم المستخدم",
        type: "text",
        optionsEndpoint: "/api/profile?PageNumber=1&PageSize=100",
      },
    ],
  },
};

export default Config;
