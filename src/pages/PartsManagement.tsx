import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
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
  App,
  Row,
  Col,
  Tooltip,
  Modal,
  Badge,
  Dropdown,
  DatePicker,
  Divider,
} from "antd";
const { RangePicker } = DatePicker;
import dayjs from 'dayjs';
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
  PushpinOutlined,
  UndoOutlined,
  HolderOutlined,
  CheckOutlined,
  PushpinFilled,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import partsService, { Part } from "../services/partsService";
import { SvTable } from "../components";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";


// 可拖拽的查询方案菜单项组件
interface SortableSchemeItemProps {
  search: { name: string; conditions: any; fields?: string[]; isDefault?: boolean };
  index: number;
  currentScheme: string;
  defaultScheme: string | null;
  onLoad: () => void;
  onSetDefault: () => void;
  onCancelDefault: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
}

const SortableSchemeItem: React.FC<SortableSchemeItemProps> = ({
  search,
  index,
  currentScheme,
  defaultScheme,
  onLoad,
  onSetDefault,
  onCancelDefault,
  onDelete,
  onRename,
}) => {
  const { message } = App.useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(search.name);
  const inputRef = useRef<any>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `scheme-${index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 开始编辑
  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(search.name);
    // 延迟聚焦，确保输入框已渲染
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  // 保存编辑
  const handleSaveEdit = () => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      message.warning("方案名称不能为空");
      return;
    }
    if (trimmedName !== search.name) {
      onRename(trimmedName);
    }
    setIsEditing(false);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(search.name);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={isEditing ? undefined : onLoad}
      className="scheme-menu-item"
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minWidth: 240,
          gap: 8,
          padding: "5px 12px",
          cursor: isEditing ? "default" : "pointer",
          backgroundColor: "transparent",
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!isEditing) {
            e.currentTarget.style.backgroundColor = "#f5f5f5";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          {/* 拖拽手柄 */}
          {!isEditing && (
            <HolderOutlined
              {...attributes}
              {...listeners}
              style={{ cursor: "grab", color: "#8c8c8c", fontSize: 14 }}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {/* 选中图标 */}
          {!isEditing && (
            <>
              {currentScheme === search.name ? (
                <CheckOutlined style={{ color: "#1890ff", fontSize: 14 }} />
              ) : search.name === defaultScheme ? (
                <PushpinFilled style={{ color: "#faad14", fontSize: 14 }} />
              ) : (
                <PushpinOutlined style={{ color: "#d9d9d9", fontSize: 14 }} />
              )}
            </>
          )}
          {/* 方案名称或编辑输入框 */}
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onPressEnter={handleSaveEdit}
              onBlur={handleSaveEdit}
              onClick={(e) => e.stopPropagation()}
              style={{ flex: 1 }}
              size="small"
            />
          ) : (
            <span
              style={{
                flex: 1,
                fontWeight: currentScheme === search.name ? 600 : 400,
              }}
            >
              {search.name}
            </span>
          )}
        </div>
        <Space size={4} onClick={(e) => e.stopPropagation()}>
          {!isEditing && (
            <>
              {/* 编辑按钮 */}
              <EditOutlined
                style={{ color: "#1890ff", fontSize: 16, cursor: "pointer" }}
                onClick={handleStartEdit}
                title="重命名"
              />
              {/* 设置/取消默认按钮 */}
              {search.name === defaultScheme ? (
                <PushpinFilled
                  style={{ color: "#faad14", fontSize: 16, cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelDefault();
                  }}
                  title="取消默认"
                />
              ) : (
                <PushpinOutlined
                  style={{ color: "#8c8c8c", fontSize: 16, cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetDefault();
                  }}
                  title="设置为默认"
                />
              )}
              {/* 删除按钮 */}
              <DeleteOutlined
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                style={{
                  color: "#ff4d4f",
                  fontSize: 16,
                  cursor: "pointer",
                }}
                title="删除"
              />
            </>
          )}
        </Space>
      </div>
    </div>
  );
};


// 可拖拽的查询字段组件
interface SortableFieldProps {
  field: any;
  isEditing: boolean;
  onDelete: () => void;
  isActiveField: boolean; // 是否是正在拖动的字段
  isOverField: boolean; // 是否是目标悬停位置
  showCheckbox?: boolean; // 是否显示复选框
  isChecked?: boolean; // 是否选中
  onCheckChange?: (checked: boolean) => void; // 复选框变化回调
  disableInput?: boolean; // 是否禁用输入框
}

const SortableField: React.FC<SortableFieldProps> = ({
  field,
  isEditing,
  onDelete,
  isActiveField,
  isOverField,
  showCheckbox = false,
  isChecked = false,
  onCheckChange,
  disableInput = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: field.name,
    // 禁用动画过渡，防止其他字段自动移动
    animateLayoutChanges: () => false,
  });

  const style = {
    // 只对正在拖动的字段应用 transform，其他字段保持原位
    transform: isActiveField ? undefined : CSS.Transform.toString(transform),
    transition: isActiveField ? undefined : transition,
  };

  return (
    <Col
      ref={setNodeRef}
      style={style}
      xs={24}
      sm={12}
      md={8}
      lg={6}
      xl={4}
    >
      <div
        style={{
          position: "relative",
          opacity: isActiveField ? 0 : 1, // 拖动的字段完全隐藏
          border: isOverField ? "2px dashed #1890ff" : "none", // 只在目标位置显示虚线
          borderRadius: 6,
          padding: isOverField ? 4 : 0,
          backgroundColor: isOverField ? "#f0f5ff" : "transparent", // 只在目标位置显示背景
          minHeight: 56,
        }}
      >
        <Form.Item
          name={field.name}
          label={
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {isEditing && (
                <HolderOutlined
                  {...attributes}
                  {...listeners}
                  style={{ cursor: "grab", color: "#1890ff", fontSize: 14 }}
                />
              )}
              <span>{field.label}</span>
              {showCheckbox && (
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => onCheckChange?.(e.target.checked)}
                  style={{ marginLeft: 8, cursor: "pointer" }}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
          }
          style={{ marginBottom: 8 }}
        >
          {field.type === "select" ? (
            <Select
              placeholder="请选择"
              allowClear
              options={field.options}
              style={{ width: "100%" }}
              disabled={disableInput}
            />
          ) : field.type === "number" ? (
            <InputNumber
              placeholder="请输入"
              style={{ width: "100%" }}
              min={0}
              autoComplete="off"
              disabled={disableInput}
            />
          ) : field.type === "dateRange" ? (
            <RangePicker
              placeholder={["开始日期", "结束日期"]}
              style={{ width: "100%" }}
              disabled={disableInput}
              format="YYYY-MM-DD"
            />
          ) : (
            <Input
              placeholder="请输入"
              allowClear
              autoComplete="off"
              disabled={disableInput}
            />
          )}
        </Form.Item>
        {isEditing && !showCheckbox && (
          <DeleteOutlined
            onClick={onDelete}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              color: "#ff4d4f",
              cursor: "pointer",
              fontSize: 16,
              zIndex: 1,
            }}
          />
        )}
      </div>
    </Col>
  );
};


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
  const inputRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (focused && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [focused]);

  return (
    <>
      <div ref={inputRef} style={{ position: "relative" }}>
        {/* 始终显示的单行输入框 */}
        <Input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          autoComplete="off"
          onFocus={() => setFocused(true)}
          style={{ opacity: focused ? 0 : 1 }}
        />
      </div>
      {/* 浮动的多行文本框 - 使用 Portal 渲染到 body */}
      {focused &&
        ReactDOM.createPortal(
          <div
            style={{
              position: "absolute",
              top: position.top,
              left: position.left,
              width: position.width,
              zIndex: 9999,
              background: "#fff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              borderRadius: 0,
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
          </div>,
          document.body
        )}
    </>
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
  const { message } = App.useApp();
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
      destroyOnHidden
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

// 全部查询条件常量
const ALL_FIELDS_SCHEME = "全部";

const PartsManagement: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [data, setData] = useState<Part[]>([]);
  const searchNameInputRef = useRef<any>(null);
  const hasLoadedDefaultScheme = useRef(false); // 标记是否已加载默认方案
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

  // 多选功能
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

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
          // 这里应该调用批量删除接口，暂时用循环删除模拟
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
    // 编辑状态下禁用选择
    getCheckboxProps: (record: Part) => ({
      disabled: editingKey !== "",
    }),
  };

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

  // 保存的查询条件
  const [savedSearches, setSavedSearches] = useState<
    Array<{ name: string; conditions: any; fields?: string[]; isDefault?: boolean }>
  >([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [currentScheme, setCurrentScheme] = useState<string>(ALL_FIELDS_SCHEME); // 当前选中的查询方案名称，默认为"全部查询条件"
  const [defaultScheme, setDefaultScheme] = useState<string | null>(null); // 默认查询方案名称

  // 从 localStorage 加载保存的查询条件
  useEffect(() => {
    const saved = localStorage.getItem("partsManagement_savedSearches");
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved searches:", e);
      }
    }

    // 加载默认方案
    const defaultSchemeName = localStorage.getItem("partsManagement_defaultScheme");
    if (defaultSchemeName) {
      setDefaultScheme(defaultSchemeName);
    }
  }, []);

  // 保存查询条件
  const handleSaveSearch = () => {
    const searchName = searchNameInputRef.current?.input?.value?.trim() || "";

    if (!searchName) {
      message.warning("请输入查询条件名称");
      return;
    }

    // 如果当前是"全部查询条件"且在编辑模式，检查是否有选中字段
    if (currentScheme === ALL_FIELDS_SCHEME && isEditingFields) {
      if (selectedFieldNames.length === 0) {
        message.warning("请至少选择一个字段");
        return;
      }
    }

    const conditions = searchForm.getFieldsValue();

    // 处理日期范围，转换为字符串以便保存到localStorage
    const processedConditions = { ...conditions };
    if (processedConditions.productionDate && Array.isArray(processedConditions.productionDate)) {
      processedConditions.productionDate = processedConditions.productionDate.map((date: any) => {
        if (date && typeof date.format === 'function') {
          return date.format('YYYY-MM-DD');
        }
        return date;
      });
    }

    // 确定要保存的字段列表和条件
    let fieldsToSave: string[];
    let conditionsToSave: any;

    if (currentScheme === ALL_FIELDS_SCHEME && isEditingFields && selectedFieldNames.length > 0) {
      // 如果在"全部查询条件"且编辑模式下，使用选中的字段
      fieldsToSave = selectedFieldNames;
      // 只保存选中字段的条件值
      conditionsToSave = {};
      selectedFieldNames.forEach((fieldName) => {
        if (processedConditions[fieldName] !== undefined) {
          conditionsToSave[fieldName] = processedConditions[fieldName];
        }
      });
    } else {
      // 否则保存当前使用的字段列表
      const usedFields = Object.keys(conditions).filter(
        (key) => conditions[key] !== undefined && conditions[key] !== null && conditions[key] !== ""
      );
      // 如果没有填写查询条件，则保存所有当前显示的字段
      fieldsToSave = usedFields.length > 0 ? usedFields : searchFields.map((f) => f.name);
      conditionsToSave = processedConditions;
    }

    const newSearch = {
      name: searchName,
      conditions: conditionsToSave,
      fields: fieldsToSave // 保存字段列表
    };
    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);
    localStorage.setItem("partsManagement_savedSearches", JSON.stringify(updated));
    message.success("查询条件已保存");
    setSaveModalVisible(false);
    setSearchName(""); // 清空state（虽然不再使用，但保留以防其他地方使用）

    // 清空选中的字段
    setSelectedFieldNames([]);

    // 自动切换到新保存的查询方案
    setTimeout(() => {
      handleLoadSearch(newSearch);
    }, 100);
  };

  // 加载已保存的查询条件
  const handleLoadSearch = (search: { name: string; conditions: any; fields?: string[] }) => {
    const { name, conditions, fields } = search;

    // 如果正在编辑字段，自动关闭编辑状态
    if (isEditingFields) {
      setIsEditingFields(false);
      setSelectedFieldNames([]);
    }

    // 设置当前查询方案
    setCurrentScheme(name);

    // 清空选中的字段
    setSelectedFieldNames([]);

    // 如果方案中保存了字段列表，按照保存的顺序显示这些字段
    if (fields && fields.length > 0) {
      // 按照保存的字段顺序重新构建字段数组
      const schemeFields = fields
        .map((fieldName) => defaultSearchFields.find((f) => f.name === fieldName))
        .filter((f) => f !== undefined) as typeof defaultSearchFields;
      setSearchFields(schemeFields);
    } else {
      // 兼容旧版本：获取查询方案中包含的字段名称
      const conditionFields = Object.keys(conditions).filter(
        (key) => conditions[key] !== undefined && conditions[key] !== null && conditions[key] !== ""
      );

      // 检查这些字段是否在当前的 searchFields 中
      const currentFieldNames = searchFields.map((f) => f.name);
      const missingFields = conditionFields.filter(
        (fieldName) => !currentFieldNames.includes(fieldName)
      );

      // 如果有缺失的字段，需要恢复
      if (missingFields.length > 0) {
        const missingFieldObjects = defaultSearchFields.filter((f) =>
          missingFields.includes(f.name)
        );

        // 将缺失的字段添加回来
        const restoredFields = [...searchFields, ...missingFieldObjects];
        setSearchFields(restoredFields);

        message.info(
          `已自动恢复 ${missingFieldObjects.map((f) => f.label).join("、")} 字段`
        );
      }
    }

    // 处理日期范围字段，将字符串转换为dayjs对象
    const processedConditions = { ...conditions };
    if (processedConditions.productionDate && Array.isArray(processedConditions.productionDate)) {
      processedConditions.productionDate = processedConditions.productionDate.map((dateStr: any) => {
        if (typeof dateStr === 'string') {
          return dayjs(dateStr);
        }
        return dateStr;
      });
    }

    // 填充查询条件
    searchForm.setFieldsValue(processedConditions);

    // 使用 setTimeout 确保表单值更新后再计算
    setTimeout(() => {
      setFilledCount(getFilledFieldsCount());
    }, 0);

    // 自动展开以显示所有字段
    setExpanded(true);

    // 自动执行查询
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData({ ...conditions, page: 1 });

    message.success(`已加载查询方案: ${name}`);
  };

  // 切换到全部查询条件
  const handleLoadAllFields = () => {
    // 如果正在编辑字段，自动关闭编辑状态
    if (isEditingFields) {
      setIsEditingFields(false);
    }

    setCurrentScheme(ALL_FIELDS_SCHEME);
    setSearchFields(defaultSearchFields);
    // 清除localStorage中的字段配置，确保"全部查询条件"始终显示所有字段
    localStorage.removeItem("partsManagement_searchFields");
    searchForm.resetFields();
    setFilledCount(0);
    setSelectedFieldNames([]); // 清空选中的字段
    message.success("已切换到全部查询条件");
  };

  // 处理查询方案拖拽排序
  const handleSchemeReorder = (oldIndex: number, newIndex: number) => {
    const newSearches = arrayMove(savedSearches, oldIndex, newIndex);
    setSavedSearches(newSearches);
    localStorage.setItem("partsManagement_savedSearches", JSON.stringify(newSearches));
  };

  // 删除已保存的查询条件
  const handleDeleteSearch = (index: number) => {
    const deletedSearch = savedSearches[index];
    const updated = savedSearches.filter((_, i) => i !== index);
    setSavedSearches(updated);
    localStorage.setItem("partsManagement_savedSearches", JSON.stringify(updated));

    // 如果删除的是当前方案，切换到"全部查询条件"
    if (deletedSearch.name === currentScheme) {
      setCurrentScheme(ALL_FIELDS_SCHEME);
      setSearchFields(defaultSearchFields);
      searchForm.resetFields();
      message.info("已切换到全部查询条件");
    }

    // 如果删除的是默认方案，清除默认方案设置
    if (deletedSearch.name === defaultScheme) {
      setDefaultScheme(null);
      localStorage.removeItem("partsManagement_defaultScheme");
    }

    message.success("已删除");
  };

  // 重命名查询方案
  const handleRenameScheme = (index: number, newName: string) => {
    const oldName = savedSearches[index].name;

    // 检查新名称是否与其他方案重复
    const isDuplicate = savedSearches.some((s, i) => i !== index && s.name === newName);
    if (isDuplicate) {
      message.warning("方案名称已存在");
      return;
    }

    const updated = [...savedSearches];
    updated[index] = { ...updated[index], name: newName };
    setSavedSearches(updated);
    localStorage.setItem("partsManagement_savedSearches", JSON.stringify(updated));

    // 如果重命名的是当前方案，更新当前方案名称
    if (oldName === currentScheme) {
      setCurrentScheme(newName);
    }

    // 如果重命名的是默认方案，更新默认方案名称
    if (oldName === defaultScheme) {
      setDefaultScheme(newName);
      localStorage.setItem("partsManagement_defaultScheme", newName);
    }

    message.success("重命名成功");
  };

  // 设置默认查询方案
  const handleSetDefaultScheme = (schemeName: string) => {
    setDefaultScheme(schemeName);
    localStorage.setItem("partsManagement_defaultScheme", schemeName);
    message.success(`已设置"${schemeName}"为默认方案`);
  };

  // 取消默认查询方案
  const handleCancelDefaultScheme = () => {
    setDefaultScheme(null);
    localStorage.removeItem("partsManagement_defaultScheme");
    message.success("已取消默认方案");
  };

  // 页面加载时自动应用默认方案
  useEffect(() => {
    // 只在首次加载时应用默认方案，避免保存新方案时触发
    if (hasLoadedDefaultScheme.current) {
      return;
    }

    if (defaultScheme && savedSearches.length > 0) {
      const defaultSearch = savedSearches.find((s) => s.name === defaultScheme);
      if (defaultSearch) {
        // 延迟加载，确保其他初始化完成
        setTimeout(() => {
          handleLoadSearch(defaultSearch);
          hasLoadedDefaultScheme.current = true; // 标记已加载
        }, 100);
      }
    }
  }, [defaultScheme, savedSearches.length]); // 只在defaultScheme或savedSearches加载完成时触发


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

    // 处理日期范围
    const searchParams = { ...values };
    if (values.productionDate && Array.isArray(values.productionDate) && values.productionDate.length === 2) {
      const [start, end] = values.productionDate;
      if (start && end && typeof start.format === 'function' && typeof end.format === 'function') {
        searchParams.productionDateStart = start.format('YYYY-MM-DD');
        searchParams.productionDateEnd = end.format('YYYY-MM-DD');
      }
      delete searchParams.productionDate;
    }

    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData({ ...searchParams, page: 1 });
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
  const defaultSearchFields = [
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
    { name: "productionDate", label: "生产日期", type: "dateRange" },
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

  // 查询字段编辑状态
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [searchFields, setSearchFields] = useState(defaultSearchFields);

  // 选中的字段（用于"全部查询条件"模式下保存查询方案）
  const [selectedFieldNames, setSelectedFieldNames] = useState<string[]>([]);

  // 保存编辑前的字段配置（用于取消编辑时恢复）
  const [fieldsBeforeEdit, setFieldsBeforeEdit] = useState<typeof defaultSearchFields>([]);

  // 从 localStorage 加载自定义字段配置（包括"全部查询条件"下的自定义排序）
  useEffect(() => {
    const saved = localStorage.getItem("partsManagement_searchFields");
    if (saved) {
      try {
        const savedFields = JSON.parse(saved);
        // 更新localStorage中的旧配置，将生产日期字段的type改为dateRange
        const updatedFields = savedFields.map((field: any) => {
          if (field.name === 'productionDate' && field.type === 'input') {
            return { ...field, type: 'dateRange' };
          }
          return field;
        });
        setSearchFields(updatedFields);
        // 保存更新后的配置
        localStorage.setItem("partsManagement_searchFields", JSON.stringify(updatedFields));
      } catch (e) {
        console.error("Failed to load search fields:", e);
      }
    }
  }, []);

  // 保存字段配置到 localStorage
  const saveFieldsConfig = (fields: typeof defaultSearchFields) => {
    setSearchFields(fields);

    // 如果当前是某个查询方案（不是"全部查询条件"），需要更新该方案的字段配置
    if (currentScheme !== ALL_FIELDS_SCHEME) {
      const schemeIndex = savedSearches.findIndex((s) => s.name === currentScheme);
      if (schemeIndex !== -1) {
        const updatedSearches = [...savedSearches];
        updatedSearches[schemeIndex] = {
          ...updatedSearches[schemeIndex],
          fields: fields.map((f) => f.name),
        };
        setSavedSearches(updatedSearches);
        localStorage.setItem("partsManagement_savedSearches", JSON.stringify(updatedSearches));
      }
    } else {
      // 如果是"全部查询条件"，保存到全局配置
      localStorage.setItem("partsManagement_searchFields", JSON.stringify(fields));
    }
  };

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 当前拖动的字段
  const [activeId, setActiveId] = useState<string | null>(null);
  // 当前悬停的目标字段
  const [overId, setOverId] = useState<string | null>(null);

  // 查询方案拖拽状态
  const [activeSchemeDragId, setActiveSchemeDragId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 处理拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // 处理拖拽悬停
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? (over.id as string) : null);
  };

  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = searchFields.findIndex((f) => f.name === active.id);
      const newIndex = searchFields.findIndex((f) => f.name === over.id);
      const newFields = arrayMove(searchFields, oldIndex, newIndex);
      saveFieldsConfig(newFields);
    }
    setActiveId(null);
    setOverId(null);
  };

  // 处理拖拽取消
  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  // 处理查询方案拖拽开始
  const handleSchemeDragStart = (event: DragStartEvent) => {
    setActiveSchemeDragId(event.active.id as string);
  };

  // 处理查询方案拖拽结束
  const handleSchemeDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = parseInt((active.id as string).replace('scheme-', ''));
      const newIndex = parseInt((over.id as string).replace('scheme-', ''));
      handleSchemeReorder(oldIndex, newIndex);
    }
    setActiveSchemeDragId(null);
  };

  // 处理查询方案拖拽取消
  const handleSchemeDragCancel = () => {
    setActiveSchemeDragId(null);
  };

  // 删除字段
  const handleDeleteField = (fieldName: string) => {
    const newFields = searchFields.filter((f) => f.name !== fieldName);
    saveFieldsConfig(newFields);
    message.success("已删除字段");
  };

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
        {/* 查询方案下拉菜单 - 显示在左上角 */}
        <div style={{ marginBottom: 12 }}>
          <Dropdown
            open={dropdownOpen}
            onOpenChange={setDropdownOpen}
            popupRender={() => (
              <div
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 6,
                  boxShadow: "0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08), 0 9px 28px 8px rgba(0,0,0,.05)",
                  minWidth: 240,
                }}
              >
                {/* 全部查询条件 - 固定不可拖拽 */}
                <div
                  onClick={() => {
                    handleLoadAllFields();
                    setDropdownOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 12px",
                    cursor: "pointer",
                    backgroundColor: "transparent",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {currentScheme === ALL_FIELDS_SCHEME ? (
                    <CheckOutlined style={{ color: "#1890ff", fontSize: 14 }} />
                  ) : (
                    <div style={{ width: 14 }}></div>
                  )}
                  <span
                    style={{
                      fontWeight: currentScheme === ALL_FIELDS_SCHEME ? 600 : 400,
                    }}
                  >
                    {ALL_FIELDS_SCHEME}
                  </span>
                </div>

                {/* 分隔线 */}
                {savedSearches.length > 0 && <Divider style={{ margin: "4px 0" }} />}

                {/* 可拖拽的查询方案列表 */}
                {savedSearches.length > 0 && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleSchemeDragStart}
                    onDragEnd={handleSchemeDragEnd}
                    onDragCancel={handleSchemeDragCancel}
                  >
                    <SortableContext
                      items={savedSearches.map((_, index) => `scheme-${index}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      {savedSearches.map((search, index) => (
                        <SortableSchemeItem
                          key={`scheme-${index}`}
                          search={search}
                          index={index}
                          currentScheme={currentScheme}
                          defaultScheme={defaultScheme}
                          onLoad={() => {
                            handleLoadSearch(search);
                            setDropdownOpen(false);
                          }}
                          onSetDefault={() => handleSetDefaultScheme(search.name)}
                          onCancelDefault={handleCancelDefaultScheme}
                          onDelete={() => handleDeleteSearch(index)}
                          onRename={(newName) => handleRenameScheme(index, newName)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            )}
            placement="bottomLeft"
            trigger={["click"]}
          >
            <Tag
              color="blue"
              style={{
                fontSize: 14,
                padding: "4px 12px",
                cursor: "pointer",
              }}
            >
              {currentScheme === defaultScheme &&
                currentScheme !== ALL_FIELDS_SCHEME ? (
                <PushpinFilled />
              ) : null}{" "}
              当前查询模板: {currentScheme}{" "}
              <DownOutlined style={{ fontSize: 10 }} />
            </Tag>
          </Dropdown>
        </div>

        <Form
          form={searchForm}
          layout="vertical"
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          onValuesChange={(changedValues) => {
            setFilledCount(getFilledFieldsCount());

            // 如果在"全部查询条件"且编辑模式下，当用户输入值时自动勾选对应的复选框
            if (currentScheme === ALL_FIELDS_SCHEME && isEditingFields) {
              Object.keys(changedValues).forEach((fieldName) => {
                const value = changedValues[fieldName];
                // 检查值是否有效（不为空、undefined、null）
                const hasValue = value !== undefined && value !== null && value !== "" &&
                  (Array.isArray(value) ? value.length > 0 : true);

                if (hasValue && !selectedFieldNames.includes(fieldName)) {
                  // 如果有值且未选中，自动勾选
                  setSelectedFieldNames([...selectedFieldNames, fieldName]);
                } else if (!hasValue && selectedFieldNames.includes(fieldName)) {
                  // 如果值被清空且已选中，取消勾选
                  setSelectedFieldNames(selectedFieldNames.filter((name) => name !== fieldName));
                }
              });
            }
          }}
        >
          {/* 字段区域 */}
          <div
            style={{
              maxHeight: expanded ? "none" : "56px",
              overflow: "hidden",
              transition: "max-height 0.3s ease",
            }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext
                items={visibleFields.map((f) => f.name)}
                strategy={verticalListSortingStrategy}
              >
                <Row gutter={[16, 8]}>
                  {visibleFields.map((field) => (
                    <SortableField
                      key={field.name}
                      field={field}
                      isEditing={isEditingFields}
                      onDelete={() => handleDeleteField(field.name)}
                      isActiveField={activeId === field.name}
                      isOverField={overId === field.name}
                      showCheckbox={currentScheme === ALL_FIELDS_SCHEME && isEditingFields}
                      isChecked={selectedFieldNames.includes(field.name)}
                      onCheckChange={(checked) => {
                        if (checked) {
                          setSelectedFieldNames([...selectedFieldNames, field.name]);
                        } else {
                          setSelectedFieldNames(selectedFieldNames.filter((name) => name !== field.name));
                        }
                      }}
                      disableInput={false}
                    />
                  ))}
                </Row>
              </SortableContext>
              {/* 拖动时的浮动预览 */}
              <DragOverlay>
                {activeId ? (
                  <div
                    style={{
                      backgroundColor: "#fff",
                      border: "2px solid #1890ff",
                      borderRadius: 6,
                      padding: 8,
                      boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
                      cursor: "grabbing",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <HolderOutlined style={{ color: "#1890ff", fontSize: 14 }} />
                      <span style={{ fontWeight: 500 }}>
                        {visibleFields.find((f) => f.name === activeId)?.label}
                      </span>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
          {/* 按钮区域 - 放在字段下方 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <Space>
              {hasMoreFields && (
                <Badge count={filledCount} offset={[0, 2]} style={{ zIndex: 999 }}>
                  <Button
                    onClick={() => setExpanded(!expanded)}
                    icon={expanded ? <UpOutlined /> : <DownOutlined />}
                    iconPlacement="start"
                    disabled={isEditingFields}
                    style={{ marginRight: 8 }}
                  >
                    更多筛选
                  </Button>
                </Badge>
              )}
              {/* 编辑/恢复按钮 */}
              {isEditingFields ? (
                <>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => {
                      setIsEditingFields(false);
                      setSelectedFieldNames([]); // 清空选中的字段

                      // 如果当前不是"全部查询条件"，需要保存查询条件的值到方案中
                      if (currentScheme !== ALL_FIELDS_SCHEME) {
                        const schemeIndex = savedSearches.findIndex((s) => s.name === currentScheme);
                        if (schemeIndex !== -1) {
                          const conditions = searchForm.getFieldsValue();

                          // 处理日期范围，转换为字符串以便保存到localStorage
                          const processedConditions = { ...conditions };
                          if (processedConditions.productionDate && Array.isArray(processedConditions.productionDate)) {
                            processedConditions.productionDate = processedConditions.productionDate.map((date: any) => {
                              if (date && typeof date.format === 'function') {
                                return date.format('YYYY-MM-DD');
                              }
                              return date;
                            });
                          }

                          const updatedSearches = [...savedSearches];
                          updatedSearches[schemeIndex] = {
                            ...updatedSearches[schemeIndex],
                            conditions: processedConditions,
                          };
                          setSavedSearches(updatedSearches);
                          localStorage.setItem("partsManagement_savedSearches", JSON.stringify(updatedSearches));
                        }
                      } else {
                        // "全部查询条件"模式：保存当前字段排列顺序到 localStorage
                        localStorage.setItem("partsManagement_searchFields", JSON.stringify(searchFields));
                      }

                      message.success("已保存字段配置");
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    保成编辑
                  </Button>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={() => {
                      // 恢复到编辑前的字段配置
                      setSearchFields([...fieldsBeforeEdit]);
                      setIsEditingFields(false);
                      setSelectedFieldNames([]); // 清空选中的字段
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    取消编辑
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => {
                      // 保存编辑前的字段配置
                      setFieldsBeforeEdit([...searchFields]);
                      setIsEditingFields(true);
                      setExpanded(true); // 编辑时自动展开
                      // 如果是"全部查询条件"，不默认选中任何字段
                      if (currentScheme === ALL_FIELDS_SCHEME) {
                        setSelectedFieldNames([]);
                      }
                    }}
                  >
                    编辑字段
                  </Button>
                </>
              )}
            </Space>
            <Space>
              {/* 保存查询方案按钮 - 只在"全部查询条件"时显示 */}
              {currentScheme === ALL_FIELDS_SCHEME && (
                <Button
                  icon={<SaveOutlined />}
                  onClick={() => setSaveModalVisible(true)}
                  disabled={isEditingFields && selectedFieldNames.length === 0}
                >
                  保存查询模板
                </Button>
              )}
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={loading}
                disabled={isEditingFields}
              >
                查询
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                disabled={isEditingFields}
              >
                重置
              </Button>
            </Space>
          </div>
        </Form>
      </div>

      {/* 保存查询条件弹窗 */}
      <Modal
        title="保存查询条件"
        open={saveModalVisible}
        onOk={handleSaveSearch}
        onCancel={() => {
          setSaveModalVisible(false);
          setSearchName("");
        }}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form layout="vertical">
          <Form.Item label="查询条件名称" required>
            <Input
              ref={searchNameInputRef}
              placeholder="请输入查询条件名称"
              onPressEnter={handleSaveSearch}
              autoFocus
            />
          </Form.Item>
        </Form>
      </Modal>

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
