import React, { useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space } from '@arco-design/web-react';
import { IconFile, IconUserGroup, IconCalendar, IconSettings, IconPoweroff } from '@arco-design/web-react/icon';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import '@arco-design/web-react/dist/css/arco.css';

const { Header, Sider, Content } = Layout;
const MenuItem = Menu.Item;

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

    const droplist = (
        <Menu>
            <MenuItem key='logout' onClick={handleLogout}>
                <IconPoweroff style={{ marginRight: 8 }} />
                退出登录
            </MenuItem>
        </Menu>
    );

    return (
        <Layout className='layout-collapse-demo' style={{ height: '100vh', overflow: 'hidden' }}>
            <Sider
                collapsible
                breakpoint='xl'
                style={{ backgroundColor: '#232324' }} // Darker sidebar as per common dashboard templates
                trigger={null}
                width={220}
            >
                <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#232324', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <IconUserGroup style={{ color: '#fff', fontSize: 24, marginRight: 8 }} />
                    <span style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>HR Helper</span>
                </div>
                <Menu
                    theme='dark'
                    style={{ width: '100%' }}
                    selectedKeys={[selectedKey]}
                    onClickMenuItem={(key) => navigate(key)}
                >
                    <MenuItem key='/dashboard/home'>
                        <IconUserGroup />
                        工作台
                    </MenuItem>
                    <MenuItem key='/dashboard/resume'>
                        <IconFile />
                        简历评估
                    </MenuItem>
                    <MenuItem key='/dashboard/talent'>
                        <IconUserGroup />
                        人才库
                    </MenuItem>
                    <MenuItem key='/dashboard/email'>
                        <IconSettings />
                        邮件定制
                    </MenuItem>
                    <MenuItem key='/dashboard/interview'>
                        <IconCalendar />
                        面试题生成
                    </MenuItem>
                </Menu>
            </Sider>
            <Layout>
                <Header style={{ backgroundColor: '#fff', height: 60, borderBottom: '1px solid #e5e6eb', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div /> {/* Breadcrumb could go here in future */}
                    <Space>
                        <Dropdown droplist={droplist} position='br'>
                            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <Avatar size={32} style={{ backgroundColor: '#3370ff', marginRight: 8 }}>{user?.name?.[0]}</Avatar>
                                <span style={{ color: '#1d2129' }}>{user?.name}</span>
                            </div>
                        </Dropdown>
                    </Space>
                </Header>
                <Content style={{ padding: 24, backgroundColor: '#f2f3f5', overflow: 'auto' }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};
