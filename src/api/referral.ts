import client from './client';
import { getInstallId } from '../utils/device';

export interface ReferralInfo {
  code: string;
  enabled: boolean;
  referee_coins: number;
  referrer_coins: number;
  share_message: string;
  stats: {
    total_referred: number;
    total_rewarded: number;
    total_pending: number;
    coins_earned: number;
  };
}

export type ReferralStatus = 'pending' | 'rewarded' | 'cancelled';

export interface ReferralRow {
  id: string;
  status: ReferralStatus;
  coins: number;
  referee_name: string;
  referee_phone: string;
  created_at: string;
  rewarded_at: string | null;
}

export interface MyReferrals {
  referrals: ReferralRow[];
  summary: {
    total: number;
    rewarded: number;
    pending: number;
    coins_earned: number;
  };
}

/** The backend wraps payloads as { success, data } via a global interceptor. */
function unwrap<T>(raw: any): T {
  let d = raw;
  let guard = 0;
  while (d && d.data !== undefined && guard++ < 5) d = d.data;
  return d as T;
}

export const referralApi = {
  /** My referral code, reward amounts and stats. */
  getMe: async (): Promise<ReferralInfo> => {
    const res = await client.get('/referral/me');
    return unwrap<ReferralInfo>(res.data);
  },

  /** Apply a referrer's code (before first completed order). */
  apply: async (code: string): Promise<{ message: string; referee_coins: number }> => {
    const device_id = await getInstallId().catch(() => undefined);
    const res = await client.post('/referral/apply', {
      code: code.trim().toUpperCase(),
      ...(device_id ? { device_id } : {}),
    });
    return unwrap(res.data);
  },

  /** People I've referred and coins earned. */
  myReferrals: async (): Promise<MyReferrals> => {
    const res = await client.get('/referral/my-referrals');
    return unwrap<MyReferrals>(res.data);
  },
};
