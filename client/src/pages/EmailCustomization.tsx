import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Toast } from '@douyinfe/semi-ui';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { IconHome } from '@douyinfe/semi-icons';
import { Breadcrumb } from '@arco-design/web-react';
import '@arco-design/web-react/dist/css/arco.css';

export const EmailCustomization: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const [initialValues, setInitialValues] = useState({ to: '', subject: '', content: '' });

    useEffect(() => {
        if (location.state) {
            const { to, subject, content } = location.state as any;
            setInitialValues({
                to: to || '',
                subject: subject || '面试邀请',
                content: content || ''
            });
        }
    }, [location.state]);

    interface EmailFormValues {
        to: string;
        subject: string;
        content: string;
    }

    const handleSubmit = async (values: EmailFormValues) => {
        setLoading(true);
        try {
            await axios.post('http://localhost:3000/api/email/send', values);
            Toast.success('邮件发送成功');
        } catch {
            Toast.error('发送失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
            <Breadcrumb style={{ margin: '16px 0' }}>
                <Breadcrumb.Item>
                    <IconHome />
                </Breadcrumb.Item>
                <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
                <Breadcrumb.Item>Email Customization</Breadcrumb.Item>
            </Breadcrumb>
            <h2>定制个性化邮件</h2>
            <Card>
                <Form onSubmit={handleSubmit} initValues={initialValues} key={JSON.stringify(initialValues)}>
                    <Form.Input field="to" label="收件人邮箱" rules={[{ required: true, type: 'email' }]} />
                    <Form.Input field="subject" label="邮件主题" rules={[{ required: true }]} />
                    <Form.TextArea field="content" label="邮件内容" rows={10} rules={[{ required: true }]} />
                    <Button htmlType="submit" type="primary" loading={loading} style={{ marginTop: 16 }}>发送邮件</Button>
                </Form>
            </Card>
        </div>
    );
};
