import React, { useEffect } from 'react';
import { Layout, Nav, Avatar, Dropdown } from '@douyinfe/semi-ui';
import { IconFile, IconUserGroup } from '@douyinfe/semi-icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';

const { Header, Sider, Content } = Layout;

export const MainLayout: React.FC = () => {
    const { user, setUser } = useStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    const handleLogout = () => {
        setUser(null);
        navigate('/login');
    };

    const selectedKey = location.pathname;

    return (
        <Layout style={{ height: '100vh' }}>
            <Header style={{ backgroundColor: 'var(--semi-color-bg-0)', height: 60, display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <IconUserGroup size="large" style={{ color: 'var(--semi-color-primary)' }} />
                    <span style={{ fontSize: 18, fontWeight: 600 }}>HR Helper</span>
                </div>
                <Dropdown
                    render={
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={handleLogout}>退出登录</Dropdown.Item>
                        </Dropdown.Menu>
                    }
                >
                    <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <Avatar color="blue" size="small" style={{ marginRight: 8 }}>{user?.name?.[0]}</Avatar>
                        <span>{user?.name}</span>
                    </div>
                </Dropdown>
            </Header>
            <Layout>
                <Sider style={{ backgroundColor: 'var(--semi-color-bg-1)' }}>
                    <Nav
                        defaultSelectedKeys={[selectedKey]}
                        selectedKeys={[selectedKey]}
                        style={{ height: '100%' }}
                        onSelect={(data) => navigate(data.itemKey as string)}
                        items={[
                            { itemKey: '/dashboard/resume', text: '简历评估', icon: <IconFile /> },
                            { itemKey: '/dashboard/talent', text: '人才库', icon: <IconUserGroup /> },
                        ]}
                        footer={{ collapseButton: true }}
                    />
                </Sider>
                <Content style={{ padding: '24px', backgroundColor: 'var(--semi-color-bg-0)', overflow: 'auto' }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};
