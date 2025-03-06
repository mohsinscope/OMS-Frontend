export const ROLE_PERMISSIONS = {
  DamagedDevice: {
      devices: [ "read",  "export"],
    
    },
    Expenses: {
        expenses: [ "read", "update", "delete", "approve", "export"],
    },
    Attendence: {
        attendance: ["read",  "approve", "export"], // Consistent lowercase "attendance"
    },
    DamagedPassport: {
      passports: [ "read",  "approve", "export"], // Consistent lowercase "attendance"
  },
  Supervisor: {
    supervisor: ["create","read", "update", "delete", "approve", "export"], // Consistent lowercase "attendance"
  },
  Admin: {
    admin: ["create","read", "update", "delete", "approve"], // Consistent lowercase "attendance"
  },

  AddDamagedDevice:{
    adddamageddevice:["create","read", "update", "delete", "approve"],
  },
  Lecture:{
    lecture:["read",  "approve"],
  },
  Report:{
    report:["read",  "approve"],
  }
  };
  