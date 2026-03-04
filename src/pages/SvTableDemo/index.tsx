import { useState } from 'react';
import { SvTable } from '../../components';
import { Button, Space, Tag } from 'antd';

// 模拟数据
const generateMockData = (page: number, pageSize: number) => {
    const start = (page - 1) * pageSize;
    return Array.from({ length: pageSize }, (_, i) => ({
        key: `${start + i + 1}`,
        name: `用户 ${start + i + 1}`,
        age: 20 + Math.floor(Math.random() * 40),
        address: `地址 ${start + i + 1}`,
        status: Math.random() > 0.5 ? 'active' : 'inactive',
    }));
};

const SvTableDemo = () => {
    const [data, setData] = useState(generateMockData(1, 10));
    const [total] = useState(100);

    const columns = [
        {
            title: '姓名',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '年龄',
            dataIndex: 'age',
            key: 'age',
        },
        {
            title: '地址',
            dataIndex: 'address',
            key: 'address',
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'active' ? 'green' : 'default'}>
                    {status === 'active' ? '启用' : '停用'}
                </Tag>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <h2>SvTable 分页功能演示</h2>

            <div style={{ marginBottom: 24 }}>
                <h3>场景 1: 非受控模式（新功能）</h3>
                <p>使用内部分页状态,简化代码</p>
                <SvTable
                    columns={columns}
                    dataSource={data}
                    defaultPagination={{
                        pageSize: 10,
                        total: total,
                    }}
                    onPaginationChange={(page, pageSize) => {
                        console.log('分页变化:', page, pageSize);
                        setData(generateMockData(page, pageSize));
                    }}
                />
            </div>

            <div style={{ marginBottom: 24 }}>
                <h3>场景 2: 自定义分页配置</h3>
                <p>自定义 pageSize 和 pageSizeOptions</p>
                <SvTable
                    columns={columns}
                    dataSource={data}
                    defaultPagination={{
                        pageSize: 20,
                        total: total,
                        showSizeChanger: true,
                        pageSizeOptions: ['20', '50', '100'],
                    }}
                    onPaginationChange={(page, pageSize) => {
                        console.log('分页变化:', page, pageSize);
                        setData(generateMockData(page, pageSize));
                    }}
                />
            </div>

            <div style={{ marginBottom: 24 }}>
                <h3>场景 3: 禁用分页</h3>
                <p>不显示分页组件</p>
                <SvTable
                    columns={columns}
                    dataSource={data.slice(0, 5)}
                    showPagination={false}
                />
            </div>
        </div>
    );
};

export default SvTableDemo;
