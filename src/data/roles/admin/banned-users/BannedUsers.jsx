import React, { useState, useEffect } from 'react';
import { Table, Button, message, Space } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import axiosInstance from './../../../intercepters/axiosInstance.js';

export default function BannedUsers() {
  const [lockedAccounts, setLockedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlockingUser, setUnlockingUser] = useState(null);

  useEffect(() => {
    fetchLockedAccounts();
  }, []);

  const fetchLockedAccounts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/account/locked-accounts');
      setLockedAccounts(response.data);
    } catch (err) {
      message.error('Failed to load banned users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (userId) => {
    try {
      setUnlockingUser(userId);
      await axiosInstance.post(`/api/account/unlock-account/${userId}`);
      
      message.success('User has been unlocked successfully');
      await fetchLockedAccounts();
    } catch (err) {
      message.error('Failed to unlock user. Please try again.');
    } finally {
      setUnlockingUser(null);
    }
  };

  const columns = [
    {
      title: 'اسم المستخدم',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: 'وقت انتهاء الحظر',
      dataIndex: 'lockoutEnd',
      key: 'lockoutEnd',
      render: (text) => new Date(text).toLocaleString('En'),
    },
    {
      title: 'الدقائق المتبقية',
      dataIndex: 'remainingMinutes',
      key: 'remainingMinutes',
      render: (minutes) => `${minutes} دقيقة`,
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => handleUnlock(record.id)}
            disabled={unlockingUser === record.id}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            {unlockingUser === record.id ? <LoadingOutlined /> : null}
            <span style={{ marginRight: unlockingUser === record.id ? '8px' : '0' }}>
              فتح الحظر
            </span>
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }} className='admin-user-management-container' dir='rtl'>
      <h1 style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        marginBottom: '24px',
        textAlign: 'right' 
      }}>
        المستخدمون المحظورون
      </h1>

      <Table
        columns={columns}
        dataSource={lockedAccounts}
        loading={loading}
        rowKey="id"
        locale={{
          emptyText: 'لا يوجد مستخدمون محظورون',
        }}
        direction="rtl"
        pagination={false}
      />
    </div>
  );
}