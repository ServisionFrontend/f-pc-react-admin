import { Card, Button } from 'antd';
import { ShoppingOutlined } from '@ant-design/icons';

const ProductManagement = () => {
    return (
        <div>
            <Card className="premium-card" style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 120,
                        height: 120,
                        background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.2)'
                    }}>
                        <ShoppingOutlined style={{ fontSize: 48, color: '#4f46e5' }} />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>产品模块开发中</h2>
                    <p style={{ color: '#64748b', fontSize: 15, maxWidth: 400, margin: '0 auto 24px' }}>
                        我们要为您提供最好的产品管理体验，目前该功能正在紧锣密鼓地开发中，敬请期待。
                    </p>
                    <Button type="primary" icon={<ShoppingOutlined />} size="large">
                        查看示例产品
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default ProductManagement;
