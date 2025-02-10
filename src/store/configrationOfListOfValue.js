  const Config = {
    "/admin/add-office": {
      getEndpoint: "/api/office",
      postEndpoint: "/api/office",
      putEndpoint: (id) => `/api/office/${id}`,
      deleteEndpoint: (id) => `/api/office/${id}`,
      columns: [
        { title: "اسم المكتب", dataIndex: "name", key: "name" },
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
          title: "موظفو الجودة",
          dataIndex: "qualityStaff",
          key: "qualityStaff",
        },
        {
          title: "موظفو التسليم",
          dataIndex: "deliveryStaff",
          key: "deliveryStaff",
        }, {
          title: "ميزانية المكتب",
          dataIndex: "budget",
          key: "budget",
        },
      ],
      formFields: [
        { name: "name", label: "اسم المكتب", type: "text" },
        { name: "code", label: "الكود", type: "number" },

        { name: "receivingStaff", label: "موظفو الاستلام", type: "number" },

        { name: "accountStaff", label: "موظفو الحسابات", type: "number" },
        { name: "printingStaff", label: "موظفو الطباعة", type: "number" },
        { name: "qualityStaff", label: "موظفو الجودة", type: "number" },
        { name: "deliveryStaff", label: "موظفو التسليم", type: "number" },
        {
          name: "governorateId",
          label: "اسم المحافظة",
          type: "dropdown",
          optionsEndpoint: "/api/governorate?PageNumber=1&PageSize=100",
        },
        { name: "budget", label: "ميزانية المكتب", type: "number" },

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
  "/admin/companies": {
      getEndpoint: "/api/company",
      postEndpoint: "/api/company/add",
      
      deleteEndpoint: (id) => `/api/company/${id}`,
          columns: [
        { title: "اسم الشركة", dataIndex: "name", key: "name" }
      ],
      formFields: [
        { name: "name", label: "اسم الشركة", type: "text" }
      ]
    },

  "/admin/lecture-types": {
      getEndpoint: "/api/Company/lecture-types",
      postEndpoint: "/api/company/add-lecture-type",
      putEndpoint: (id) => `/api/company/lectureType/${id}`,
      deleteEndpoint: (id) => `/api/company/lectureType/${id}`,
      columns: [
        { title: "نوع المحضر", dataIndex: "name", key: "name" },
        { title: "الشركة", dataIndex: "companyName", key: "companyName" }
      ],
      formFields: [
        { name: "name", label: "نوع المحضر", type: "text" },
        { 
          name: "companyId", // Changed from companyName to companyId
          label: "الشركة", 
          type: "dropdown",
          optionsEndpoint: "/api/company?PageNumber=1&PageSize=100" // Added the endpoint
        }
      ]
  },"/admin/thrshhold": {
      getEndpoint: "/api/Threshold",
      postEndpoint: "/api/Threshold",
      putEndpoint: (id) => `/api/Threshold/${id}`,
      deleteEndpoint: (id) => `/api/Threshold/${id}`,
      columns: [
        { title: "المستوى", dataIndex: "name", key: "name" },
        { title: "الحد الأدنى", dataIndex: "minValue", key: "minValue" },
        { title: "الحد الأعلى", dataIndex: "maxValue", key: "maxValue" }
      ],
      formFields: [
        { 
          name: "name", 
          label: "المستوى", 
          type: "dropdown",
          options: [
            { label: "High", value: "High" },
            { label: "Medium", value: "Medium" },
            { label: "Low", value: "Low" }
          ]
        },
        { name: "minValue", label: "الحد الأدنى", type: "number" },
        { name: "maxValue", label: "الحد الأعلى", type: "number" }
      ]
    },

    "/admin/expensess-types": {
      getEndpoint: "/api/ExpenseType",
      postEndpoint: "/api/ExpenseType",
      putEndpoint: (id) => `/api/ExpenseType/${id}`,
      deleteEndpoint: (id) => `/api/ExpenseType/${id}`,
      columns: [
        { title: "نوع الصرفية", dataIndex: "name", key: "name" }
      ],
      formFields: [
        { name: "name", label: "نوع الصرفية", type: "text" }
      ]
    },
    "/admin/report-type": {
  getEndpoint: "/api/EmailReport/ReportTypes",
  postEndpoint: "/api/EmailReport/report-type",
  putEndpoint: (id) => `/api/EmailReport/ReportType/${id}`,
  columns: [
    { title: "اسم التبليغ", dataIndex: "name", key: "name" },
    { title: "التفاصيل", dataIndex: "description", key: "description" },
  ],
  formFields: [
    { name: "name", label: "اسم التبليغ", type: "text" },
    { name: "description", label: "التفاصيل", type: "text" },
  ],
},
    "/admin/email-report": {
      getEndpoint: "/api/EmailReport",
      postEndpoint: "/api/EmailReport/email-report",
      putEndpoint: (id) => `/api/EmailReport/${id}`,
      deleteEndpoint: (id) => `/api/EmailReport/${id}`,
      columns: [
        { title: "الاسم الكامل", dataIndex: "fullName", key: "fullName" },
        { title: "البريد الإلكتروني", dataIndex: "email", key: "email" },
        {
          title: "أنواع التبليغ",
          dataIndex: "reportTypes",
          key: "reportTypes",
          render: (reportTypes) =>
            Array.isArray(reportTypes)
              ? reportTypes.map((rt) => rt.name).join(", ")
              : "",
        },
      ],
      formFields: [
        { name: "fullName", label: "الاسم الكامل", type: "text" },
        { name: "email", label: "البريد الإلكتروني", type: "text" },
        {
          name: "reportTypeIds",
          label: "أنواع التبليغ",
          type: "dropdown",
          mode: "multiple", // allow selecting multiple report types
          optionsEndpoint: "/api/EmailReport/ReportTypes",
        },
      ],
    },
    
  
  };

  export default Config;
