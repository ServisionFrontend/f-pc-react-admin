import { SvCrud, SvQuery, SvTable, SvEdit, SvItem } from '../components';
import roleService from '../services/roleService';
import { Tag } from 'antd';

const RoleManagement = () => {
    return (
        <div>
            <SvCrud api={roleService} readUrl="/roles">
                <SvQuery>
                    <SvItem name="roleName" label="角色名称" />
                    <SvItem name="roleCode" label="角色编码" />
                </SvQuery>

                <SvTable>
                    <SvItem name="roleName" label="角色名称" width={200} />
                    <SvItem name="roleCode" label="角色编码" width={200} />
                    <SvItem name="description" label="描述" />
                    <SvItem
                        name="status"
                        label="状态"
                        width={100}
                        render={(status: number) => (
                            <Tag color={status === 1 ? 'success' : 'error'}>
                                {status === 1 ? '启用' : '禁用'}
                            </Tag>
                        )}
                    />
                </SvTable>

                <SvEdit>
                    <SvItem name="roleName" label="角色名称" required />
                    <SvItem name="roleCode" label="角色编码" required />
                    <SvItem name="description" label="描述" type="text" />
                    <SvItem name="status" label="是否启用" type="switch" />
                </SvEdit>
            </SvCrud>
        </div>
    );
};

export default RoleManagement;
