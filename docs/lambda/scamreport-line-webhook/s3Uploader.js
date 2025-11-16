import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

const S3_BUCKET = process.env.S3_BUCKET;
const S3_PREFIX = process.env.S3_PREFIX || 'line-media';
const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

function extFromType(ct) {
  if (!ct) return '';
  const map = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
    'video/mp4': 'mp4',
    'audio/mpeg': 'mp3', 'audio/aac': 'aac',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/zip': 'zip',
    'application/octet-stream': ''
  };
  return map[ct] ?? '';
}

async function downloadLineContent(messageId) {
  const url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${LINE_TOKEN}` } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`LINE content fetch failed: ${res.status} ${text}`);
  }
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const arrayBuf = await res.arrayBuffer();
  const buf = Buffer.from(arrayBuf);
  return { buf, contentType, size: buf.length };
}

async function putToS3(key, body, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType
    // private ACL by default
  }));
  return { bucket: S3_BUCKET, key, s3Uri: `s3://${S3_BUCKET}/${key}` };
}

export async function uploadLineMediaToS3({ messageId, userId, messageType, eventTime }) {
  const { buf, contentType, size } = await downloadLineContent(messageId);

  const d = eventTime ? new Date(eventTime) : new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');

  let ext = extFromType(contentType);
  if (!ext && messageType) {
    if (messageType === 'image') ext = 'jpg';
    else if (messageType === 'video') ext = 'mp4';
    else if (messageType === 'audio') ext = 'aac';
  }

  const fileName = ext ? `${messageId}.${ext}` : `${messageId}`;
  const key = `${S3_PREFIX}/${yyyy}/${mm}/${dd}/${userId}/${fileName}`;

  const put = await putToS3(key, buf, contentType);
  return { ...put, contentType, size };
}