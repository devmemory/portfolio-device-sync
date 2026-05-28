export const RETURN_CODE = {
  FAIL: 0,
  SUCCESS: 1,
  EXPIRED_TOKEN: 1000,
  INVALID_TOKEN: 1001,
  UNAUTHORIZED: 1002,
} as const;

export type RETURN_CODE_TYPE = (typeof RETURN_CODE)[keyof typeof RETURN_CODE];
