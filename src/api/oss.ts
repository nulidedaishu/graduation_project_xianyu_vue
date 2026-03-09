import request from '@/utils/request'

/**
 * OSS签名信息接口
 * 后端返回的表单上传签名数据
 */
export interface OssSignature {
  /** 上传文件前缀目录 */
  dir: string
  /** OSS Bucket域名 */
  host: string
  /** Base64编码的上传策略 */
  policy: string
  /** STS安全令牌 */
  security_token: string
  /** 签名字符串 */
  signature: string
  /** 派生密钥参数 */
  x_oss_credential: string
  /** 请求时间(ISO 8601格式) */
  x_oss_date: string
  /** 签名版本(固定值OSS4-HMAC-SHA256) */
  version: string
  /** Base64编码的回调信息 */
  callback: string
}

/**
 * 获取OSS上传签名
 * 用于前端直传阿里云OSS
 * @returns OSS签名信息
 */
export const getOssSignature = (): Promise<OssSignature> => {
  return request.get('/get_post_signature_for_oss_upload')
}
