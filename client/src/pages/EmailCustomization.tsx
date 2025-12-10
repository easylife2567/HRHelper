import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Message, List, Typography, Breadcrumb } from '@arco-design/web-react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { IconHome, IconEmail, IconApps, IconSend, IconEdit } from '@arco-design/web-react/icon';
import '@arco-design/web-react/dist/css/arco.css';

const { Title, Text } = Typography;
const FormItem = Form.Item;
const TextArea = Input.TextArea;

const TEMPLATES = [
    {
        id: 1,
        title: '面试邀请',
        subject: '【面试邀请】HR Helper 招聘面试',
        content: `尊敬的候选人：\n\n您好！感谢您对我们公司的关注。\n\n经过对您简历的初步评估，我们对应聘者的背景印象深刻。为了进一步了解彼此，我们诚挚地邀请您参加面试。\n\n时间：\n地点：\n\n请您回复确认是否能准时参加。\n\n祝好，\n招聘团队`
    },
    {
        id: 2,
        title: '录用通知 (Offer)',
        subject: '【录用通知】欢迎加入 HR Helper',
        content: `尊敬的候选人：\n\n很高兴地通知您，您已通过我们的面试！\n\n我们诚挚地邀请您加入团队。附件中是您的录用意向书，请查阅。\n\n期待与您共事！\n\n祝好，\nHR 部门`
    },
    {
        id: 3,
        title: '遗憾通知',
        subject: '关于您的应聘反馈',
        content: `尊敬的候选人：\n\n您好！感谢您抽出宝贵时间参加我们的面试。\n\n经过慎重考虑，我们不得不遗憾地通知您，您目前的经历与我们岗位的需求稍有出入。我们会将您的简历保留在人才库中，若有合适的职位会优先考虑。\n\n祝您求职顺利！\n\n招聘团队`
    }
];

export const EmailCustomization: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const [form] = Form.useForm();
    const [initialValues, setInitialValues] = useState({ to: '', subject: '', content: '' });

    useEffect(() => {
        if (location.state) {
            const { to, subject, content } = location.state as any;
            const values = {
                to: to || '',
                subject: subject || '面试邀请',
                content: content || ''
            };
            setInitialValues(values);
            form.setFieldsValue(values);
        }
    }, [location.state, form]);

    const handleApplyTemplate = (tpl: typeof TEMPLATES[0]) => {
        const currentValues = form.getFieldsValue() || {};
        form.setFieldsValue({
            ...currentValues,
            subject: tpl.subject,
            content: tpl.content
        });
        Message.success(`已应用模板：${tpl.title}`);
    };

    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            await axios.post('http://localhost:3000/api/email/send', values);
            Message.success('邮件发送成功');
        } catch {
            Message.error('发送失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div>
                <Breadcrumb style={{ margin: '16px 0' }}>
                    <Breadcrumb.Item>
                        <IconHome />
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item>Email Customization</Breadcrumb.Item>
                </Breadcrumb>
                <Title heading={3} style={{ marginTop: 0, marginBottom: 16 }}>邮件定制</Title>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, flex: 1, minHeight: 0 }}>
                {/* Left: Template Library */}
                <Card
                    title={<div style={{ display: 'flex', alignItems: 'center' }}><IconApps style={{ marginRight: 8 }} /> 模板库</div>}
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    bodyStyle={{ padding: 16, flex: 1, overflowY: 'auto', backgroundColor: 'var(--color-fill-1)' }}
                >
                    <List
                        dataSource={TEMPLATES}
                        render={(item) => (
                            <div
                                key={item.id}
                                style={{
                                    padding: '16px',
                                    cursor: 'pointer',
                                    borderRadius: 8,
                                    marginBottom: 12,
                                    backgroundColor: 'var(--color-bg-2)',
                                    border: '1px solid var(--color-border)',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                }}
                                onClick={() => handleApplyTemplate(item)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'rgb(var(--primary-6))';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <Text bold style={{ fontSize: 15 }}>{item.title}</Text>
                                    <Button size="mini" shape="circle" icon={<IconEdit />} />
                                </div>
                                <Text
                                    type="secondary"
                                    style={{
                                        fontSize: 13,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        lineHeight: 1.5
                                    }}
                                >
                                    {item.subject}
                                </Text>
                            </div>
                        )}
                        bordered={false}
                    />
                </Card>

                {/* Right: Email Editor */}
                <Card
                    title={<div style={{ display: 'flex', alignItems: 'center' }}><IconEmail style={{ marginRight: 8 }} /> 邮件编辑</div>}
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    bodyStyle={{ padding: 24, flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}
                >
                    <Form
                        form={form}
                        onSubmit={handleSubmit}
                        initialValues={initialValues}
                        layout="vertical"
                        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    >
                        <div style={{ display: 'flex', gap: 24 }}>
                            <FormItem field="to" label="收件人邮箱" rules={[{ required: true, type: 'email', message: '请输入有效的邮箱地址' }]} style={{ flex: 1 }}>
                                <Input prefix={<IconEmail />} placeholder="candidate@example.com" />
                            </FormItem>
                            <FormItem field="subject" label="邮件主题" rules={[{ required: true, message: '请输入邮件主题' }]} style={{ flex: 1 }}>
                                <Input placeholder="请输入邮件主题" />
                            </FormItem>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, marginBottom: 24 }}>
                            <div style={{ marginBottom: 8, color: 'var(--color-text-2)', fontSize: 14 }}>邮件正文</div>
                            <FormItem field="content" rules={[{ required: true, message: '请输入邮件内容' }]} noStyle wrapperCol={{ style: { flex: 1, display: 'flex', flexDirection: 'column' } }}>
                                <TextArea
                                    placeholder="请输入邮件内容..."
                                    style={{
                                        flex: 1,
                                        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                                        resize: 'none',
                                        padding: 16,
                                        fontSize: 14,
                                        lineHeight: 1.6,
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 4,
                                        backgroundColor: 'var(--color-fill-1)'
                                    }}
                                />
                            </FormItem>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={<IconSend />}
                                loading={loading}
                                size="large"
                                style={{ padding: '0 32px' }}
                            >
                                发送邮件
                            </Button>
                        </div>
                    </Form>
                </Card>
            </div>
        </div>
    );
};
