import React, { Children, ReactNode } from 'react';
import { Table, Button, Space, Card, Tag, Popconfirm } from 'antd';
import type { TableProps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSvCrudContext } from './context';
import { SvItemProps } from './SvItem';

interface SvTableProps {
    children?: ReactNode;
    rowKey?: string;
    scroll?: { x?: number | string; y?: number | string };
}

const SvTable: React.FC<SvTableProps> = ({ children, rowKey = 'key', scroll }) => {
    const {
        data,
        loading,
        pagination,
        handleTableChange,
        openCreateModal,
        openEditModal,
        deleteItem
    } = useSvCrudContext();

    // Parse columns from children
    const items = Children.map(children, (child) => {
        if (React.isValidElement(child)) {
            return child.props as SvItemProps;
        }
        return null;
    })?.filter(Boolean) as SvItemProps[];

    const columns: TableProps<any>['columns'] = items.map((item) => ({
        title: item.label,
        dataIndex: item.name,
        key: item.name,
        width: item.width,
        render: item.render ? item.render : (text: any) => {
            if (item.type === 'date' && item.format) {
                // Simple format assumption, in real app use dayjs
                return text;
            }
            return text;
        }
    }));

    // Append Action Column if needed (default yes)
    if (columns) {
        columns.push({
            title: '操作',
            key: 'action',
            width: 150,
            render: (_: any, record: any) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        style={{ color: '#4f46e5' }}
                        onClick={() => openEditModal(record)}
                    />
                    <Popconfirm title="确定删除吗?" onConfirm={() => deleteItem(record[rowKey] || record.id || record.key)}>
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        });
    }

    return (
        <Card bordered={false} bodyStyle={{ padding: 0 }}>
            {/* Table Toolbar Area */}
            <div style={{ padding: '0 0 16px', display: 'flex', justifyContent: 'space-between' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                    新增
                </Button>
                {/* Could add generic toolbar slots here */}
            </div>

            <Table
                columns={columns}
                dataSource={data}
                rowKey={rowKey}
                pagination={pagination}
                loading={loading}
                onChange={handleTableChange}
                scroll={scroll}
            />
        </Card>
    );
};

export default SvTable;
