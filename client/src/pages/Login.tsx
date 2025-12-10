import React, { useState } from 'react';
import { Card, Form, Input, Button, Message } from '@arco-design/web-react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '@arco-design/web-react/dist/css/arco.css';

const FormItem = Form.Item;

export const Login: React.FC = () => {
    const setUser = useStore((state) => state.setUser);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const handleSubmit = async (values: Record<string, any>) => {
        setLoading(true);
        try {
            // Using http://localhost:3000 explicitly or proxy
            const res = await axios.post('http://localhost:3000/api/login', values);
            if (res.data.token) {
                localStorage.removeItem('resume_report'); // Clear previous session data
                setUser({ name: res.data.user?.name || 'User', token: res.data.token });
                Message.success('登录成功');
                navigate('/dashboard/home');
            }
        } catch {
            Message.error('登录失败: 用户名或密码错误');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f3f5' }}>
            <Card title="HR Helper 系统登录" style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <Form form={form} onSubmit={handleSubmit} autoComplete="off" layout="vertical">
                    <FormItem field="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                        <Input placeholder="请输入用户名" autoComplete="off" />
                    </FormItem>
                    <FormItem field="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                        <Input.Password placeholder="请输入密码" autoComplete="new-password" />
                    </FormItem>
                    <FormItem>
                        <Button type="primary" htmlType="submit" long loading={loading}>登录</Button>
                    </FormItem>
                </Form>
            </Card>
        </div>
    );
};
