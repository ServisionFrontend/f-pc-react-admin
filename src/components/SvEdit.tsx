import React, { Children, ReactNode, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Switch } from 'antd';
import { useSvCrudContext } from './context';
import { SvItemProps } from './SvItem';

interface SvEditProps {
    children?: ReactNode;
    width?: string | number;
    labelWidth?: number;
    title?: string; // Optional override default "Edit / Create"
}

const SvEdit: React.FC<SvEditProps> = ({ children, width = 600, labelWidth = 80, title }) => {
    const {
        isModalOpen,
        editingRecord,
        closeModal,
        createItem,
        updateItem,
        loading
    } = useSvCrudContext();

    const [form] = Form.useForm();

    useEffect(() => {
        if (isModalOpen) {
            if (editingRecord) {
                form.setFieldsValue(editingRecord);
            } else {
                form.resetFields();
            }
        }
    }, [isModalOpen, editingRecord, form]);

    const handleOk = () => {
        form.validateFields().then(async (values) => {
            let success = false;
            if (editingRecord) {
                // Append ID/Key if needed
                const idName = 'key'; // default assumption
                const id = editingRecord[idName] || editingRecord.id;
                success = await updateItem({ ...values, [idName]: id });
            } else {
                success = await createItem(values);
            }

            if (success) {
                closeModal();
                form.resetFields();
            }
        });
    };

    const handleCancel = () => {
        closeModal();
        form.resetFields();
    };

    // Parse items
    const items = Children.map(children, (child) => {
        if (React.isValidElement(child)) {
            return child.props as SvItemProps;
        }
        return null;
    })?.filter(Boolean) as SvItemProps[];

    return (
        <Modal
            title={title ? title : (editingRecord ? '编辑' : '新增')}
            open={isModalOpen}
            onOk={handleOk}
            onCancel={handleCancel}
            width={width}
            confirmLoading={loading}
            centered
            forceRender
        >
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                {items.map((item, idx) => {
                    if (item.hidden) return null;

                    let inputNode = <Input placeholder={item.label} maxLength={item.maxlength} autoComplete="off" />;

                    if (item.type === 'number') {
                        inputNode = <InputNumber style={{ width: '100%' }} placeholder={item.label} autoComplete="off" />;
                    } else if (item.type === 'select' || item.type === 'combobox') {
                        inputNode = <Select options={item.options} placeholder={item.label} />;
                    } else if (item.type === 'date') {
                        inputNode = <DatePicker style={{ width: '100%' }} />;
                    } else if (item.type === 'switch') {
                        return (
                            <Form.Item key={item.name || idx} name={item.name} label={item.label} valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        );
                    }

                    return (
                        <Form.Item
                            key={item.name || idx}
                            name={item.name}
                            label={item.label}
                            rules={[{ required: item.required, message: `请输入${item.label}` }]}
                        >
                            {inputNode}
                        </Form.Item>
                    );
                })}
            </Form>
        </Modal>
    );
};

export default SvEdit;
