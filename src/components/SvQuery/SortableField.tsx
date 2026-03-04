import React, { useEffect } from "react";
import { Form, Col, Select, InputNumber, DatePicker, Input } from "antd";
import { HolderOutlined, DeleteOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const { RangePicker } = DatePicker;

// 可拖拽的查询字段组件
export interface SortableFieldProps {
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

export const SortableField: React.FC<SortableFieldProps> = ({
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

    // 监听字段值的变化
    const fieldValue = Form.useWatch(field.name);

    // 当字段值变化时，自动更新 checkbox 状态
    useEffect(() => {
        if (showCheckbox && onCheckChange) {
            // 判断值是否为空
            const isEmpty =
                fieldValue === undefined ||
                fieldValue === null ||
                fieldValue === '' ||
                (Array.isArray(fieldValue) && fieldValue.length === 0);

            // 如果值不为空且未选中，自动选中
            if (!isEmpty && !isChecked) {
                onCheckChange(true);
            }
            // 如果值为空且已选中，自动取消选中
            else if (isEmpty && isChecked) {
                onCheckChange(false);
            }
        }
    }, [fieldValue, showCheckbox, isChecked, onCheckChange]);

    const style = {
        // 只对正在拖动的字段应用 transform，其他字段保持原位
        transform: isActiveField ? undefined : CSS.Transform.toString(transform),
        transition: isActiveField ? undefined : transition,
    };

    return (
        <Col
            ref={setNodeRef}
            style={{ ...style, width: 220 }}
            flex="0 0 220px"
        >
            <div
                style={{
                    position: "relative",
                    opacity: isActiveField ? 0 : 1, // 拖动的字段完全隐藏
                    border: isOverField ? "2px dashed #4E5358" : "none", // 只在目标位置显示虚线
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
                                    style={{ cursor: "grab", color: "#4E5358", fontSize: 14 }}
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
