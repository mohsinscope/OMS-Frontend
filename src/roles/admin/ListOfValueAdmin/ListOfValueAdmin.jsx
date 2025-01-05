import React, { useState, useEffect } from "react";
import "./ListOfValueAdmin.css";
import Icons from "./../../../reusable elements/icons.jsx";
import listOfValuesData from "./../../../data/ListOfValueAdmin.json";
import {
  Table,
  Modal,
  Form,
  Input,
  Button,
  message,
  ConfigProvider,
  Select,
  Space,
} from "antd";
import axios from "axios";
import Url from "./../../../store/url.js";
import Config from "./../../../store/configrationOfListOfValue.js";
import useAuthStore from "./../../../store/store.js";

export default function ListOfValueAdmin() {
  const { ListOfValues } = listOfValuesData;
  const { user } = useAuthStore();

  const [selectedData, setSelectedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [formFields, setFormFields] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [currentPath, setCurrentPath] = useState(null);
  const [currentLabel, setCurrentLabel] = useState("تفاصيل القيمة");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const api = axios.create({
    baseURL: Url,
  });

  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const transformData = (data) => {
    if (currentPath === "/admin/lecture-types") {
      return data.reduce((acc, company) => {
        const lectureTypes = company.lectureTypes.map((type) => ({
          id: type.id,
          key: type.id,
          name: type.name,
          companyName: company.name,
          companyId: company.id,
        }));
        return [...acc, ...lectureTypes];
      }, []);
    }
    
    return data.map((item) => ({
      ...item,
      key: item.id?.toString() || Math.random().toString(),
    }));
  };

  const fetchData = async (endpoint, page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await api.get(
        `${endpoint}?PageNumber=${page}&PageSize=${pageSize}`
      );

      let formattedData = transformData(response.data);
      setSelectedData(formattedData);

      const paginationHeader = response.headers["pagination"];
      if (paginationHeader) {
        const paginationInfo = JSON.parse(paginationHeader);
        setPagination({
          current: paginationInfo.currentPage,
          pageSize: paginationInfo.itemsPerPage,
          total: paginationInfo.totalItems,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("فشل تحميل البيانات");
      setSelectedData([]);
    } finally {
      setLoading(false);
    }
  };

  const setupColumnsAndFormFields = async () => {
    const updatedFormFields = await Promise.all(
      selectedConfig.formFields.map(async (field) => {
        if (field.type === "dropdown" && field.optionsEndpoint) {
          try {
            const response = await api.get(field.optionsEndpoint);
            let options;

            if (currentPath === "/admin/lecture-types" && field.name === "companyId") {
              options = response.data.map((company) => ({
                label: company.name,
                value: company.id,
              }));
            } else {
              options = response.data.map((item) => ({
                label: item.name,
                value: item.id,
              }));
            }

            setDropdownOptions((prev) => ({
              ...prev,
              [field.name]: options,
            }));
            return { ...field, options };
          } catch (error) {
            console.error(`Error fetching options for ${field.name}:`, error);
            message.error(`فشل تحميل الخيارات لـ ${field.label}`);
            return { ...field, options: [] };
          }
        }
        return field;
      })
    );

    const enhancedColumns = [
      ...selectedConfig.columns,
      {
        title: "إجراءات",
        key: "actions",
        render: (_, record) => (
          <Space>
            <Button
              type="primary"
              onClick={() => handleEdit(record)}
              disabled={loading}
            >
              تعديل
            </Button>
            <Button
              variant="outlined"
              danger
              onClick={() => handleDelete(record.id)}
              disabled={loading}
            >
              حذف
            </Button>
          </Space>
        ),
      },
    ];

    setColumns(enhancedColumns);
    setFormFields(updatedFormFields);
  };

  useEffect(() => {
    if (currentPath && selectedConfig) {
      fetchData(selectedConfig.getEndpoint, pagination.current, pagination.pageSize);
      setupColumnsAndFormFields();
    }
  }, [currentPath]);

  const handleItemClick = (item) => {
    const selected = Config[item.path];
    if (!selected) {
      message.error("لم يتم العثور على التكوين المطلوب");
      return;
    }
    setCurrentPath(item.path);
    setSelectedConfig(selected);
    setCurrentLabel(item.label);
  };

  const createPayload = (values) => {
    switch (currentPath) {
      case "/admin/lecture-types":
        return {
          name: values.name,
          companyId: values.companyId,
        };
      case "/admin/add-office":
        return {
          name: values.name,
          code: values.code,
          receivingStaff: values.receivingStaff,
          accountStaff: values.accountStaff,
          printingStaff: values.printingStaff,
          qualityStaff: values.qualityStaff,
          deliveryStaff: values.deliveryStaff,
          governorateId: values.governorateId,
        };
      default:
        return {
          ...values,
          profileId: user.id,
        };
    }
  };

  const handleAdd = async (values) => {
    if (!selectedConfig) {
      message.error("الرجاء اختيار نوع البيانات أولاً");
      return;
    }

    setLoading(true);
    try {
      const payload = createPayload(values);
      await api.post(selectedConfig.postEndpoint, payload);
      message.success("تمت إضافة البيانات بنجاح");
      setIsModalOpen(false);
      form.resetFields();
      await fetchData(selectedConfig.getEndpoint, pagination.current, pagination.pageSize);
    } catch (error) {
      console.error("Error adding record:", error);
      message.error("حدث خطأ أثناء الإضافة");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (values) => {
    if (!selectedConfig || !editingId) {
      message.error("بيانات التحديث غير مكتملة");
      return;
    }

    setLoading(true);
    try {
      const endpoint = selectedConfig.putEndpoint?.(editingId);
      if (!endpoint) {
        throw new Error("Update endpoint not configured");
      }

      const payload = {
        id: editingId,
        ...createPayload(values),
      };

      await api.put(endpoint, payload);
      message.success("تم تحديث البيانات بنجاح");
      setIsModalOpen(false);
      form.resetFields();
      await fetchData(selectedConfig.getEndpoint, pagination.current, pagination.pageSize);
      setIsEditMode(false);
      setEditingId(null);
    } catch (error) {
      console.error("Error updating record:", error);
      message.error("فشل تحديث السجل");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id || !selectedConfig) {
      message.error("معرف السجل غير متوفر");
      return;
    }

    Modal.confirm({
      title: "تأكيد الحذف",
      content: "هل أنت متأكد من حذف هذا السجل؟",
      okText: "نعم",
      cancelText: "لا",
      onOk: async () => {
        setLoading(true);
        try {
          const endpoint = selectedConfig.deleteEndpoint?.(id);
          if (!endpoint) {
            throw new Error("Delete endpoint not configured");
          }

          const config = {
            data: currentPath === "/admin/add-office" ? { officeId: id } : undefined,
          };

          await api.delete(endpoint, config);
          message.success("تم حذف السجل بنجاح");
          await fetchData(selectedConfig.getEndpoint, pagination.current, pagination.pageSize);
        } catch (error) {
          console.error("Error deleting record:", error);
          message.error("فشل حذف السجل");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleEdit = (record) => {
    if (!record.id) {
      message.error("معرف السجل غير متوفر");
      return;
    }

    setIsEditMode(true);
    setEditingId(record.id);
    setIsModalOpen(true);
    form.setFieldsValue(record);
  };

  const handleAddNew = () => {
    if (!selectedConfig) {
      message.error("الرجاء اختيار نوع البيانات أولاً");
      return;
    }

    setIsEditMode(false);
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const renderFormField = (field) => {
    switch (field.type) {
      case "dropdown":
        return (
          <Select
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          >
            {(dropdownOptions[field.name] || []).map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        );
      case "date":
        return <Input type="date" />;
      case "number":
        return <Input type="number" />;
      default:
        return <Input type={field.type || "text"} />;
    }
  };

    return (
      <div className="list-of-value-container" dir="rtl">
        <div className="list-of-value-bar">
          <ul className="list-of-value-items">
            {ListOfValues.map((item, index) => (
              <li
                key={index}
                className={`list-of-value-item ${
                  currentPath === item.path ? "active" : ""
                }`}
                onClick={() => handleItemClick(item)}
              >
                <a className="list-of-value-link">
                  <Icons type={item.icon} />
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="list-of-value-details-section-left">
          <div className="top-list-of-value-details-section-left">
            <h2>{currentLabel}</h2>
            <Button
              type="primary"
              onClick={handleAddNew}
              disabled={!selectedConfig || loading}
            >
              إضافة <Icons type="add" />
            </Button>
          </div>

          <ConfigProvider direction="rtl">
            <Table
              columns={columns}
              dataSource={selectedData}
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                position: ["bottomCenter"],
                showTotal: (total) => `إجمالي السجلات: ${total}`,
                onChange: (page, pageSize) => {
                  fetchData(selectedConfig.getEndpoint, page, pageSize);
                },
                onShowSizeChange: (current, size) => {
                  fetchData(selectedConfig.getEndpoint, 1, size);
                },
              }}
              bordered
              locale={{ emptyText: "لا توجد بيانات" }}
            />
          </ConfigProvider>
        </div>

        <ConfigProvider direction="rtl">
          <Modal
            title={isEditMode ? "تعديل القيمة" : "إضافة قيمة جديدة"}
            open={isModalOpen}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingId(null);
              setIsEditMode(false);
              form.resetFields();
            }}
            footer={null}
            maskClosable={false}
          >
            <Form
              form={form}
              onFinish={isEditMode ? handleUpdate : handleAdd}
              layout="vertical"
            >
              {formFields.map((field) => (
                <Form.Item
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  style={{marginTop:"20px"}}
                  rules={[
                    { required: true, message: `الرجاء إدخال ${field.label}` },
                  ]}
                >
                  {renderFormField(field)}
                </Form.Item>
              ))}
              <Form.Item  style={{marginTop:"20px"}}>
                <Space style={{ justifyContent: "flex-end", width: "100%" }}>
                  <Button onClick={() => setIsModalOpen(false)}>إلغاء</Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    {isEditMode ? "تحديث" : "إضافة"}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        </ConfigProvider>
      </div>
    );
  }