// // src/components/archive/ArchiveHeader.jsx
// import React from 'react';
// import { Tabs } from 'antd';
// import { useArchive } from './../contexts/ArchiveContext.jsx';

// const { TabPane } = Tabs;

// const ArchiveHeader = () => {
//   const { filters, updateFilter } = useArchive();
  
//   const handleTabChange = (activeKey) => {
//     updateFilter('documentType', activeKey);
//   };
  
//   return (
//     <div className="archive-header-container">
//       <h1 className="archive-title">نظام إدارة الأرشيف</h1>
//       <Tabs 
//         activeKey={filters.documentType} 
//         onChange={handleTabChange}
//         className="document-tabs"
//       >
//         {/* <TabPane tab="وارد" key="وارد" />
//         <TabPane tab="صادر" key="صادر" /> */}
//         {/* <TabPane tab="إجابة على وارد" key="إجابة على وارد" />
//         <TabPane tab="إجابة على صادر" key="إجابة على صادر" />
//         <TabPane tab="تأكيد وارد" key="تأكيد وارد" />
//         <TabPane tab="تأكيد صادر" key="تأكيد صادر" />
//         <TabPane tab="الكل" key="الكل" /> */}
//       </Tabs>
//     </div>
//   );
// };

// export default ArchiveHeader;