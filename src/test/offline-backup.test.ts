import { describe, expect, it } from 'vitest';
import { validateOfflineBackup } from '../talmud/utils/offlineBackupValidation';
const record = { key: 'Berakhot:2a', tractateId: 'Berakhot', dafId: '2a', savedAt: 123, sizeBytes: 500,
  dafData: { tractateId: 'Berakhot', dafId: '2a', mishnah: [], gemara: [], rashi: [], tosafot: [] } };
describe('offline backup integrity', () => {
  it('accepts matching page identities', () => expect(validateOfflineBackup({ version: 1, records: [record] })).toHaveLength(1));
  it('rejects mismatched keys before import', () => expect(() => validateOfflineBackup({ version: 1, records: [{ ...record, key: 'Berakhot:3a' }] })).toThrow());
  it('rejects duplicates rather than reporting an inflated import count', () => expect(() => validateOfflineBackup({ version: 1, records: [record, record] })).toThrow());
  it('rejects unsupported versions', () => expect(() => validateOfflineBackup({ version: 2, records: [record] })).toThrow());
});