import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import axiosInstance from './../../../intercepters/axiosInstance.js';
import useAuthStore from './../../../store/store.js';
const DocumentsTable = ({ onViewDocument }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const {profile} = useAuthStore();
  
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      console.log(profile.profileId)
      const response = await axiosInstance.get('/api/Document');
      console.log('API Response:', response.data);

      // Ensure we're working with an array
      let documentsData = [];
      if (Array.isArray(response.data)) {
        documentsData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Look for common array properties
        const arrayProps = ['data', 'items', 'results', 'documents', 'content'];
        for (const prop of arrayProps) {
          if (Array.isArray(response.data[prop])) {
            documentsData = response.data[prop];
            break;
          }
        }
        // If still not found, treat the object as a single item
        if (documentsData.length === 0 && Object.keys(response.data).length > 0) {
          if (response.data.id) {
            documentsData = [response.data];
          }
        }
      }

      // Process data: ensure each record has a unique key
      const processedData = documentsData.map((doc, index) => ({
        ...doc,
        key: doc.id || `doc-${index}`
      }));

      console.log('Processed data:', processedData);
      setDocuments(processedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching documents:', error);
      message.error('حدث خطأ أثناء جلب المستندات');
      setLoading(false);
    }
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('ar-EA');
    } catch (error) {
      return '-';
    }
  };

  // Helper to format time
  const formatTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleTimeString('ar-EA', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '-';
    }
  };

  // Map document type ID (your enum) to Arabic labels.
  const getDocumentTypeName = (typeId) => {
    // Based on the enum:
    // 1: Incoming -> "وارد"
    // 2: Outgoing -> "صادر"
    const types = {
      1: 'صادر',
      2: 'وارد',
    };
    return types[typeId] || 'غير معروف';
  };

  // Define table columns
  const columns = [
    {
      title: 'رقم المستند',
      dataIndex: 'documentNumber',
      key: 'documentNumber',
      render: text => text || '-',
      sorter: (a, b) => {
        const valueA = a.documentNumber || '';
        const valueB = b.documentNumber || '';
        return valueA.localeCompare(valueB);
      }
    },
    {
      title: 'العنوان',
      dataIndex: 'title',
      key: 'title',
      render: text => text || '-',
      sorter: (a, b) => {
        const valueA = a.title || '';
        const valueB = b.title || '';
        return valueA.localeCompare(valueB);
      }
    },
    {
      title: 'نوع المستند',
      dataIndex: 'documentType',
      key: 'documentType',
      render: type => (
        <Tag color="blue">{getDocumentTypeName(type)}</Tag>
      ),
      filters: [
        { text: 'وارد', value: 1 },
        { text: 'صادر', value: 2 },
      ],
      onFilter: (value, record) => record.documentType === value,
    },
    {
      title: 'الموضوع',
      dataIndex: 'subject',
      key: 'subject',
      render: text => text || '-',
      ellipsis: true,
    },
    {
      title: 'تاريخ المستند',
      dataIndex: 'documentDate',
      key: 'documentDate',
      render: date => formatDate(date),
      sorter: (a, b) => {
        const dateA = a.documentDate ? new Date(a.documentDate).getTime() : 0;
        const dateB = b.documentDate ? new Date(b.documentDate).getTime() : 0;
        return dateA - dateB;
      }
    },
    // {
    //   title: 'وقت المستند',
    //   dataIndex: 'documentDate',
    //   key: 'documentTime',
    //   render: date => formatTime(date),
    // },
    {
      title: 'يتطلب رد',
      dataIndex: 'isRequiresReply',
      key: 'isRequiresReply',
      render: requiresReply => (
        <Tag color={requiresReply ? 'green' : 'red'}>
          {requiresReply ? 'نعم' : 'لا'}
        </Tag>
      ),
      filters: [
        { text: 'نعم', value: true },
        { text: 'لا', value: false },
      ],
      onFilter: (value, record) => record.isRequiresReply === value,
    },
    {
      title: 'تاريخ الإنشاء',
      dataIndex: 'datecreated',
      key: 'datecreated',
      render: date => formatDate(date),
      sorter: (a, b) => {
        const dateA = a.datecreated ? new Date(a.datecreated).getTime() : 0;
        const dateB = b.datecreated ? new Date(b.datecreated).getTime() : 0;
        return dateA - dateB;
      }
    },
    {
      title: 'وقت الإنشاء',
      dataIndex: 'datecreated',
      key: 'timeCreated',
      render: date => formatTime(date),
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EyeOutlined />} 
            onClick={() => onViewDocument(record)}
          >
            عرض
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="documents-table-container">
      <Button 
        type="primary" 
        onClick={fetchDocuments} 
        style={{ marginBottom: 16 }}
      >
        تحديث
      </Button>
      <Table 
  dataSource={documents} 
  columns={columns} 
  rowKey="key"
  loading={loading}
  pagination={{ pageSize: 10, position: ['bottomCenter'] }}
  scroll={{ x: 1200 }}
  locale={{ emptyText: 'لا توجد مستندات' }}
/>

    </div>
  );
};

export default DocumentsTable;
