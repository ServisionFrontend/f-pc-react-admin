import React, { Children, ReactNode, useState } from 'react';
import { Form, Input, Select, Button, Space, Row, Col, DatePicker, message } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useSvCrudContext } from './context';
import { SvItemProps } from './SvItem';

interface SvQueryProps {
    children?: ReactNode;
    cols?: number; // How many columns in search grid, default 3 or 4
}

const SvQuery: React.FC<SvQueryProps> = ({ children, cols = 4 }) => {
    const { onSearch, onReset, loading } = useSvCrudContext();
    const [form] = Form.useForm();

    const handleSearch = () => {
        form.validateFields().then((values) => {
            onSearch(values);
        });
    };

    const handleReset = () => {
        form.resetFields();
        onReset();
    };

    // Extract children configuration
    const items = Children.map(children, (child) => {
        if (React.isValidElement(child)) {
            return child.props as SvItemProps;
        }
        return null;
    })?.filter(Boolean) as SvItemProps[];

    const renderFormItem = (item: SvItemProps) => {
        if (!item.name) return null;

        let inputNode = <Input placeholder={`请输入${item.label}`} allowClear />;

        if (item.type === 'select' || item.type === 'combobox') {
            // TODO: Handle remote data fetching if `url` is provided
            inputNode = (
                <Select placeholder={`请选择${item.label}`} allowClear options={item.options} />
            );
        } else if (item.type === 'date') {
            inputNode = <DatePicker style={{ width: '100%' }} />;
        }

        return (
            <Form.Item name={item.name} label={item.label}>
                {inputNode}
            </Form.Item>
        );
    };


    return (
        <div style={{ padding: '16px 16px 0', background: '#fff', marginBottom: 12, borderRadius: 6 }}>
            <Form form={form} layout="inline" onKeyPress={(e) => e.key === 'Enter' && handleSearch()}>
                {items.map((item, idx) => (
                    <Form.Item key={item.name || idx} name={item.name} label={item.label} style={{ marginBottom: 16 }}>
                        {item.type === 'select' || item.type === 'combobox' ?
                            <Select placeholder={`请选择`} allowClear options={item.options} style={{ width: 180, height: 32 }} /> :
                            item.type === 'date' ?
                                <DatePicker style={{ width: 180, height: 32 }} /> :
                                <Input placeholder={`请输入`} allowClear style={{ width: 180, height: 32 }} autoComplete="off" />
                        }
                    </Form.Item>
                ))}

                <Form.Item style={{ marginBottom: 16 }}>
                    <Space>
                        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>查询</Button>
                        <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
                    </Space>
                </Form.Item>
            </Form>
        </div>
    );
};

export default SvQuery;
