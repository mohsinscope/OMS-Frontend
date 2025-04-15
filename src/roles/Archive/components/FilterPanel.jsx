// // src/components/archive/FilterPanel.jsx
// import React, { useState } from 'react';
// import { 
//   Input, 
//   Select, 
//   DatePicker, 
//   Button, 
//   Form, 
//   Row, 
//   Col,
//   Collapse 
// } from 'antd';
// import { SearchOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';
// import { useArchive } from './../contexts/ArchiveContext.jsx';

// const { Option } = Select;
// const { RangePicker } = DatePicker;
// const { Panel } = Collapse;

// const FilterPanel = () => {
//   const { filters, updateFilter, resetFilters } = useArchive();
//   const [form] = Form.useForm();
//   const [showAdvanced, setShowAdvanced] = useState(false);
  
//   // Mock data for select options
//   const projects = ['جوازات إلكترونية', 'فيزا إلكترونية', 'البوابات الإلكترونية'];
//   const entities = ['وزارة الداخلية', 'وزارة الخارجية', 'جهة خارجية', 'إدارة تقنية المعلومات'];
  
//   const handleSearchTextChange = (e) => {
//     updateFilter('searchText', e.target.value);
//   };
  
//   const handleFormSubmit = (values) => {
//     Object.keys(values).forEach(key => {
//       if (values[key] !== undefined) {
//         updateFilter(key, values[key]);
//       }
//     });
//   };
  
//   const handleReset = () => {
//     form.resetFields();
//     resetFilters();
//   };
  
//   return (
//     <div className="filter-panel">
//       <div className="search-bar-container">
//         <Input
//           placeholder="بحث سريع بالرقم أو العنوان أو الموضوع"
//           value={filters.searchText}
//           onChange={handleSearchTextChange}
//           suffix={<SearchOutlined />}
//           className="search-input"
//           allowClear
//         />
//       </div>
      
//       <Collapse 
//         className="advanced-filters-collapse"
//         expandIcon={({ isActive }) => <FilterOutlined rotate={isActive ? 90 : 0} />}
//       >
//         <Panel header="خيارات بحث متقدمة" key="1">
//           <Form 
//             form={form}
//             layout="vertical"
//             onFinish={handleFormSubmit}
//             className="advanced-filter-form"
//           >
//             <Row gutter={[16, 16]}>
//               <Col xs={24} sm={12} md={8} lg={6}>
//                 <Form.Item label="المشروع" name="project">
//                   <Select 
//                     placeholder="اختر المشروع"
//                     allowClear
//                   >
//                     {projects.map(project => (
//                       <Option key={project} value={project}>{project}</Option>
//                     ))}
//                   </Select>
//                 </Form.Item>
//               </Col>
              
//               <Col xs={24} sm={12} md={8} lg={6}>
//                 <Form.Item label="الجهة" name="entity">
//                   <Select
//                     placeholder="اختر الجهة"
//                     allowClear
//                     showSearch
//                     filterOption={(input, option) =>
//                       option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
//                     }
//                   >
//                     {entities.map(entity => (
//                       <Option key={entity} value={entity}>{entity}</Option>
//                     ))}
//                   </Select>
//                 </Form.Item>
//               </Col>
              
//               <Col xs={24} sm={12} md={8} lg={6}>
//                 <Form.Item label="رقم الكتاب" name="documentNumber">
//                   <Input placeholder="أدخل رقم الكتاب" />
//                 </Form.Item>
//               </Col>
              
//               <Col xs={24} sm={12} md={8} lg={6}>
//                 <Form.Item label="الموضوع" name="subject">
//                   <Input placeholder="أدخل موضوع الكتاب" />
//                 </Form.Item>
//               </Col>
              
//               <Col xs={24} md={12} lg={12}>
//                 <Form.Item label="الفترة الزمنية" name="dateRange">
//                   <RangePicker 
                    
//                     placeholder={['من تاريخ', 'إلى تاريخ']}
//                     style={{ width: '100%' }}
//                   />
//                 </Form.Item>
//               </Col>
              
//               <Col xs={24} md={12} lg={12}>
//                 <Form.Item label="نسخة إلى (CC)" name="copiedTo">
//                   <Select
//                     mode="multiple"
//                     placeholder="اختر الجهات"
//                     allowClear
//                     style={{ width: '100%' }}
//                   >
//                     {entities.map(entity => (
//                       <Option key={entity} value={entity}>{entity}</Option>
//                     ))}
//                   </Select>
//                 </Form.Item>
//               </Col>
//             </Row>
            
//             <Row justify="center" gutter={[16, 16]} className="filter-buttons">
//               <Col>
//                 <Button 
//                   type="primary" 
//                   htmlType="submit" 
//                   icon={<SearchOutlined />}
//                 >
//                   بحث
//                 </Button>
//               </Col>
//               <Col>
//                 <Button 
//                   onClick={handleReset}
//                   icon={<ClearOutlined />}
//                 >
//                   إعادة ضبط
//                 </Button>
//               </Col>
//             </Row>
//           </Form>
//         </Panel>
//       </Collapse>
//     </div>
//   );
// };

// export default FilterPanel;