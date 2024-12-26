export const RESOURCES = {
    DEVICES: {
      name: "Damaged_Devices",
      routes: {
        list: "/devices",
        create: "/devices/create",
        edit: "/devices/:id/edit",
        view: "/devices/:id",
        export: "/devices/export",
      },
    },
    PASSPORTS: {
      name: "passports",
      routes: {
        list: "/passports",
        create: "/passports/create",
        edit: "/passports/:id/edit",
        view: "/passports/:id",
        export: "/passports/export",
      },
    },
    EXPENSES: {
      name: "expenses",
      routes: {
        list: "/expenses",
        create: "/expenses/create",
        edit: "/expenses/:id/edit",
        view: "/expenses/:id",
        approve: "/expenses/:id/approve",
        export: "/expenses/export",
      },
    },
  };