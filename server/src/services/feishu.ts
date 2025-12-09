import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const FEISHU_APP_TOKEN = process.env.FEISHU_APP_TOKEN;
const FEISHU_TABLE_ID = process.env.FEISHU_TABLE_ID;
// These should ideally be in .env
const FEISHU_APP_ID = process.env.FEISHU_APP_ID;
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET;

const DB_FILE = path.join(__dirname, '../../candidates.json');

export class FeishuService {
    static async addCandidate(data: any) {
        if (!data || !data.name) {
            console.warn('Attempted to save invalid candidate data:', data);
            return { success: false, message: 'Invalid data' };
        }

        // 1. Save to Local JSON (Source of Truth for this Demo)
        const candidates = this.loadLocalCandidates();
        // Avoid duplicates by email or file_id
        const existingIndex = candidates.findIndex((c: any) => c.email === data.email || (data.file_id && c.file_id === data.file_id));

        if (existingIndex >= 0) {
            candidates[existingIndex] = { ...candidates[existingIndex], ...data, updated_at: new Date() };
        } else {
            candidates.push({ ...data, created_at: new Date(), status: '待面试' });
        }
        this.saveLocalCandidates(candidates);

        // 2. Try Sync to Feishu (Best Effort)
        try {
            await this.syncToFeishu(data);
        } catch (e) {
            console.warn('Feishu Sync Failed (Check credentials):', (e as Error).message);
        }

        return { success: true };
    }

    static async getCandidates() {
        if (!FEISHU_APP_TOKEN || !FEISHU_TABLE_ID) {
            console.warn('Feishu config missing, using local data');
            return this.loadLocalCandidates();
        }

        try {
            const token = await this.getTenantAccessToken();
            if (!token) return this.loadLocalCandidates();

            // Sort by created_time DESC (system field)
            const res = await axios.get(`https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_TABLE_ID}/records?page_size=100&sort=["created_time DESC"]`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.data && res.data.data.items) {
                const mappedItems = res.data.data.items.map((item: any) => {
                    const f = item.fields;
                    // Safely parse JSON fields if needed, but for general table view, raw fields are good.
                    // We still parse specific known fields for backward compatibility with other pages
                    let questions = undefined;
                    let emailDraft = undefined;
                    try { questions = f["questions_list"] ? JSON.parse(f["questions_list"]) : (f["面试题"] ? JSON.parse(f["面试题"]) : undefined); } catch { }
                    try { emailDraft = f["email_draft_list"] ? JSON.parse(f["email_draft_list"]) : (f["邮件内容"] ? JSON.parse(f["邮件内容"]) : undefined); } catch { }

                    return {
                        ...f, // Spread all raw fields for the generic table view
                        // Standardized fields for app logic
                        name: f["candidate_name"] || f["姓名"],
                        email: f["email"] || f["邮箱"],
                        score: f["overall_score"] || f["评分"],
                        summary: f["summary"] || f["总结"],
                        interviewQuestions: questions,
                        emailDraft: emailDraft,
                        status: f["status"] || '待面试',
                        id: item.record_id,
                        created_at: item.created_time
                    };
                });

                // Explicitly sort by created_at descending (newest first)
                return mappedItems.sort((a: any, b: any) => b.created_at - a.created_at);
            }
            return [];
        } catch (e) {
            console.error('Feishu Fetch Failed, falling back to local:', (e as Error).message);
            return this.loadLocalCandidates();
        }
    }

    static async updateCandidate(recordId: string, fields: any) {
        if (!FEISHU_APP_TOKEN || !FEISHU_TABLE_ID) return { success: false, message: 'Feishu config missing' };

        const token = await this.getTenantAccessToken();
        if (!token) return { success: false, message: 'Auth failed' };

        try {
            await axios.put(`https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_TABLE_ID}/records/${recordId}`, {
                fields
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return { success: true };
        } catch (e) {
            console.error('Update Failed', (e as Error).message);
            return { success: false, message: (e as Error).message };
        }
    }

    static async deleteCandidate(recordId: string) {
        if (!FEISHU_APP_TOKEN || !FEISHU_TABLE_ID) {
            return { success: false, message: 'Feishu config missing' };
        }

        const token = await this.getTenantAccessToken();
        if (!token) return { success: false, message: 'Auth failed' };

        try {
            await axios.delete(`https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_TABLE_ID}/records/${recordId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return { success: true };
        } catch (e) {
            const status = (e as any).response?.status;
            console.error('Delete Failed:', (e as Error).message, 'Status:', status);

            if (status === 403) {
                return {
                    success: false,
                    message: 'Permission denied: Feishu App lacks "write" permission for Bitable. Go to Feishu Console -> Permissions -> Enable "bitable:app:records:write".'
                };
            }
            return { success: false, message: (e as Error).message };
        }
    }

    private static loadLocalCandidates() {
        if (!fs.existsSync(DB_FILE)) return [];
        try {
            return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        } catch { return []; }
    }

    private static saveLocalCandidates(data: any[]) {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    }

    private static async syncToFeishu(data: any) {
        if (!FEISHU_APP_ID || !FEISHU_APP_SECRET || !FEISHU_APP_TOKEN || !FEISHU_TABLE_ID) {
            return;
        }

        const token = await this.getTenantAccessToken();
        if (!token) return;

        // Map data to Feishu Fields
        // JSON.stringify complex objects to text fields
        const fields = {
            "candidate_name": data.name,
            "overall_score": data.score,
            "email": data.email,
            "summary": data.summary,
            "questions_list": data.interviewQuestions ? JSON.stringify(data.interviewQuestions) : "",
            "email_draft_list": data.emailDraft ? JSON.stringify(data.emailDraft) : "",
            "status": "待面试"
        };

        await axios.post(`https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_TABLE_ID}/records`, {
            fields: fields
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }

    private static async getTenantAccessToken() {
        try {
            const res = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
                app_id: FEISHU_APP_ID,
                app_secret: FEISHU_APP_SECRET
            });
            return res.data.tenant_access_token;
        } catch (e) {
            console.error('Failed to get Feishu Token', e);
            return null;
        }
    }
}
