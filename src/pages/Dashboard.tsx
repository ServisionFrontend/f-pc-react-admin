import { Row, Col, Card, Statistic, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import {
    UserOutlined,
    ShoppingOutlined,
    ArrowUpOutlined,
    StockOutlined,
} from '@ant-design/icons';

interface LogEntry {
    key: string;
    name: string;
    action: string;
    time: string;
    status: string;
}

const Dashboard = () => {
    const stats = [
        { title: '总用户', value: 112893, icon: <UserOutlined />, color: '#4f46e5', bg: '#eef2ff', suffix: undefined, prefix: undefined, trend: '+12%' },
        { title: '昨日新增', value: 231, icon: <StockOutlined />, color: '#8b5cf6', bg: '#f3e8ff', suffix: undefined, prefix: undefined, trend: '+5%' },
        { title: '总营收', value: 92831, prefix: '¥', icon: <ShoppingOutlined />, color: '#ec4899', bg: '#fce7f3', suffix: undefined, trend: '+18%' },
        { title: '增长率', value: 12.5, suffix: '%', icon: <ArrowUpOutlined />, color: '#10b981', bg: '#d1fae5', prefix: undefined, trend: '+2%' },
    ];

    const dataSource: LogEntry[] = [
        {
            key: '1',
            name: '张三',
            action: '登录系统',
            time: '2026-01-19 15:30:00',
            status: 'success',
        },
        {
            key: '2',
            name: '李四',
            action: '更新产品售价',
            time: '2026-01-19 15:45:00',
            status: 'warning',
        },
        {
            key: '3',
            name: '王五',
            action: '删除用户',
            time: '2026-01-19 16:00:00',
            status: 'error',
        },
        {
            key: '4',
            name: '赵六',
            action: '导出报表',
            time: '2026-01-19 16:15:00',
            status: 'success',
        },
        {
            key: '5',
            name: '钱七',
            action: '修改系统配置',
            time: '2026-01-19 16:30:00',
            status: 'warning',
        },
    ];

    const columns: TableProps<LogEntry>['columns'] = [
        {
            title: '操作人',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>
        },
        { title: '操作行为', dataIndex: 'action', key: 'action' },
        { title: '操作时间', dataIndex: 'time', key: 'time', render: (text) => <span style={{ color: '#94a3b8' }}>{text}</span> },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = status === 'success' ? 'success' : (status === 'warning' ? 'warning' : 'error');
                let text = status === 'success' ? '通过' : (status === 'warning' ? '待定' : '异常');
                return <Tag color={color} style={{ margin: 0 }}>{text}</Tag>;
            },
        },
    ];

    return (
        <div>
            <Row gutter={[24, 24]}>
                {stats.map((stat, index) => (
                    <Col xs={24} sm={12} lg={6} key={index}>
                        <Card className="premium-card" bordered={false} bodyStyle={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    background: stat.bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: stat.color,
                                    fontSize: 24
                                }}>
                                    {stat.icon}
                                </div>
                                <span style={{ color: '#10b981', fontWeight: 600, fontSize: '13px', background: '#ecfdf5', padding: '2px 8px', borderRadius: '12px' }}>
                                    {stat.trend}
                                </span>
                            </div>
                            <Statistic
                                title={<span style={{ color: '#64748b', fontWeight: 500, fontSize: '14px' }}>{stat.title}</span>}
                                value={stat.value}
                                precision={stat.suffix === '%' ? 1 : 0}
                                valueStyle={{ fontWeight: 700, fontSize: '28px', color: '#1e293b' }}
                                prefix={stat.prefix}
                                suffix={<span style={{ fontSize: '16px', color: '#94a3b8', marginLeft: 4 }}>{stat.suffix}</span>}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                <Col span={24}>
                    <Card
                        title="最近操作日志"
                        className="premium-card"
                        bordered={false}
                        extra={<Tag color="blue" style={{ borderRadius: 12, padding: '0 12px' }}>实时监控</Tag>}
                    >
                        <Table
                            dataSource={dataSource}
                            columns={columns}
                            pagination={false}
                            size="middle"
                            rowClassName={() => 'hover-row'}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
