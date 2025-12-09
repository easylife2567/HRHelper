import React, { useState, useEffect } from 'react';
import { Typography, Card, Grid, Space, Button, Statistic, Tag, List, Spin } from '@arco-design/web-react';
import { IconUser, IconUserGroup, IconCheckCircle, IconCloseCircle, IconClockCircle, IconRight, IconSafe, IconEmail, IconFile } from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

const { Row, Col } = Grid;
const { Title, Text } = Typography;

export const DashboardHome: React.FC = () => {
    const { user, talentList, loadingTalents, fetchTalents } = useStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        pass: 0,
        fail: 0
    });

    useEffect(() => {
        fetchTalents();
    }, []);

    useEffect(() => {
        if (talentList) {
            const total = talentList.length;
            // Match Chinese status values used in TalentPool
            const pending = talentList.filter((item: any) => item.status === '待面试').length;
            const pass = talentList.filter((item: any) => item.status === '通过').length;
            // Handle both '未通过' (TalentPool UI) and potentially 'Fail' or '淘汰' for robustness
            const fail = talentList.filter((item: any) => item.status === '未通过' || item.status === '淘汰').length;
            setStats({ total, pending, pass, fail });
        }
    }, [talentList]);

    return (
        <div style={{ padding: '0 24px 24px 24px' }}>
            <Spin loading={loadingTalents} style={{ display: 'block' }}>
                {/* Header Section */}
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Title heading={4} style={{ margin: 0 }}>
                            欢迎回来, {user?.name || '招聘官'}
                        </Title>
                        <Text type="secondary">
                            今日招聘进展如下。
                        </Text>
                    </div>
                    <Space>
                        <Tag color="green" icon={<IconSafe />}>系统运行中</Tag>
                        <Text>{new Date().toLocaleDateString()}</Text>
                    </Space>
                </div>

                {/* Statistics Section */}
                <Row gutter={24} style={{ marginBottom: 24 }}>
                    <Col span={6}>
                        <Card hoverable className="stat-card">
                            <Statistic
                                title="候选人总数"
                                value={stats.total}
                                prefix={<IconUserGroup style={{ color: '#165DFF' }} />}
                                countFrom={0}
                                styleValue={{ fontSize: 24, fontWeight: 600 }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card hoverable className="stat-card">
                            <Statistic
                                title="待面试"
                                value={stats.pending}
                                prefix={<IconClockCircle style={{ color: '#FF7D00' }} />}
                                countFrom={0}
                                styleValue={{ fontSize: 24, fontWeight: 600 }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card hoverable className="stat-card">
                            <Statistic
                                title="已通过"
                                value={stats.pass}
                                prefix={<IconCheckCircle style={{ color: '#00B42A' }} />}
                                countFrom={0}
                                styleValue={{ fontSize: 24, fontWeight: 600 }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card hoverable className="stat-card">
                            <Statistic
                                title="已淘汰"
                                value={stats.fail}
                                prefix={<IconCloseCircle style={{ color: '#F53F3F' }} />}
                                countFrom={0}
                                styleValue={{ fontSize: 24, fontWeight: 600 }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Quick Actions & System Status */}
                <Row gutter={24}>
                    <Col span={16}>
                        <Card title="快捷操作">
                            <Space size="large">
                                <Button type="outline" icon={<IconFile />} onClick={() => navigate('/dashboard/resume')}>
                                    简历评估
                                </Button>
                                <Button type="outline" icon={<IconEmail />} onClick={() => navigate('/dashboard/email')}>
                                    邮件定制
                                </Button>
                                <Button type="outline" icon={<IconUser />} onClick={() => navigate('/dashboard/talent')}>
                                    添加人才
                                </Button>
                            </Space>
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card title="招聘贴士">
                            <List
                                size="small"
                                dataSource={[
                                    '建议在24小时内处理待评估简历。',
                                    '个性化邮件能够提高候选人回复率。',
                                    '定期回顾面试反馈，优化招聘流程。'
                                ]}
                                render={(item, index) => (
                                    <List.Item key={index}>
                                        <IconRight /> {item}
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Col>
                </Row>
            </Spin>
        </div>
    );
};
