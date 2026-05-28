import { RETURN_CODE } from '@/common/constants';

export const successResponse = (data: any) => ({
  code: RETURN_CODE.SUCCESS,
  message: 'Success',
  data,
});

export const errorResponse = (
  message: string | Record<string, any>,
  code = RETURN_CODE.FAIL,
  data: any = null,
) => {
  let msg = message;

  if (typeof msg === 'object') {
    if ('message' in msg) {
      msg = msg.message;
    } else {
      msg = JSON.stringify(msg);
    }
  }

  return {
    code,
    message: msg,
    data,
  };
};
