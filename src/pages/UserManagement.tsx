import { SvCrud, SvQuery, SvTable, SvEdit, SvItem } from '../components/SvCrud/exports';
import userService from '../services/userService';
import { Tag, Space } from 'antd';

const UserManagement = () => {
    return (
        <div>
            {/* 
                Use api prop for mock service. 
                In real world, you would use readUrl="/api/users" etc.
            */}
            <SvCrud api={userService} readUrl="/users">
                <SvQuery>
                    <SvItem name="name" label="姓名" />
                    <SvItem name="role" label="角色" type="select" options={[
                        { label: 'Admin', value: 'admin' },
                        { label: 'User', value: 'user' }
                    ]} />
                </SvQuery>

                <SvTable>
                    <SvItem
                        name="name"
                        label="姓名"
                        render={(text: string) => (
                            <Space>
                                <div style={{ width: 32, height: 32, background: '#e0e7ff', color: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                                    {text?.charAt(0)}
                                </div>
                                <span style={{ fontWeight: 500 }}>{text}</span>
                            </Space>
                        )}
                    />
                    <SvItem name="age" label="年龄" />
                    <SvItem name="address" label="地址" width={300} />
                    <SvItem
                        name="role"
                        label="角色"
                        render={(role: string) => (
                            <Tag color={role === 'admin' ? 'purple' : 'cyan'} style={{ padding: '2px 10px', borderRadius: 12 }}>
                                {role?.toUpperCase()}
                            </Tag>
                        )}
                    />
                </SvTable>

                <SvEdit>
                    <SvItem name="name" label="姓名" required />
                    <SvItem name="age" label="年龄" type="number" required />
                    <SvItem name="role" label="角色" type="select" options={[
                        { label: 'Admin', value: 'admin' },
                        { label: 'User', value: 'user' }
                    ]} required />
                    <SvItem name="address" label="地址" required />
                </SvEdit>
            </SvCrud>
        </div>
    );
};

export default UserManagement;
