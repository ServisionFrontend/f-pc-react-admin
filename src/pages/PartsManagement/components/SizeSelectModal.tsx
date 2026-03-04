import React, { useState, useEffect } from "react";
import { Modal, Input, Button, Table, App } from "antd";
import { SearchOutlined } from "@ant-design/icons";

// 尺寸选择弹框组件
export interface SizeSelectModalProps {
    open: boolean;
    onCancel: () => void;
    onOk: (selectedSize: string) => void;
}

export const SizeSelectModal: React.FC<SizeSelectModalProps> = ({
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
