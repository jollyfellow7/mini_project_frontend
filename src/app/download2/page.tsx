import type { Metadata } from 'next';
import { Download2Client } from './Download2Client';

export const metadata: Metadata = {
  title: '앱 다운로드 · 청소해라',
  description: '청소해라 부모·자녀 앱 다운로드 — Android APK',
  openGraph: {
    title: '청소해라 앱 다운로드',
    description: '부모 PWA · 자녀 Android APK',
  },
};

export default function Download2Page() {
  return <Download2Client />;
}
