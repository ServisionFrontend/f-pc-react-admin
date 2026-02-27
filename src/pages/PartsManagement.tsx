import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  Button,
  Space,
  Input,
  InputNumber,
  Select,
  Tag,
  Popconfirm,
  Form,
  message,
  Row,
  Col,
  Tooltip,
  Modal,
  Badge,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import partsService, { Part } from "../services/partsService";
import { SvTable } from "../components";


// 可展开文本框组件 - 默认单行，聚焦时浮动展开为多行
interface ExpandableTextAreaProps {
  value?: string;
  onChange?: (value: string) => void;
}

const ExpandableTextArea: React.FC<ExpandableTextAreaProps> = ({
  value,
  onChange,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      {/* 始终显示的单行输入框 */}
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        autoComplete="off"
        onFocus={() => setFocused(true)}
        style={{ opacity: focused ? 0 : 1 }}
      />
      {/* 浮动的多行文本框 */}
      {focused && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: "#fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            borderRadius: 6,
          }}
        >
          <Input.TextArea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            autoSize={{ minRows: 3, maxRows: 6 }}
            autoComplete="off"
            style={{ resize: "none" }}
            onBlur={() => setFocused(false)}
            autoFocus
          />
        </div>
      )}
    </div>
  );
};

// 尺寸选择弹框组件
interface SizeSelectModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: (selectedSize: string) => void;
}

const SizeSelectModal: React.FC<SizeSelectModalProps> = ({
  open,
  onCancel,
  onOk,
}) => {
  const [selectedSizeKey, setSelectedSizeKey] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState("");
  const [dataSource] = useState([
    { key: "1", size: "M6x20mm", description: "标准螺丝尺寸" },
    { key: "2", size: "φ10x2mm", description: "常用垫片尺寸" },
    { key: "3", size: "M8", description: "标准弹簧垫圈" },
    { key: "4", size: "M10", description: "六角螺母标准" },
    { key: "5", size: "M12x24x2.5mm", description: "高强度平垫圈" },
    { key: "6", size: "M8x30mm", description: "内六角螺栓标准" },
  ]);

  const handleSearch = () => {
    // 简单模拟搜索
    // 实际场景可能是重新请求接口或者前端过滤
    // 这里演示前端过滤
    console.log("searching for:", searchText);
  };

  const filteredData = dataSource.filter(
    (item) =>
      item.size.toLowerCase().includes(searchText.toLowerCase()) ||
      item.description.includes(searchText),
  );

  const columns = [
    { title: "序号", dataIndex: "key", width: 60 },
    { title: "尺寸", dataIndex: "size", width: 120 },
    { title: "描述", dataIndex: "description" },
  ];

  const rowSelection = {
    type: "radio" as const,
    selectedRowKeys: selectedSizeKey,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedSizeKey(selectedRowKeys);
    },
  };

  const handleOk = () => {
    if (selectedSizeKey.length === 0) {
      message.warning("请选择一个尺寸");
      return;
    }
    const selectedItem = dataSource.find(
      (item) => item.key === selectedSizeKey[0],
    );
    if (selectedItem) {
      onOk(selectedItem.size);
    }
  };

  // 每次打开重置选中状态
  useEffect(() => {
    if (open) {
      setSelectedSizeKey([]);
      setSearchText("");
    }
  }, [open]);

  return (
    <Modal
      title="选择尺寸"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      width={600}
      destroyOnClose
    >
      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <Input
          placeholder="输入尺寸或描述搜索"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
          onPressEnter={handleSearch}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          查询
        </Button>
      </div>
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={filteredData}
        size="small"
        pagination={false}
        scroll={{ y: 300 }}
        onRow={(record) => ({
          onClick: () => setSelectedSizeKey([record.key]),
        })}
      />
    </Modal>
  );
};

