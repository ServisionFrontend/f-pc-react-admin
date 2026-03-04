import React, { useState, useRef } from "react";
import { App, Input, Space } from "antd";
import {
    EditOutlined,
    PushpinFilled,
    PushpinOutlined,
    HolderOutlined,
    CheckOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// 可拖拽的查询方案菜单项组件
export interface SortableSchemeItemProps {
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

export const SortableSchemeItem: React.FC<SortableSchemeItemProps> = ({
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
                                <CheckOutlined style={{ color: "#4E5358", fontSize: 14 }} />
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
                                style={{ color: "#4E5358", fontSize: 16, cursor: "pointer" }}
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
