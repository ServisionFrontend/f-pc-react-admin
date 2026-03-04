import React from "react";
import { Form, InputNumber, Select, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { Part } from "../service";
import { ExpandableTextArea } from "./ExpandableTextArea";

// 可编辑单元格组件
export interface EditableCellProps {
    editing: boolean;
    dataIndex: string;
    title: string;
    inputType: "text" | "textarea" | "number" | "select";
    record: Part;
    options?: { label: string; value: string }[];
    children: React.ReactNode;
    handleSizeClick?: (record: Part) => void;
}

export const EditableCell: React.FC<EditableCellProps> = ({
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
            <InputNumber style={{ width: "100%", height: "32px" }} min={0} autoComplete="off" />
        );
    } else if (inputType === "select" && options) {
        inputNode = <Select options={options} style={{ width: "100%", height: "32px" }} />;
    } else if (inputType === "textarea") {
        inputNode = <ExpandableTextArea />;
    } else if (dataIndex === "size") {
        // 尺寸字段特殊处理，添加后缀图标
        inputNode = (
            <Input
                autoComplete="off"
                style={{ height: "32px" }}
                suffix={
                    <SearchOutlined
                        style={{ cursor: "pointer", color: "#1890ff" }}
                        onClick={() => handleSizeClick && handleSizeClick(record)}
                    />
                }
            />
        );
    } else {
        inputNode = <Input autoComplete="off" style={{ height: "32px" }} />;
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
