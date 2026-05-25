/**
 * 청소해라(부모·자녀) 브라우저 API 단일 진입점.
 * UI·훅·스토어는 이 파일만 import. cleaning API는 @/app/cleaning/api 사용.
 */
export {
  loginParent,
  signupParent,
  fetchParentMe,
  logoutParentSession,
  logoutChildSession,
  type AuthResponse,
  type MeResponse,
} from '@/lib/api/auth';

export {
  fetchFamilySummary,
  updateFamilyProfile,
  type FamilySummary,
} from '@/lib/api/family';

export {
  fetchPointsBalance,
  earnPoints,
  spendPoints,
} from '@/lib/api/points';

export {
  fetchLogCalendar,
  fetchLogDetail,
  fetchLogMessages,
  postLogMessage,
  uploadLogPhoto,
  patchLogMeta,
  type LogDetail,
  type LogMessagesResponse,
  type PostLogMessageResponse,
  type UploadLogPhotoResponse,
  type LogCalendarResponse,
} from '@/lib/api/logs';

export {
  fetchShopRewards,
  createShopReward,
  updateShopReward,
  deleteShopReward,
  fetchDailyQuests,
  createDailyQuest,
  deleteDailyQuest,
  completeDailyQuest,
  type ShopReward,
  type DailyQuest,
  type DailyQuestListResponse,
  type CompleteDailyQuestResponse,
} from '@/lib/api/rewards';

export {
  fetchLockPolicy,
  updateLockPolicy,
  type LockPolicy,
} from '@/lib/api/lock';

export {
  issuePairCode,
  verifyPairCode,
  refreshChildDeviceToken,
  fetchPairCodeStatus,
  type PairIssueResponse,
  type PairVerifyResponse,
  type PairRefreshResponse,
  type PairStatusResponse,
} from '@/lib/api/pair';

export {
  fetchPraisePresets,
  addPraisePreset,
  deletePraisePreset,
  type PraisePresetsResponse,
} from '@/lib/api/praise-presets';

export {
  fetchParentProposals,
  acceptParentProposal,
  rejectParentProposal,
  type ParentProposeListResponse,
} from '@/lib/api/parent/propose';

export {
  fetchChildProposals,
  submitChildProposal,
  type ChildProposeListResponse,
} from '@/lib/api/child/propose';

export {
  fetchTtsPersonas,
  fetchTtsScript,
  updatePersona,
  fetchPersonaHistory,
  markPersonaHistorySeen,
  type TtsPersona,
  type TtsScriptResponse,
  type TtsScriptSegment,
  type PersonaUpdateResponse,
  type PersonaHistoryItem,
  type PersonaHistoryResponse,
} from '@/lib/api/tts';
