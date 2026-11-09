const sessionLifecycle = { generation: 0 };

const todayDate = new Date();

const state = {
  authMode: 'login',
  loggedAccount: null,
  themePreference: 'auto',
  balanceMode: 'independent',
  selectedYear: todayDate.getFullYear(),
  selectedMonth: todayDate.getMonth(),
  filterType: 'all',
  searchQuery: '',
  transactions: [],
  bills: [],
  rules: [],
  snapshots: [],
  isRecording: false,
  isSubmittingCommand: false,
  draftItems: [],
  inputSource: 'text',
  billFilter: 'pending',
  view: 'inicio',
  hideValues: false,
  busy: 0,
  syncBusy: false,
  reportSpan: 6,
  reportWindowEnd: null,
  syncError: '',
  saveError: '',
  lastSync: null,
  lastExport: null,
  pendingCount: 0,
  lastAddedIds: [],
  failedLoginAttempts: 0,
  lockoutUntil: 0,
  undo: null,
};

function account() {
  if (!state.loggedAccount) {
    throw new Error('Entre na sua conta para continuar.');
  }
  return state.loggedAccount.accountKey;
}

export { account, sessionLifecycle, state };
