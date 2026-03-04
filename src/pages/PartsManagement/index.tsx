import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Space,
  Form,
  App,
  Tooltip,
  Tag,
  Popconfirm,
  Modal
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import partsService, { Part } from "./service";
import { SvTable, SvQuery } from "../../components";
import { partsQueryTemplateService, partsQueryFieldService } from "./queryService";
import {
  SizeSelectModal,
  EditableCell
} from "./components";

const statusOptions = [
  { label: "启用", value: "active" },
  { label: "停用", value: "inactive" },
];

const sectionOptions = [
  { label: "车门/门组", value: "door" },
  { label: "底盘", value: "chassis" },
  { label: "发动机", value: "engine" },
  { label: "内饰", value: "interior" },
];

const levelOptions = [
  { label: "A级", value: "A" },
  { label: "B级", value: "B" },
  { label: "C级", value: "C" },
  { label: "S级", value: "S" },
];

const fragileOptions = [
  { label: "是(Y)", value: "Y" },
  { label: "否(N)", value: "N" },
];

const PartsManagement: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [data, setData] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isAdding, setIsAdding] = useState(false);
  const [sortParams, setSortParams] = useState<{
    field?: string;
    order?: string;
  }>({});

  // 多选功能
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 尺寸弹框状态
  const [sizeModalVisible, setSizeModalVisible] = useState(false);

  // 表格容器 ref
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const [tableScrollY, setTableScrollY] = useState<number>(400);

  // 动态计算表格高度
  useEffect(() => {
    if (!tableContainerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const targetY = entry.contentRect.height - 150;
        requestAnimationFrame(() => {
          setTableScrollY(Math.max(200, targetY));
        });
      }
    });
    resizeObserver.observe(tableContainerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 加载数据
  const fetchData = async (params: any = {}) => {
    setLoading(true);
    try {
      const res = await partsService.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        sortField: sortParams.field,
        sortOrder: sortParams.order,
        ...params,
      });
      if (res.code === 200) {
        setData(res.data.list);
        setPagination((prev) => ({ ...prev, total: res.data.total }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 处理查询
  const handleSearch = (conditions: Record<string, any>) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData({ ...conditions, page: 1 });
  };

  // 处理重置
  const handleReset = () => {
    setSortParams({});
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData({ page: 1, sortField: undefined, sortOrder: undefined });
  };

  // 处理选择变化
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("请先选择要删除的数据");
      return;
    }

    Modal.confirm({
      title: "确认删除",
      content: `确定要删除选中的 ${selectedRowKeys.length} 条数据吗？`,
      okText: "确定",
      cancelText: "取消",
      okType: "danger",
      onOk: async () => {
        setLoading(true);
        try {
          for (const key of selectedRowKeys) {
            await partsService.delete(key as string);
          }
          message.success("批量删除成功");
          setSelectedRowKeys([]);
          fetchData();
        } catch (error) {
          message.error("批量删除失败");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    getCheckboxProps: () => ({
      disabled: editingKey !== "",
    }),
  };

  const isEditing = (record: Part) => record.key === editingKey;

  const handleSizeSelect = (selectedSize: string) => {
    form.setFieldsValue({
      size: selectedSize,
    });
    setSizeModalVisible(false);
  };

  const openSizeModal = () => {
    setSizeModalVisible(true);
  };

  // 编辑
  const edit = (record: Part) => {
    form.setFieldsValue({ ...record });
    setEditingKey(record.key);
  };

  // 取消编辑
  const cancel = () => {
    if (isAdding) {
      setData(data.filter((item) => item.key !== editingKey));
      setIsAdding(false);
    }
    setEditingKey("");
  };

  // 保存
  const save = async (key: string) => {
    try {
      const row = await form.validateFields();
      setLoading(true);

      if (isAdding) {
        const res = await partsService.create(row);
        if (res.code === 200) {
          message.success("添加成功");
          setIsAdding(false);
          fetchData();
        }
      } else {
        const res = await partsService.update({ ...row, key });
        if (res.code === 200) {
          message.success("保存成功");
          const newData = [...data];
          const index = newData.findIndex((item) => item.key === key);
          if (index > -1) {
            newData[index] = { ...newData[index], ...row };
            setData(newData);
          }
        }
      }
      setEditingKey("");
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
    } finally {
      setLoading(false);
    }
  };

  // 删除
  const handleDelete = async (key: string) => {
    setLoading(true);
    try {
      const res = await partsService.delete(key);
      if (res.code === 200) {
        message.success("删除成功");
        fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  // 添加新行
  const handleAdd = () => {
    const newKey = `new_${Date.now()}`;
    const newRecord: Part = {
      key: newKey,
      partNo: "",
      partName: "",
      partNameEn: "",
      size: "",
      section: "door",
      quantity: 0,
      status: "active",
      remark: "",
      manufacturer: "",
      material: "",
      weight: 0,
      price: 0,
      supplier: "",
      level: "A",
      color: "",
      unit: "个",
      productionDate: "",
      validityPeriod: 12,
      version: "V1.0",
      safetyStock: 0,
      maxStock: 0,
      location: "",
      inspector: "",
      certNo: "",
      drawingNo: "",
      batchNo: "",
      isFragile: "N",
      compatibility: "",
    };
    setData([newRecord, ...data]);
    form.setFieldsValue(newRecord);
    setEditingKey(newKey);
    setIsAdding(true);
  };

  // 分页变化
  const handleTableChange = (
    paginationConfig: any,
    _filters: any,
    sorter: any,
  ) => {
    const newSortParams = {
      field: Array.isArray(sorter) ? sorter[0].field : sorter.field,
      order: Array.isArray(sorter) ? sorter[0].order : sorter.order,
    };
    if (!newSortParams.order) {
      newSortParams.field = undefined;
    }
    setSortParams(newSortParams);

    setPagination({
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
      total: pagination.total,
    });
    fetchData({
      page: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
      sortField: newSortParams.field,
      sortOrder: newSortParams.order,
    });
  };

  const getColumns = (): ColumnsType<Part> => {
    const renderTooltip = (text: React.ReactNode, title?: React.ReactNode) => (
      <Tooltip placement="topLeft" title={title ?? text}>
        <div
          style={{
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            cursor: "help",
          }}
        >
          {text}
        </div>
      </Tooltip>
    );

    return [
      {
        title: "配件编号",
        dataIndex: "partNo",
        width: 120,
        sorter: true,
        render: (text: string) => renderTooltip(text),
        onCell: (record) => ({
          record,
          inputType: "text",
          dataIndex: "partNo",
          title: "配件编号",
          editing: isEditing(record),
        }),
      },
      {
        title: "配件名称",
        dataIndex: "partName",
        width: 140,
        sorter: true,
        render: (text: string) => renderTooltip(text),
        onCell: (record) => ({
          record,
          inputType: "textarea",
          dataIndex: "partName",
          title: "配件名称",
          editing: isEditing(record),
        }),
      },
      {
        title: "英文名称",
        dataIndex: "partNameEn",
        width: 180,
        sorter: true,
        render: (text: string) => renderTooltip(text),
        onCell: (record) => ({
          record,
          inputType: "textarea",
          dataIndex: "partNameEn",
          title: "英文名称",
          editing: isEditing(record),
        }),
      },
      {
        title: "尺寸",
        dataIndex: "size",
        width: 120,
        sorter: true,
        render: (text: string) => renderTooltip(text),
        onCell: (record) => ({
          record,
          inputType: "text",
          dataIndex: "size",
          title: "尺寸",
          editing: isEditing(record),
        }),
      },
      {
        title: "科组",
        dataIndex: "section",
        width: 100,
        sorter: true,
        render: (section: string) => {
          const option = sectionOptions.find((opt) => opt.value === section);
          const text = option ? option.label : section;
          return renderTooltip(text);
        },
        onCell: (record) => ({
          record,
          inputType: "select",
          dataIndex: "section",
          title: "科组",
          editing: isEditing(record),
          options: sectionOptions,
        }),
      },
      {
        title: "用量",
        dataIndex: "quantity",
        width: 80,
        align: "center",
        sorter: true,
        render: (val: number) => renderTooltip(val),
        onCell: (record) => ({
          record,
          inputType: "number",
          dataIndex: "quantity",
          title: "用量",
          editing: isEditing(record),
        }),
      },
      {
        title: "状态",
        dataIndex: "status",
        width: 80,
        align: "center",
        sorter: true,
        render: (status: string) => {
          const text = status === "active" ? "启用" : "停用";
          const tag = (
            <Tag color={status === "active" ? "green" : "default"}>{text}</Tag>
          );
          return renderTooltip(tag, text);
        },
        onCell: (record) => ({
          record,
          inputType: "select",
          dataIndex: "status",
          title: "状态",
          editing: isEditing(record),
          options: statusOptions,
        }),
      },
      {
        title: "备注",
        dataIndex: "remark",
        width: 150,
        render: (text: string) => renderTooltip(text),
        onCell: (record) => ({
          record,
          inputType: "textarea",
          dataIndex: "remark",
          title: "备注",
          editing: isEditing(record),
        }),
      },
      {
        title: "制造商",
        dataIndex: "manufacturer",
        width: 120,
        sorter: true,
        render: (text: string) => renderTooltip(text),
        onCell: (record) => ({ record, inputType: "text", dataIndex: "manufacturer", title: "制造商", editing: isEditing(record) }),
      },
      {
        title: "材质",
        dataIndex: "material",
        width: 100,
        sorter: true,
        render: (text: string) => renderTooltip(text),
        onCell: (record) => ({ record, inputType: "text", dataIndex: "material", title: "材质", editing: isEditing(record) }),
      },
      {
        title: "重量(g)",
        dataIndex: "weight",
        width: 100,
        sorter: true,
        render: (text: number) => renderTooltip(text),
        onCell: (record) => ({ record, inputType: "number", dataIndex: "weight", title: "重量(g)", editing: isEditing(record) }),
      },
      {
        title: "单价(元)",
        dataIndex: "price",
        width: 100,
        sorter: true,
        render: (text: number) => renderTooltip(text),
        onCell: (record) => ({ record, inputType: "number", dataIndex: "price", title: "单价(元)", editing: isEditing(record) }),
      },
      {
        title: "供应商",
        dataIndex: "supplier",
        width: 120,
        sorter: true,
        render: (text: string) => renderTooltip(text),
        onCell: (record) => ({ record, inputType: "text", dataIndex: "supplier", title: "供应商", editing: isEditing(record) }),
      },
      {
        title: "等级",
        dataIndex: "level",
        width: 80,
        sorter: true,
        render: (level: string) => {
          const option = levelOptions.find((opt) => opt.value === level);
          return renderTooltip(option ? option.label : level);
        },
        onCell: (record) => ({ record, inputType: "select", dataIndex: "level", title: "等级", editing: isEditing(record), options: levelOptions }),
      },
      {
        title: "颜色",
        dataIndex: "color",
        width: 80,
        sorter: true,
        render: (text: string) => renderTooltip(text),
        onCell: (record) => ({ record, inputType: "text", dataIndex: "color", title: "颜色", editing: isEditing(record) }),
      },
      {
        title: "单位",
        dataIndex: "unit",
        width: 80,
        sorter: true,
        render: (text: string) => renderTooltip(text),
        onCell: (record) => ({ record, inputType: "text", dataIndex: "unit", title: "单位", editing: isEditing(record) }),
      },
      {
        title: "生产日期",
        dataIndex: "productionDate",
        width: 120,
        sorter: true,
        render: (text: string) => renderTooltip(text),
        onCell: (record) => ({ record, inputType: "text", dataIndex: "productionDate", title: "生产日期", editing: isEditing(record) }),
      },
      {
        title: "有效期(月)",
        dataIndex: "validityPeriod",
        width: 100,
        sorter: true,
        render: (text: number) => renderTooltip(text),
        onCell: (record) => ({ record, inputType: "number", dataIndex: "validityPeriod", title: "有效期(月)", editing: isEditing(record) }),
      },
      {
        title: "版本",
        dataIndex: "version",
        width: 100,
        sorter: true,
        render: (text: string) => renderTooltip(text),
        onCell: (record) => ({ record, inputType: "text", dataIndex: "version", title: "版本", editing: isEditing(record) }),
      },
      {
        title: "安全库存",
        dataIndex: "safetyStock",
        width: 100,
        sorter: true,
        render: (text: number) => renderTooltip(text),
        onCell: (record) => ({ record, inputType: "number", dataIndex: "safetyStock", title: "安全库存", editing: isEditing(record) }),
      },
      {
        title: "最大库存",
        dataIndex: "maxStock",
        width: 100,
        sorter: true,
        render: (text: number) => renderTooltip(text),
        onCell: (record) => ({ record, inputType: "number", dataIndex: "maxStock", title: "最大库存", editing: isEditing(record) }),
      },
      {
        title: "存放位置",
        dataIndex: "location",
        width: 120,
        sorter: true,
        render: (text: string) => renderTooltip(text),
        onCell: (record) => ({ record, inputType: "text", dataIndex: "location", title: "存放位置", editing: isEditing(record) }),
      },
      {
        title: "检验员",
        dataIndex: "inspector",
        width: 100,
        sorter: true,
        render: (text: string) => renderTooltip(text),
        onCell: (record) => ({ record, inputType: "text", dataIndex: "inspector", title: "检验员", editing: isEditing(record) }),
      },
      {
        title: "合格证号",
        dataIndex: "certNo",
        width: 140,
        sorter: true,
        render: (text: string) => renderTooltip(text),
        onCell: (record) => ({ record, inputType: "text", dataIndex: "certNo", title: "合格证号", editing: isEditing(record) }),
      },
      {
        title: "图纸号",
        dataIndex: "drawingNo",
        width: 140,
        sorter: true,
        render: (text: string) => renderTooltip(text),
        onCell: (record) => ({ record, inputType: "text", dataIndex: "drawingNo", title: "图纸号", editing: isEditing(record) }),
      },
      {
        title: "批次号",
        dataIndex: "batchNo",
        width: 140,
        sorter: true,
        render: (text: string) => renderTooltip(text),
        onCell: (record) => ({ record, inputType: "text", dataIndex: "batchNo", title: "批次号", editing: isEditing(record) }),
      },
      {
        title: "是否易碎",
        dataIndex: "isFragile",
        width: 100,
        sorter: true,
        render: (val: string) => {
          const option = fragileOptions.find((opt) => opt.value === val);
          return renderTooltip(option ? option.label : val);
        },
        onCell: (record) => ({ record, inputType: "select", dataIndex: "isFragile", title: "是否易碎", editing: isEditing(record), options: fragileOptions }),
      },
      {
        title: "适用车型",
        dataIndex: "compatibility",
        width: 120,
        sorter: true,
        render: (text: string) => renderTooltip(text),
        onCell: (record) => ({ record, inputType: "text", dataIndex: "compatibility", title: "适用车型", editing: isEditing(record) }),
      },
      {
        title: "操作",
        dataIndex: "operation",
        width: 120,
        align: "center",
        render: (_: any, record: Part) => {
          const editable = isEditing(record);
          return editable ? (
            <Space size={4}>
              <Button
                type="link"
                icon={<SaveOutlined />}
                onClick={() => save(record.key)}
                style={{ padding: 0 }}
                size="small"
              >
                保存
              </Button>
              <Button
                type="link"
                icon={<CloseOutlined />}
                onClick={cancel}
                style={{ padding: 0, color: "#666" }}
                size="small"
              >
                取消
              </Button>
            </Space>
          ) : (
            <Space size={4}>
              <Button
                type="link"
                icon={<EditOutlined />}
                disabled={editingKey !== ""}
                onClick={() => edit(record)}
                style={{ padding: 0 }}
                size="small"
              >
                编辑
              </Button>
              <Popconfirm
                title="确定删除?"
                onConfirm={() => handleDelete(record.key)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  icon={<DeleteOutlined />}
                  disabled={editingKey !== ""}
                  danger
                  style={{ padding: 0 }}
                  size="small"
                >
                  删除
                </Button>
              </Popconfirm>
            </Space>
          );
        },
      },
    ];
  };

  const columns = getColumns();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
      }}
    >
      {/* 使用 SvQuery 组件替换原有的查询区域 */}
      <SvQuery
        templateService={partsQueryTemplateService}
        fieldService={partsQueryFieldService}
        onSearch={handleSearch}
        onReset={handleReset}
        defaultExpanded={false}
        showTemplateManager={true}
        storageKey="partsManagement"
      />

      {/* 尺寸选择弹框 */}
      <SizeSelectModal
        open={sizeModalVisible}
        onCancel={() => setSizeModalVisible(false)}
        onOk={handleSizeSelect}
      />

      {/* 表格区域 */}
      <div
        ref={tableContainerRef}
        style={{
          padding: 16,
          background: "#fff",
          borderRadius: 6,
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              disabled={editingKey !== ""}
            >
              新增配件
            </Button>
            {selectedRowKeys.length > 0 && (
              <>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleBatchDelete}
                  disabled={editingKey !== ""}
                >
                  批量删除
                </Button>
                <span style={{ color: "#666", fontSize: 14 }}>
                  已选择 {selectedRowKeys.length} 项
                </span>
              </>
            )}
          </Space>
        </div>

        <Form form={form} component={false}>
          <SvTable
            components={{
              body: {
                cell: (props: any) => (
                  <EditableCell {...props} handleSizeClick={openSizeModal} />
                ),
              },
            }}
            bordered
            dataSource={data}
            columns={columns as any}
            rowClassName="editable-row"
            rowSelection={rowSelection}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            loading={loading}
            onChange={handleTableChange}
            scroll={{ x: 1200, y: tableScrollY }}
            size="small"
          />
        </Form>
      </div>
    </div>
  );
};

export default PartsManagement;
