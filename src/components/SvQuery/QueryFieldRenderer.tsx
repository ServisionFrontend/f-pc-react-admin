import React from 'react';
import { Form, Input, Select, InputNumber, DatePicker, Col } from 'antd';
import { QueryField } from './types';

const { RangePicker } = DatePicker;

interface QueryFieldRendererProps {
    field: QueryField;
}

/**
 * 查询字段渲染器 - 根据字段类型渲染不同的表单控件
 */
export const QueryFieldRenderer: React.FC<QueryFieldRendererProps> = ({ field }) => {
    const renderInput = () => {
        switch (field.type) {
            case 'input':
                return (
                    <Input
                        placeholder={field.placeholder || `请输入${field.label}`}
                        allowClear
                    />
                );

            case 'textarea':
                return (
                    <Input.TextArea
                        placeholder={field.placeholder || `请输入${field.label}`}
                        allowClear
                        rows={1}
                    />
                );

            case 'select':
                return (
                    <Select
                        placeholder={field.placeholder || `请选择${field.label}`}
                        options={field.options}
                        allowClear
                    />
                );

            case 'number':
                return (
                    <InputNumber
                        placeholder={field.placeholder || `请输入${field.label}`}
                        style={{ width: '100%' }}
                    />
                );

            case 'dateRange':
                return (
                    <RangePicker
                        style={{ width: '100%' }}
                        placeholder={['开始日期', '结束日期']}
                    />
                );

            default:
                return (
                    <Input
                        placeholder={field.placeholder || `请输入${field.label}`}
                        allowClear
                    />
                );
        }
    };

    return (
        <Col span={4} key={field.name}>
            <Form.Item
                name={field.name}
                label={field.label}
                rules={field.required ? [{ required: true, message: `请输入${field.label}` }] : []}
            >
                {renderInput()}
            </Form.Item>
        </Col>
    );
};