// 可编辑单元格组件
interface EditableCellProps {
  editing: boolean;
  dataIndex: string;
  title: string;
  inputType: "text" | "textarea" | "number" | "select";
  record: Part;
  options?: { label: string; value: string }[];
  children: React.ReactNode;
  handleSizeClick?: (record: Part) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  options,
  children,
  handleSizeClick,
  ...restProps
}) => {
  let inputNode;
  if (inputType === "number") {
    inputNode = (
      <InputNumber style={{ width: "100%" }} min={0} autoComplete="off" />
    );
  } else if (inputType === "select" && options) {
    inputNode = <Select options={options} style={{ width: "100%" }} />;
  } else if (inputType === "textarea") {
    inputNode = <ExpandableTextArea />;
  } else if (dataIndex === "size") {
    // 尺寸字段特殊处理，添加后缀图标
    inputNode = (
      <Input
        autoComplete="off"
        suffix={
          <SearchOutlined
            style={{ cursor: "pointer", color: "#1890ff" }}
            onClick={() => handleSizeClick && handleSizeClick(record)}
          />
        }
      />
    );
  } else {
    inputNode = <Input autoComplete="off" />;
  }

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          rules={[{ required: !["remark"].includes(dataIndex) }]}
          noStyle
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

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
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [data, setData] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isAdding, setIsAdding] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [sortParams, setSortParams] = useState<{
    field?: string;
    order?: string;
  }>({});

  // 计算已填写的查询条件数量
  const getFilledFieldsCount = () => {
    const values = searchForm.getFieldsValue();
    return Object.values(values).filter(
      (value) => value !== undefined && value !== null && value !== ""
    ).length;
  };

  const [filledCount, setFilledCount] = useState(0);

  // 监听表单变化更新计数
  useEffect(() => {
    const updateCount = () => {
      setFilledCount(getFilledFieldsCount());
    };
    updateCount();
  }, [searchForm]);


  // 尺寸弹框状态
  const [sizeModalVisible, setSizeModalVisible] = useState(false);
  // 当前正在编辑的行key，用于回填尺寸
  // 注意：editingKey 已经是 state 了，但我们需要知道当前是哪一行触发了弹框，
  // 虽然通常就是 editingKey 对应的行，但为了保险起见还是记录一下或者直接用 editingKey

  const handleSizeSelect = (selectedSize: string) => {
    // 将选中的尺寸回填到 Form 中
    form.setFieldsValue({
      size: selectedSize,
    });
    setSizeModalVisible(false);
  };

  const openSizeModal = () => {
    setSizeModalVisible(true);
  };

  const isEditing = (record: Part) => record.key === editingKey;

  // 表格容器 ref，用于获取表格位置和高度
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const [tableScrollY, setTableScrollY] = useState<number>(400);

  // 动态计算表格高度
  useEffect(() => {
    if (!tableContainerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // addButton: 32px + 12px = 44px
        // padding/margin: ~32px
        // pagination: ~64px (24px height + 16px margin + buffer)
        // table header: ~39px
        // table outer border: ~2px
        // target roughly height - 150px
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

  // 搜索
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData({ ...values, page: 1 });
  };

  // 重置
  const handleReset = () => {
    searchForm.resetFields();
    setSortParams({});
    setPagination((prev) => ({ ...prev, current: 1 }));
    setFilledCount(0); // 重置计数
    fetchData({ page: 1, sortField: undefined, sortOrder: undefined });
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
    // 如果 order 为空，说明取消了排序
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
      ...searchForm.getFieldsValue(),
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



  // 查询字段配置 - 包含所有列表字段
  const searchFields = [
    { name: "partNo", label: "配件编号", type: "input" },
    { name: "partName", label: "配件名称", type: "input" },
    { name: "partNameEn", label: "英文名称", type: "input" },
    { name: "size", label: "尺寸", type: "input" },
    { name: "section", label: "科组", type: "select", options: sectionOptions },
    { name: "quantity", label: "用量", type: "number" },
    { name: "status", label: "状态", type: "select", options: statusOptions },
    { name: "remark", label: "备注", type: "input" },
    { name: "manufacturer", label: "制造商", type: "input" },
    { name: "material", label: "材质", type: "input" },
    { name: "weight", label: "重量(g)", type: "number" },
    { name: "price", label: "单价(元)", type: "number" },
    { name: "supplier", label: "供应商", type: "input" },
    { name: "level", label: "等级", type: "select", options: levelOptions },
    { name: "color", label: "颜色", type: "input" },
    { name: "unit", label: "单位", type: "input" },
    { name: "productionDate", label: "生产日期", type: "input" },
    { name: "validityPeriod", label: "有效期(月)", type: "number" },
    { name: "version", label: "版本", type: "input" },
    { name: "safetyStock", label: "安全库存", type: "number" },
    { name: "maxStock", label: "最大库存", type: "number" },
    { name: "location", label: "存放位置", type: "input" },
    { name: "inspector", label: "检验员", type: "input" },
    { name: "certNo", label: "合格证号", type: "input" },
    { name: "drawingNo", label: "图纸号", type: "input" },
    { name: "batchNo", label: "批次号", type: "input" },
    { name: "isFragile", label: "是否易碎", type: "select", options: fragileOptions },
    { name: "compatibility", label: "适用车型", type: "input" },
  ];

  // 展开时显示全部字段，收起时也显示全部字段（通过CSS控制显示行数）
  const visibleFields = searchFields;
  const hasMoreFields = searchFields.length > 6; // 假设一行能放6个左右

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
      }}
    >

      {/* 搜索区域 */}
      <div
        style={{
          padding: 16,
          background: "#fff",
          marginBottom: 12,
          borderRadius: 6,
          flexShrink: 0,
        }}
      >
        <Form
          form={searchForm}
          layout="vertical"
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          onValuesChange={() => setFilledCount(getFilledFieldsCount())}
        >
          <div style={{ position: "relative" }}>
            {/* 字段区域 */}
            <div style={{ paddingRight: 280 }}>
              <Row
                gutter={[16, 8]}
                style={{
                  maxHeight: expanded ? "none" : "56px",
                  overflow: "hidden",
                  transition: "max-height 0.3s ease",
                }}
              >
                {visibleFields.map((field) => (
                  <Col key={field.name} xs={24} sm={12} md={8} lg={6} xl={4}>
                    <Form.Item
                      name={field.name}
                      label={field.label}
                      style={{ marginBottom: 8 }}
                    >
                      {field.type === "select" ? (
                        <Select
                          placeholder="请选择"
                          allowClear
                          options={field.options}
                          style={{ width: "100%" }}
                        />
                      ) : field.type === "number" ? (
                        <InputNumber
                          placeholder="请输入"
                          style={{ width: "100%" }}
                          min={0}
                          autoComplete="off"
                        />
                      ) : (
                        <Input placeholder="请输入" allowClear autoComplete="off" />
                      )}
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </div>
            {/* 按钮区域 - 绝对定位固定在右上角 */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                display: "flex",
                alignItems: "flex-end",
                paddingBottom: 8,
                height: 56,
              }}
            >
              <Space>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                  loading={loading}
                >
                  查询
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
                {hasMoreFields && (
                  <Badge count={filledCount} offset={[-9, -8]}>
                    <Button
                      onClick={() => setExpanded(!expanded)}
                      icon={expanded ? <UpOutlined /> : <DownOutlined />}
                      iconPosition="start"
                    >
                      更多筛选
                    </Button>
                  </Badge>
                )}
              </Space>
            </div>
          </div>
        </Form>
      </div>

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
        <div style={{ marginBottom: 12 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            disabled={editingKey !== ""}
          >
            新增配件
          </Button>
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
