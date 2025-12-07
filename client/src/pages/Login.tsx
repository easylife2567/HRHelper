import React, { useState } from 'react';
import { Card, Form, Button, Toast, Layout } from '@douyinfe/semi-ui';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const Login: React.FC = () => {
    const setUser = useStore((state) => state.setUser);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values: Record<string, string>) => {
        setLoading(true);
        try {
            // Using http://localhost:3000 explicitly or proxy
            const res = await axios.post('http://localhost:3000/api/login', values);
            if (res.data.token) {
                localStorage.removeItem('resume_report'); // Clear previous session data
                setUser({ name: res.data.user?.name || 'User', token: res.data.token });
                Toast.success('登录成功');
                navigate('/dashboard/resume');
            }
        } catch {
            Toast.error('登录失败: 用户名或密码错误 (Try admin/admin)');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--semi-color-bg-1)' }}>
            <Card title="HR Helper 系统登录" style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <Form onSubmit={handleSubmit}>
                    <Form.Input field="username" label="用户名" placeholder="admin" rules={[{ required: true }]} />
                    <Form.Input field="password" label="密码" type="password" placeholder="admin" rules={[{ required: true }]} />
                    <Button htmlType="submit" type="primary" theme="solid" block loading={loading} style={{ marginTop: 20 }}>登录</Button>
                </Form>
            </Card>
        </Layout>
    );
};
