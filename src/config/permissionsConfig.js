export const ROLE_PERMISSIONS = {
    Damaged_Devices: {
      devices: ["create", "read", "update", "delete", "export"],
    
    },
    Expenses: {
        expenses: ["create", "read", "update", "delete", "approve", "export"],
    },
    Attendence: {
        attendance: [ "create","read", "update", "delete", "approve", "export"], // Consistent lowercase "attendance"
    },
  };
  