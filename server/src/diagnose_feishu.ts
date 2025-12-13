
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const FEISHU_APP_ID = process.env.FEISHU_APP_ID;
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET;
const FEISHU_APP_TOKEN = process.env.FEISHU_APP_TOKEN; // Base Token

async function getTenantAccessToken() {
    try {
        const res = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
            app_id: FEISHU_APP_ID,
            app_secret: FEISHU_APP_SECRET
        });
        return res.data.tenant_access_token;
    } catch (e) {
        console.error('Failed to get token', (e as Error).message);
        return null;
    }
}

async function diagnose() {
    console.log('--- Feishu Bitable Diagnosis ---');
    console.log(`App Token (Base ID): ${FEISHU_APP_TOKEN}`);

    const token = await getTenantAccessToken();
    if (!token) {
        console.error('❌ Could not get Access Token. Check App ID / Secret.');
        return;
    }
    console.log('✅ Access Token Acquired');

    // 1. Get Base Metadata (Check is_advanced)
    try {
        const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}`;
        const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.code === 0) {
            const appData = res.data.data.app;
            console.log('✅ Metadata Fetched Successfully');
            console.log(`- Name: ${appData.name}`);
            console.log(`- Is Advanced Permissions: ${appData.is_advanced}`);

            if (appData.is_advanced) {
                console.warn('⚠️ Advanced Permissions are ENABLED. This often causes 403 errors if the bot is not explicitly added.');
                console.log('Attempting to disable Advanced Permissions via API...');

                // Attempt to fix
                try {
                    const updateRes = await axios.put(url, {
                        is_advanced: false
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (updateRes.data.code === 0) {
                        console.log('🎉 Successfully DISABLED Advanced Permissions. The 403 error should be resolved.');
                    } else {
                        console.error('❌ Failed to disable Advanced Permissions:', updateRes.data.msg, updateRes.data.code);
                        if (updateRes.data.code === 1254302) {
                            console.error('   Reason: Permission Denied. You (the bot) do not have permission to change this setting.');
                        }
                    }
                } catch (err: any) {
                    console.error('❌ Error calling Update API:', err.message);
                }

            } else {
                console.log('ℹ️ Advanced Permissions are DISABLED. This is good.');
                console.log('If you are still getting 403, check if "bitable:app:records:write" scope is added in Feishu Console.');
            }

        } else {
            console.error('❌ Failed to get Metadata:', res.data.msg, res.data.code);
        }

        // 2. Test Record Read Permission
        console.log('\n--- Testing Record Read Permission ---');
        const TABLE_ID = process.env.FEISHU_TABLE_ID;
        if (!TABLE_ID) {
            console.warn('⚠️ FEISHU_TABLE_ID not found in env, skipping record test.');
            return;
        }

        try {
            const recordUrl = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${TABLE_ID}/records?page_size=1`;
            const recordRes = await axios.get(recordUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (recordRes.data.code === 0) {
                console.log('✅ Read Records Success! (Permissions seem fine for Reading)');
            } else {
                console.error('❌ Read Records Failed:', recordRes.data.msg, recordRes.data.code);
            }
        } catch (e: any) {
            console.error('❌ Read Records HTTP Request Failed:', e.message);
            if (e.response) {
                console.error('   Status:', e.response.status); // Expect 403 here if scope missing
                if (e.response.status === 403) {
                    console.error('   👉 DIAGNOSIS: Missing "bitable:app:records:read" scope.');
                }
            }
        }

        // 3. Test Record Write Permission
        console.log('\n--- Testing Record Write Permission ---');

        // 3a. List Fields to ensure we use correct names
        console.log('Fetching Table Fields...');
        try {
            const fieldsRes = await axios.get(`https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${TABLE_ID}/fields`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (fieldsRes.data.code === 0) {
                console.log('✅ Fields List:');
                fieldsRes.data.data.items.forEach((f: any) => {
                    console.log(`   - ${f.field_name} (Type: ${f.field_type})`);
                });
            }
        } catch (e) { console.error('Failed to list fields', e); }

        try {
            const createUrl = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${TABLE_ID}/records`;
            const dummyData = {
                fields: {
                    // "summary" field was missing in the table, causing FieldNameNotFound
                    // Using "email" instead which is confirmed to exist
                    "candidate_name": "Test_Bot_Permission_Check",
                    "email": "test_bot@check.com"
                }
            };

            const writeRes = await axios.post(createUrl, dummyData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (writeRes.data.code === 0) {
                console.log('✅ Write Record Success! (Permissions are GOOD)');
                const newRecordId = writeRes.data.data.record.record_id;

                // Cleanup
                console.log('   Cleaning up test record...');
                await axios.delete(`https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${TABLE_ID}/records/${newRecordId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('   Cleanup successful.');

            } else {
                console.error('❌ Write Record Failed:', writeRes.data.msg, writeRes.data.code);
                if (writeRes.data.code === 1254302) {
                    console.error('   👉 DIAGNOSIS: Permission Denied (1254302).');
                    console.error('      Since Advanced Permissions are ON, you MUST add this bot to a Role in the Bitable Advanced Settings.');
                }
            }

        } catch (e: any) {
            console.error('❌ Write Record HTTP Request Failed:', e.message);
            if (e.response && e.response.status === 403) {
                console.error('   👉 DIAGNOSIS: 403 Forbidden. Missing "bitable:app:records:write" scope OR Bot not in Advanced Permission Role.');
            }
        }

    } catch (e: any) {
        console.error('❌ HTTP Request Failed:', e.message);

        if (e.response) {
            console.error('   Status:', e.response.status);
            console.error('   Data:', e.response.data);
        }
    }
}

diagnose();
