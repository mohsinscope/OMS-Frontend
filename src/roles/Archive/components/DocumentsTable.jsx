import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from './../../../intercepters/axiosInstance.js';
import useAuthStore from './../../../store/store.js';

const DocumentsTable = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/Document');

      let documentsData = [];
      if (Array.isArray(response.data)) {
        documentsData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        const arrayProps = ['data', 'items', 'results', 'documents', 'content'];
        for (const prop of arrayProps) {
          if (Array.isArray(response.data[prop])) {
            documentsData = response.data[prop];
            break;
          }
        }
        if (documentsData.length === 0 && Object.keys(response.data).length > 0) {
          if (response.data.id) {
            documentsData = [response.data];
          }
        }
      }

      const processedData = documentsData.map((doc, index) => ({
        ...doc,
        key: doc.id || `doc-${index}`,
      }));

      setDocuments(processedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching documents:', error);
      message.error('حدث خطأ أثناء جلب الكتب');
      setLoading(false);
    }
  };

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

  // Map document type IDs to labels.
  const getDocumentTypeName = (typeId) => {
    // Example enum mapping
    const types = {
      1: 'صادر',
      2: 'وارد',
    };
    return types[typeId] || 'غير معروف';
  };

  const columns = [
    {
      title: 'رقم الكتاب',
      dataIndex: 'documentNumber',
      key: 'documentNumber',
      render: (text) => text || '-',
      sorter: (a, b) => (a.documentNumber || '').localeCompare(b.documentNumber || ''),
    },
    {
      title: 'العنوان',
      dataIndex: 'title',
      key: 'title',
      render: (text) => text || '-',
      sorter: (a, b) => (a.title || '').localeCompare(b.title || ''),
    },
    {
      title: 'نوع الكتاب',
      dataIndex: 'documentType',
      key: 'documentType',
      render: (type) => <Tag color="blue">{getDocumentTypeName(type)}</Tag>,
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
      render: (text) => text || '-',
      ellipsis: true,
    },
    {
      title: 'تاريخ الكتاب',
      dataIndex: 'documentDate',
      key: 'documentDate',
      render: (date) => formatDate(date),
      sorter: (a, b) =>
        (a.documentDate ? new Date(a.documentDate).getTime() : 0) -
        (b.documentDate ? new Date(b.documentDate).getTime() : 0),
    },
    {
      title: 'يتطلب رد',
      dataIndex: 'isRequiresReply',
      key: 'isRequiresReply',
      render: (requiresReply) => (
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
      render: (date) => formatDate(date),
      sorter: (a, b) =>
        (a.datecreated ? new Date(a.datecreated).getTime() : 0) -
        (b.datecreated ? new Date(b.datecreated).getTime() : 0),
    },
    {
      title: 'وقت الإنشاء',
      dataIndex: 'datecreated',
      key: 'timeCreated',
      render: (date) => formatTime(date),
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
            <Link
            to="/ViewArchivePage"
            state={{ id: record.id }}
          >
            عرض
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <div className="documents-table-container">
      <Button type="primary" onClick={fetchDocuments} style={{ marginBottom: 16 }}>
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
