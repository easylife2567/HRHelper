import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Toast, List, Typography } from '@douyinfe/semi-ui';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { IconHome, IconMail, IconTemplate, IconSend, IconEdit } from '@douyinfe/semi-icons';
import { Breadcrumb } from '@arco-design/web-react';
import '@arco-design/web-react/dist/css/arco.css';

const { Title, Text } = Typography;

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
    const [formApi, setFormApi] = useState<any>();
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
            formApi?.setValues(values);
        }
    }, [location.state, formApi]);

    const handleApplyTemplate = (tpl: typeof TEMPLATES[0]) => {
        const currentValues = formApi?.getValues() || {};
        formApi?.setValues({
            ...currentValues,
            subject: tpl.subject,
            content: tpl.content
        });
        Toast.success(`已应用模板：${tpl.title}`);
    };

    const handleSubmit = async (values: any) => {
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
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px 24px 0 24px' }}>
                <Breadcrumb>
                    <Breadcrumb.Item>
                        <IconHome />
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
                    <Breadcrumb.Item>Email Customization</Breadcrumb.Item>
                </Breadcrumb>
                <Title heading={3} style={{ marginTop: 12, marginBottom: 16 }}>邮件定制</Title>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, padding: '0 24px 24px 24px', flex: 1, minHeight: 0 }}>
                {/* Left: Template Library */}
                <Card
                    title={<div style={{ display: 'flex', alignItems: 'center' }}><IconTemplate style={{ marginRight: 8 }} /> 模板库</div>}
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    bodyStyle={{ padding: 12, flex: 1, overflowY: 'auto' }}
                >
                    <List
                        dataSource={TEMPLATES}
                        renderItem={(item) => (
                            <List.Item
                                style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    borderRadius: 6,
                                    marginBottom: 8,
                                    border: '1px solid var(--semi-color-border)',
                                    transition: 'all 0.2s',
                                }}
                                onClick={() => handleApplyTemplate(item)}
                                className="template-item"
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--semi-color-fill-0)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <Text strong>{item.title}</Text>
                                    <IconEdit style={{ color: 'var(--semi-color-text-2)' }} />
                                </div>
                                <Text type="secondary" ellipsis={{ showTooltip: true }} style={{ fontSize: 12, marginTop: 4 }}>
                                    {item.subject}
                                </Text>
                            </List.Item>
                        )}
                    />
                </Card>

                {/* Right: Email Editor */}
                <Card
                    title={<div style={{ display: 'flex', alignItems: 'center' }}><IconMail style={{ marginRight: 8 }} /> 邮件编辑</div>}
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    bodyStyle={{ padding: 24, flex: 1, overflowY: 'auto' }}
                >
                    <Form
                        getFormApi={setFormApi}
                        onSubmit={handleSubmit}
                        initValues={initialValues}
                        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    >
                        <Form.Input
                            field="to"
                            label="收件人邮箱"
                            placeholder="candidate@example.com"
                            trigger="blur"
                            rules={[{ required: true, type: 'email' }]}
                        />
                        <Form.Input
                            field="subject"
                            label="邮件主题"
                            placeholder="请输入邮件主题"
                            trigger="blur"
                            rules={[{ required: true }]}
                        />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <Form.TextArea
                                field="content"
                                label="邮件正文"
                                placeholder="请输入邮件内容..."
                                rules={[{ required: true }]}
                                style={{ height: '100%', fontFamily: 'monospace', resize: 'none' }}
                                rows={15} // Fallback height
                            />
                        </div>
                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                htmlType="submit"
                                type="primary"
                                theme="solid"
                                icon={<IconSend />}
                                loading={loading}
                                size="large"
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
