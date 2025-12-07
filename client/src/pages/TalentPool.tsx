import React, { useEffect, useState } from 'react';
import { Button, Table, Toast, Tag, Space } from '@douyinfe/semi-ui';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const TalentPool: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchTalents = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:3000/api/talent/list');
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (error) {
            Toast.error('获取人才库数据失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTalents();
    }, []);

    const columns = [
        { title: '姓名', dataIndex: 'name' },
        {
            title: '评分',
            dataIndex: 'score',
            render: (text: number | string) => {
                const score = Number(text);
                return <span style={{ color: score >= 90 ? '#389e0d' : score >= 80 ? '#1890ff' : '#595959', fontWeight: 'bold' }}>{text}</span>;
            }
        },
        { title: '邮箱', dataIndex: 'email' },
        {
            title: '状态',
            dataIndex: 'status',
            render: (text: string) => <Tag color="blue">{text || '新加入'}</Tag>
        },
        {
            title: '操作',
            render: (_text: any, record: any) => (
                <Space>
                    <Button theme='light' type='primary' size="small" onClick={() => {
                        const initialContent = record.emailDraft
                            ? (typeof record.emailDraft === 'string' ? record.emailDraft : record.emailDraft.content || JSON.stringify(record.emailDraft))
                            : `${record.name} 您好，\n\n很高兴通知您，经过简历评估，我们认为您非常适合该岗位。\n\n诚挚邀请您参加面试。`;

                        navigate('/dashboard/email', {
                            state: {
                                to: record.email,
                                subject: record.emailDraft?.subject || `面试邀请 - ${record.name}`,
                                content: initialContent
                            }
                        });
                    }}>
                        定制邮件
                    </Button>
                    <Button theme='light' type='tertiary' size="small" onClick={() => navigate('/dashboard/interview', { state: { candidate: record, questions: record.interviewQuestions } })}>
                        面试题
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <h2>人才库管理</h2>
            <div style={{ marginBottom: 16 }}>
                <Button onClick={fetchTalents} loading={loading}>刷新列表</Button>
            </div>
            <Table columns={columns} dataSource={data} loading={loading} pagination={false} />
        </div>
    );
};
