import React, { useState, useEffect } from 'react';
import { Typography, Card, Grid, Space, Button, Statistic, Tag, List, Spin } from '@arco-design/web-react';
import { IconUser, IconUserGroup, IconCheckCircle, IconCloseCircle, IconClockCircle, IconRight, IconSafe, IconEmail, IconFile } from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

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

    // Chart Data State
    const [scoreData, setScoreData] = useState<any[]>([]);
    const [statusData, setStatusData] = useState<any[]>([]);

    useEffect(() => {
        fetchTalents();
    }, []);

    useEffect(() => {
        if (talentList && talentList.length > 0) {
            console.log('Dashboard Processing TalentList:', talentList.length, talentList[0]);

            const list = talentList;

            // Helper: Safe Score Parsing (Handles numbers, strings, ['85'], {value: 85}, etc.)
            const getSafeScore = (item: any): number => {
                const raw = item.score ?? item.overall_score; // Prioritize mapped 'score'
                if (typeof raw === 'number') return raw;
                if (typeof raw === 'string') return parseFloat(raw) || 0;
                if (Array.isArray(raw) && raw.length > 0) return Number(raw[0]) || 0;
                if (typeof raw === 'object' && raw !== null) return Number(raw.value || raw.text || 0) || 0;
                return 0;
            };

            // Helper: Safe Status Parsing
            const getSafeStatus = (item: any): string => {
                const raw = item.status;
                if (typeof raw === 'string') return raw.trim();
                if (Array.isArray(raw) && raw.length > 0) return (typeof raw[0] === 'string' ? raw[0] : (raw[0].text || '')).trim();
                if (typeof raw === 'object' && raw !== null) return (raw.text || raw.value || '').trim();
                return '';
            };

            // Calculate Stats
            let pending = 0, pass = 0, fail = 0;
            const scores = {
                '60分以下': 0, '60-70分': 0, '70-80分': 0, '80-90分': 0, '90分以上': 0
            };

            list.forEach((t: any) => {
                // Status
                const status = getSafeStatus(t);
                if (status === '待面试') pending++;
                else if (status === '通过') pass++;
                else if (['未通过', '淘汰'].includes(status)) fail++;

                // Score
                const score = getSafeScore(t);
                if (score < 60) scores['60分以下']++;
                else if (score < 70) scores['60-70分']++;
                else if (score < 80) scores['70-80分']++;
                else if (score < 90) scores['80-90分']++;
                else scores['90分以上']++;
            });

            // Update State
            setStats({ total: list.length, pending, pass, fail });
            setScoreData(Object.entries(scores).map(([name, value]) => ({ name, value })));

            // Pie Chart Data
            const other = list.length - pending - pass - fail;
            const newStatusData = [
                { name: '待面试', value: pending, color: '#FF7D00' },
                { name: '已通过', value: pass, color: '#00B42A' },
                { name: '已淘汰', value: fail, color: '#F53F3F' },
                { name: '其他', value: Math.max(0, other), color: '#86909C' }
            ].filter(item => item.value > 0);

            setStatusData(newStatusData);
        } else {
            console.log('Dashboard: Empty TalentList');
            setStats({ total: 0, pending: 0, pass: 0, fail: 0 });
            setScoreData([]);
            setStatusData([]);
        }
    }, [talentList]);

    const handleRefresh = () => {
        fetchTalents();
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Spin loading={loadingTalents} style={{ display: 'block', height: '100%' }}>
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Header - Fixed */}
                    <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                        {/* ... existing header content ... */}
                        <div>
                            <Title heading={4} style={{ margin: 0 }}>
                                欢迎回来, {user?.name || '招聘官'}
                            </Title>
                            <Text type="secondary">
                                今日招聘进展如下。
                            </Text>
                        </div>
                        <Space>
                            <Button size="mini" type="secondary" onClick={handleRefresh}>刷新数据</Button>
                            <Tag color="green" icon={<IconSafe />}>系统运行中</Tag>
                            <Text>{new Date().toLocaleDateString()}</Text>
                        </Space>
                    </div>

                    {/* Scrollable Content */}
                    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0, paddingRight: 4 }}>
                        {/* Statistics Section */}
                        <Row gutter={24} style={{ marginBottom: 24 }}>
                            {/* ... existing stats cards ... */}
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

                        {/* Charts Section [NEW] */}
                        <Row gutter={24} style={{ marginBottom: 24 }}>
                            <Col span={14}>
                                <Card title="候选人分数分布" style={{ height: 360 }}>
                                    <div style={{ width: '100%', height: 280 }}>
                                        {scoreData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={scoreData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E6EB" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#86909C' }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#86909C' }} />
                                                    <RechartsTooltip
                                                        cursor={{ fill: '#F2F3F5' }}
                                                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                                                    />
                                                    <Bar dataKey="value" name="人数" fill="#165DFF" barSize={32} radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86909C' }}>
                                                暂无数据
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </Col>
                            <Col span={10}>
                                <Card title="招聘状态分布" style={{ height: 360 }}>
                                    <div style={{ width: '100%', height: 280 }}>
                                        {statusData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={statusData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {statusData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86909C' }}>
                                                暂无数据
                                            </div>
                                        )}
                                    </div>
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
                    </div>
                </div>
            </Spin>
        </div>
    );
};
