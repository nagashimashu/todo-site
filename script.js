'use strict';

const STORAGE_KEYS = {
  todos: 'personal-task-board.todos.v1',
  settings: 'personal-task-board.settings.v1',
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const DEFAULT_FILTERS = { status: 'all', priority: 'all', category: 'all' };

const state = {
  todos: [],
  theme: 'system',
  sort: 'created-desc',
  filters: { ...DEFAULT_FILTERS },
  search: '',
  editingId: null,
  pendingAction: null,
};

const elements = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  bindEvents();
  initializeTheme();
  loadSettings();
  loadTodos();
  setTodayDate();
  renderAll();
  applyTheme();
});

function cacheElements() {
  elements.searchInput = document.getElementById('searchInput');
  elements.sortSelect = document.getElementById('sortSelect');
  elements.resetFiltersButton = document.getElementById('resetFiltersButton');
  elements.todoList = document.getElementById('todoList');
  elements.activeFilters = document.getElementById('activeFilters');
  elements.statusFilters = document.getElementById('statusFilters');
  elements.priorityFilters = document.getElementById('priorityFilters');
  elements.categoryFilters = document.getElementById('categoryFilters');
  elements.pendingCount = document.getElementById('pendingCount');
  elements.todayCount = document.getElementById('todayCount');
  elements.overdueCount = document.getElementById('overdueCount');
  elements.completedCount = document.getElementById('completedCount');
  elements.completionRateValue = document.getElementById('completionRateValue');
  elements.completionProgress = document.getElementById('completionProgress');
  elements.todayDate = document.getElementById('todayDate');
  elements.settingsButton = document.getElementById('settingsButton');
  elements.themeToggleButton = document.getElementById('themeToggleButton');
  elements.addTodoButton = document.getElementById('addTodoButton');

  elements.todoDialog = document.getElementById('todoDialog');
  elements.todoForm = document.getElementById('todoForm');
  elements.todoTitle = document.getElementById('todoTitle');
  elements.todoDescription = document.getElementById('todoDescription');
  elements.todoDueDate = document.getElementById('todoDueDate');
  elements.todoPriority = document.getElementById('todoPriority');
  elements.todoCategory = document.getElementById('todoCategory');
  elements.todoError = document.getElementById('todoError');
  elements.titleCounter = document.getElementById('titleCounter');
  elements.descriptionCounter = document.getElementById('descriptionCounter');
  elements.deleteTodoFromDialogButton = document.getElementById('deleteTodoFromDialogButton');
  elements.categorySuggestions = document.getElementById('categorySuggestions');

  elements.settingsDialog = document.getElementById('settingsDialog');
  elements.backupButton = document.getElementById('backupButton');
  elements.restoreButton = document.getElementById('restoreButton');
  elements.addSampleDataButton = document.getElementById('addSampleDataButton');
  elements.deleteCompletedButton = document.getElementById('deleteCompletedButton');
  elements.deleteAllButton = document.getElementById('deleteAllButton');
  elements.importFileInput = document.getElementById('importFileInput');

  elements.confirmDialog = document.getElementById('confirmDialog');
  elements.confirmTitle = document.getElementById('confirmTitle');
  elements.confirmMessage = document.getElementById('confirmMessage');
  elements.confirmPrimaryButton = document.getElementById('confirmPrimaryButton');
  elements.confirmSecondaryButton = document.getElementById('confirmSecondaryButton');
  elements.confirmCancelButton = document.getElementById('confirmCancelButton');

  elements.toastContainer = document.getElementById('toastContainer');
}

function bindEvents() {
  elements.searchInput.addEventListener('input', (event) => {
    state.search = event.target.value;
    renderAll();
  });

  elements.sortSelect.addEventListener('change', (event) => {
    state.sort = event.target.value;
    saveSettings();
    renderAll();
  });

  elements.resetFiltersButton.addEventListener('click', () => {
    state.search = '';
    state.filters = { ...DEFAULT_FILTERS };
    elements.searchInput.value = '';
    saveSettings();
    renderAll();
  });

  elements.themeToggleButton.addEventListener('click', () => {
    const nextTheme = state.theme === 'system' ? 'light' : state.theme === 'light' ? 'dark' : 'system';
    state.theme = nextTheme;
    saveSettings();
    applyTheme();
    updateThemeButtonLabel();
  });

  elements.settingsButton.addEventListener('click', () => openDialog('settingsDialog'));
  elements.addTodoButton.addEventListener('click', () => openCreateTodoDialog());

  document.addEventListener('click', (event) => {
    const filterChip = event.target.closest('[data-status-filter]');
    if (filterChip) {
      const status = filterChip.dataset.statusFilter;
      if (status === state.filters.status) {
        state.filters.status = 'all';
      } else {
        state.filters.status = status;
      }
      saveSettings();
      renderAll();
      return;
    }

    const priorityChip = event.target.closest('[data-priority-filter]');
    if (priorityChip) {
      const priority = priorityChip.dataset.priorityFilter;
      if (priority === state.filters.priority) {
        state.filters.priority = 'all';
      } else {
        state.filters.priority = priority;
      }
      saveSettings();
      renderAll();
      return;
    }

    const categoryChip = event.target.closest('[data-category-filter]');
    if (categoryChip) {
      const category = categoryChip.dataset.categoryFilter;
      if (category === state.filters.category) {
        state.filters.category = 'all';
      } else {
        state.filters.category = category;
      }
      saveSettings();
      renderAll();
      return;
    }

    const statCard = event.target.closest('[data-stat]');
    if (statCard) {
      handleStatClick(statCard.dataset.stat);
      return;
    }

    const deleteButton = event.target.closest('[data-delete-id]');
    if (deleteButton) {
      const id = deleteButton.dataset.deleteId;
      deleteTodo(id);
      return;
    }

    const editButton = event.target.closest('[data-edit-id]');
    if (editButton) {
      openEditTodoDialog(editButton.dataset.editId);
      return;
    }

    const toggleCheckbox = event.target.closest('[data-toggle-id]');
    if (toggleCheckbox) {
      const id = toggleCheckbox.dataset.toggleId;
      toggleCompletion(id);
      return;
    }

    const closeTarget = event.target.closest('[data-close-modal]');
    if (closeTarget) {
      closeDialog(closeTarget.dataset.closeModal);
      return;
    }

    const themeOption = event.target.closest('[name="themeOption"]');
    if (themeOption) {
      state.theme = themeOption.value;
      saveSettings();
      applyTheme();
      updateThemeButtonLabel();
    }
  });

  elements.todoTitle.addEventListener('input', updateTitleCounter);
  elements.todoDescription.addEventListener('input', updateDescriptionCounter);

  elements.todoForm.addEventListener('submit', (event) => {
    event.preventDefault();
    saveTodoFromForm();
  });

  elements.deleteTodoFromDialogButton.addEventListener('click', () => {
    const id = state.editingId || elements.todoForm.dataset.todoId;
    if (!id) {
      return;
    }
    deleteTodo(id);
  });

  elements.addSampleDataButton.addEventListener('click', () => {
    addSampleTasks();
  });

  elements.backupButton.addEventListener('click', () => {
    exportBackup();
  });

  elements.restoreButton.addEventListener('click', () => {
    elements.importFileInput.value = '';
    elements.importFileInput.click();
  });

  elements.importFileInput.addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('ファイルサイズが大きすぎます。2MB以内のJSONファイルを選択してください。', 'error');
      event.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validated = validateBackupPayload(parsed);
      if (!validated.valid) {
        throw new Error(validated.message);
      }

      const importedTodos = validated.todos;
      openConfirmationDialog({
        title: 'JSON復元',
        message: '復元方法を選択してください。',
        confirmText: '現在のTODOへ追加',
        secondaryText: '現在のTODOと置き換え',
        cancelText: 'キャンセル',
        destructiveConfirm: false,
      }, () => applyImportedTodos(importedTodos, 'add'), () => applyImportedTodos(importedTodos, 'replace'));
    } catch (error) {
      showToast(error.message || '不正なJSONファイルです。', 'error');
    } finally {
      event.target.value = '';
    }
  });

  elements.deleteCompletedButton.addEventListener('click', () => {
    const completedTodos = state.todos.filter((todo) => todo.completed);
    if (completedTodos.length === 0) {
      showToast('完了済みTODOはありません。', 'warning');
      return;
    }

    openConfirmationDialog({
      title: '完了済みTODOを一括削除',
      message: '完了済みTODOをすべて削除しますか？この操作は取り消せません。',
      confirmText: '削除',
      cancelText: 'キャンセル',
      destructiveConfirm: true,
    }, () => {
      state.todos = state.todos.filter((todo) => !todo.completed);
      saveTodos();
      renderAll();
      showToast('完了済みTODOを削除しました。', 'success');
    });
  });

  elements.deleteAllButton.addEventListener('click', () => {
    openConfirmationDialog({
      title: '全データ削除',
      message: 'すべてのTODOを削除しますか？この操作は取り消せません。',
      confirmText: '全削除',
      cancelText: 'キャンセル',
      destructiveConfirm: true,
    }, () => {
      state.todos = [];
      saveTodos();
      renderAll();
      showToast('すべてのTODOを削除しました。', 'success');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const openDialogName = getOpenDialogName();
      if (openDialogName) {
        closeDialog(openDialogName);
      }
    }
  });
}

function initializeTheme() {
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = systemTheme;
}

function applyTheme() {
  const resolvedTheme = state.theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : state.theme;
  document.documentElement.dataset.theme = resolvedTheme;

  const themeOptions = document.querySelectorAll('[name="themeOption"]');
  themeOptions.forEach((option) => {
    option.checked = option.value === state.theme;
  });

  updateThemeButtonLabel();
}

function updateThemeButtonLabel() {
  const label = state.theme === 'system' ? 'テーマ: システム' : state.theme === 'dark' ? 'テーマ: ダーク' : 'テーマ: ライト';
  elements.themeToggleButton.querySelector('.button-text').textContent = label;
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2800);
}

function setTodayDate() {
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  });
  elements.todayDate.textContent = formatter.format(new Date());
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if (parsed.theme === 'light' || parsed.theme === 'dark' || parsed.theme === 'system') {
        state.theme = parsed.theme;
      }
      if (parsed.sort && typeof parsed.sort === 'string') {
        state.sort = parsed.sort;
      }
      if (parsed.filters && typeof parsed.filters === 'object') {
        state.filters = { ...DEFAULT_FILTERS, ...parsed.filters };
      }
      if (parsed.search && typeof parsed.search === 'string') {
        state.search = parsed.search;
      }
      if (elements.searchInput) {
        elements.searchInput.value = state.search;
      }
      if (elements.sortSelect) {
        elements.sortSelect.value = state.sort;
      }
    }
  } catch (error) {
    showToast('設定の読み込みに失敗しました。', 'warning');
  }
}

function saveSettings() {
  try {
    const payload = {
      theme: state.theme,
      sort: state.sort,
      filters: state.filters,
      search: state.search,
      version: 1,
    };
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(payload));
  } catch (error) {
    showToast('設定の保存に失敗しました。', 'error');
  }
}

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.todos);
    if (!raw) {
      state.todos = [];
      return;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('保存データが不正です。');
    }
    state.todos = parsed.map((item) => normalizeTodo(item)).filter(Boolean);
  } catch (error) {
    state.todos = [];
    showToast('保存データを読み込めなかったため、空のリストで開始します。', 'warning');
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEYS.todos, JSON.stringify(state.todos));
  } catch (error) {
    showToast('TODOの保存に失敗しました。容量を確認してください。', 'error');
  }
}

function renderAll() {
  renderDashboard();
  renderFilters();
  renderTodoList();
  saveSettings();
  updateThemeButtonLabel();
}

function renderDashboard() {
  const total = state.todos.length;
  const pending = state.todos.filter((todo) => !todo.completed).length;
  const completed = state.todos.filter((todo) => todo.completed).length;
  const dueToday = state.todos.filter((todo) => !todo.completed && getDueState(todo) === 'today').length;
  const overdue = state.todos.filter((todo) => !todo.completed && getDueState(todo) === 'overdue').length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  elements.pendingCount.textContent = String(pending);
  elements.todayCount.textContent = String(dueToday);
  elements.overdueCount.textContent = String(overdue);
  elements.completedCount.textContent = String(completed);
  elements.completionRateValue.textContent = `${completionRate}%`;
  elements.completionProgress.style.width = `${completionRate}%`;
}

function renderFilters() {
  const statusLabels = [
    { value: 'all', label: 'すべて' },
    { value: 'today', label: '今日' },
    { value: 'pending', label: '未完了' },
    { value: 'completed', label: '完了済み' },
    { value: 'overdue', label: '期限切れ' },
  ];

  const priorityLabels = [
    { value: 'all', label: 'すべて' },
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' },
  ];

  const categories = getCategoryOptions();
  elements.statusFilters.replaceChildren(...statusLabels.map(createFilterChip('status', statusLabels)));
  elements.priorityFilters.replaceChildren(...priorityLabels.map(createFilterChip('priority', priorityLabels)));
  elements.categoryFilters.replaceChildren(...buildCategoryChips(categories));

  renderActiveFilters();
}

function createFilterChip(type, labels) {
  return (item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-chip';
    button.textContent = item.label;
    if (type === 'status') {
      button.dataset.statusFilter = item.value;
      if (state.filters.status === item.value) {
        button.classList.add('is-active');
      }
    }
    if (type === 'priority') {
      button.dataset.priorityFilter = item.value;
      if (state.filters.priority === item.value) {
        button.classList.add('is-active');
      }
    }
    return button;
  };
}

function buildCategoryChips(categories) {
  const chips = [{ value: 'all', label: 'すべて' }];
  categories.forEach((category) => {
    chips.push({ value: category, label: category });
  });

  return chips.map((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-chip';
    button.dataset.categoryFilter = item.value;
    button.textContent = item.label;
    if (state.filters.category === item.value) {
      button.classList.add('is-active');
    }
    return button;
  });
}

function renderActiveFilters() {
  const tags = [];
  if (state.search.trim()) {
    tags.push(`検索: ${state.search.trim()}`);
  }
  if (state.filters.status !== 'all') {
    tags.push(`状態: ${labelForStatus(state.filters.status)}`);
  }
  if (state.filters.priority !== 'all') {
    tags.push(`優先度: ${labelForPriority(state.filters.priority)}`);
  }
  if (state.filters.category !== 'all') {
    tags.push(`カテゴリ: ${state.filters.category}`);
  }

  elements.activeFilters.replaceChildren();
  if (tags.length === 0) {
    const text = document.createElement('span');
    text.className = 'field-label';
    text.textContent = '現在の条件: すべて';
    elements.activeFilters.appendChild(text);
    return;
  }

  tags.forEach((tagText) => {
    const tag = document.createElement('span');
    tag.className = 'active-filter-tag';
    tag.textContent = tagText;
    elements.activeFilters.appendChild(tag);
  });
}

function renderTodoList() {
  elements.todoList.replaceChildren();
  const visibleTodos = getVisibleTodos();

  if (visibleTodos.length === 0) {
    const stateNode = buildEmptyState();
    elements.todoList.appendChild(stateNode);
    return;
  }

  visibleTodos.forEach((todo) => {
    const card = buildTodoCard(todo);
    elements.todoList.appendChild(card);
  });
}

function buildEmptyState() {
  const wrapper = document.createElement('div');
  wrapper.className = 'empty-state';

  const title = document.createElement('h3');
  title.textContent = state.todos.length === 0 ? 'まだTODOがありません' : '条件に一致するTODOがありません';

  const message = document.createElement('p');
  message.textContent = state.todos.length === 0
    ? '最初のTODOを追加して、今日の予定を整理しましょう。'
    : '検索条件や絞り込み条件を見直して、もう一度お試しください。';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'primary-button';
  button.textContent = state.todos.length === 0 ? '最初のTODOを追加' : '条件をリセット';
  button.addEventListener('click', () => {
    if (state.todos.length === 0) {
      openCreateTodoDialog();
      return;
    }
    state.search = '';
    state.filters = { ...DEFAULT_FILTERS };
    elements.searchInput.value = '';
    renderAll();
  });

  wrapper.appendChild(title);
  wrapper.appendChild(message);
  wrapper.appendChild(button);
  return wrapper;
}

function buildTodoCard(todo) {
  const card = document.createElement('article');
  card.className = 'todo-card';

  const dueState = getDueState(todo);
  if (dueState === 'overdue') {
    card.classList.add('is-overdue');
  }
  if (dueState === 'today') {
    card.classList.add('is-today');
  }
  if (todo.completed) {
    card.classList.add('is-completed');
  }

  const main = document.createElement('div');
  main.className = 'todo-main';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = todo.completed;
  checkbox.className = 'todo-check';
  checkbox.setAttribute('aria-label', `${todo.title}を完了済みにする`);
  checkbox.dataset.toggleId = todo.id;

  const content = document.createElement('div');
  content.className = 'todo-content';

  const title = document.createElement('h3');
  title.className = 'todo-title';
  title.textContent = todo.title;

  const description = document.createElement('p');
  description.className = 'todo-description';
  description.textContent = todo.description ? truncateText(todo.description, 120) : '詳細なし';

  const meta = document.createElement('div');
  meta.className = 'todo-meta';

  const dueText = buildDueTag(todo);
  const priorityTag = buildPriorityTag(todo.priority);
  const categoryTag = buildCategoryTag(todo.category);
  const statusTag = buildStatusTag(todo);

  meta.appendChild(dueText);
  meta.appendChild(priorityTag);
  if (todo.category) {
    meta.appendChild(categoryTag);
  }
  meta.appendChild(statusTag);

  content.appendChild(title);
  if (todo.description) {
    content.appendChild(description);
  }
  content.appendChild(meta);
  main.appendChild(checkbox);
  main.appendChild(content);

  const actions = document.createElement('div');
  actions.className = 'todo-card-actions';

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.className = 'todo-action';
  editButton.textContent = '編集';
  editButton.dataset.editId = todo.id;
  editButton.setAttribute('aria-label', `${todo.title}を編集`);

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'todo-action delete';
  deleteButton.textContent = '削除';
  deleteButton.dataset.deleteId = todo.id;
  deleteButton.setAttribute('aria-label', `${todo.title}を削除`);

  actions.appendChild(editButton);
  actions.appendChild(deleteButton);

  card.appendChild(main);
  card.appendChild(actions);
  return card;
}

function buildDueTag(todo) {
  const tag = document.createElement('span');
  tag.className = 'tag';

  if (!todo.dueDate) {
    tag.textContent = '期限なし';
    tag.classList.add('category-tag');
    return tag;
  }

  const dueDate = new Date(`${todo.dueDate}T00:00:00`);
  const formatter = new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' });
  const label = formatter.format(dueDate);
  tag.textContent = `期限: ${label}`;

  if (todo.completed) {
    tag.classList.add('category-tag');
    return tag;
  }

  if (getDueState(todo) === 'today') {
    tag.classList.add('status-today');
    return tag;
  }

  if (getDueState(todo) === 'overdue') {
    tag.classList.add('status-overdue');
    return tag;
  }

  tag.classList.add('category-tag');
  return tag;
}

function buildPriorityTag(priority) {
  const tag = document.createElement('span');
  tag.className = `tag priority-${priority}`;
  tag.textContent = `優先度: ${labelForPriority(priority)}`;
  return tag;
}

function buildCategoryTag(category) {
  const tag = document.createElement('span');
  tag.className = 'tag category-tag';
  tag.textContent = `カテゴリ: ${category}`;
  return tag;
}

function buildStatusTag(todo) {
  const tag = document.createElement('span');
  tag.className = 'tag status-tag';

  if (todo.completed) {
    tag.textContent = '完了済み';
    tag.classList.add('status-completed');
    return tag;
  }

  if (getDueState(todo) === 'today') {
    tag.textContent = '今日が期限';
    tag.classList.add('status-today');
    return tag;
  }

  if (getDueState(todo) === 'overdue') {
    tag.textContent = '期限切れ';
    tag.classList.add('status-overdue');
    return tag;
  }

  tag.textContent = '未完了';
  return tag;
}

function getVisibleTodos() {
  const searchTerm = state.search.trim().toLowerCase();
  let filtered = [...state.todos];

  if (searchTerm) {
    filtered = filtered.filter((todo) => {
      const haystack = `${todo.title} ${todo.description} ${todo.category}`.toLowerCase();
      return haystack.includes(searchTerm);
    });
  }

  if (state.filters.status !== 'all') {
    filtered = filtered.filter((todo) => matchesStatusFilter(todo, state.filters.status));
  }

  if (state.filters.priority !== 'all') {
    filtered = filtered.filter((todo) => todo.priority === state.filters.priority);
  }

  if (state.filters.category !== 'all') {
    filtered = filtered.filter((todo) => todo.category === state.filters.category);
  }

  filtered.sort((a, b) => compareTodos(a, b, state.sort));
  return filtered;
}

function compareTodos(a, b, sortType) {
  switch (sortType) {
    case 'created-asc':
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    case 'due-asc': {
      const aDue = a.dueDate ? new Date(`${a.dueDate}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
      const bDue = b.dueDate ? new Date(`${b.dueDate}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
      if (aDue === bDue) {
        return compareTodos(a, b, 'created-desc');
      }
      return aDue - bDue;
    }
    case 'priority-desc': {
      const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return compareTodos(a, b, 'created-desc');
    }
    case 'title-asc': {
      const titleDiff = a.title.localeCompare(b.title, 'ja', { sensitivity: 'base' });
      if (titleDiff !== 0) {
        return titleDiff;
      }
      return compareTodos(a, b, 'created-desc');
    }
    case 'created-desc':
    default:
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }
}

function matchesStatusFilter(todo, status) {
  switch (status) {
    case 'today':
      return !todo.completed && getDueState(todo) === 'today';
    case 'pending':
      return !todo.completed;
    case 'completed':
      return todo.completed;
    case 'overdue':
      return !todo.completed && getDueState(todo) === 'overdue';
    default:
      return true;
  }
}

function getDueState(todo) {
  if (todo.completed) {
    return 'completed';
  }
  if (!todo.dueDate) {
    return 'none';
  }

  const today = getTodayString();
  if (todo.dueDate === today) {
    return 'today';
  }
  if (todo.dueDate < today) {
    return 'overdue';
  }
  return 'upcoming';
}

function getTodayString() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getCategoryOptions() {
  const categories = new Set();
  state.todos.forEach((todo) => {
    if (todo.category && todo.category.trim()) {
      categories.add(todo.category.trim());
    }
  });
  return [...categories].sort((a, b) => a.localeCompare(b, 'ja', { sensitivity: 'base' }));
}

function handleStatClick(statName) {
  const currentStatus = state.filters.status;
  if (statName === 'pending') {
    state.filters.status = currentStatus === 'pending' ? 'all' : 'pending';
  } else if (statName === 'today') {
    state.filters.status = currentStatus === 'today' ? 'all' : 'today';
  } else if (statName === 'overdue') {
    state.filters.status = currentStatus === 'overdue' ? 'all' : 'overdue';
  } else if (statName === 'completed') {
    state.filters.status = currentStatus === 'completed' ? 'all' : 'completed';
  }
  saveSettings();
  renderAll();
}

function openCreateTodoDialog() {
  state.editingId = null;
  elements.todoForm.dataset.mode = 'create';
  elements.todoForm.dataset.todoId = '';
  elements.todoDialog.classList.remove('hidden');
  elements.todoDialog.setAttribute('aria-hidden', 'false');
  elements.todoTitle.value = '';
  elements.todoDescription.value = '';
  elements.todoDueDate.value = '';
  elements.todoPriority.value = 'medium';
  elements.todoCategory.value = '';
  elements.todoError.textContent = '';
  elements.deleteTodoFromDialogButton.classList.add('hidden');
  document.getElementById('todoDialogTitle').textContent = '新規TODO';
  updateTitleCounter();
  updateDescriptionCounter();
  setTimeout(() => elements.todoTitle.focus(), 50);
}

function openEditTodoDialog(id) {
  const todo = state.todos.find((item) => item.id === id);
  if (!todo) {
    showToast('対象のTODOが見つかりませんでした。', 'warning');
    return;
  }

  state.editingId = id;
  elements.todoForm.dataset.mode = 'edit';
  elements.todoForm.dataset.todoId = id;
  elements.todoTitle.value = todo.title;
  elements.todoDescription.value = todo.description || '';
  elements.todoDueDate.value = todo.dueDate || '';
  elements.todoPriority.value = todo.priority;
  elements.todoCategory.value = todo.category || '';
  elements.todoError.textContent = '';
  elements.deleteTodoFromDialogButton.classList.remove('hidden');
  document.getElementById('todoDialogTitle').textContent = 'TODOを編集';
  updateTitleCounter();
  updateDescriptionCounter();
  openDialog('todoDialog');
  setTimeout(() => elements.todoTitle.focus(), 50);
}

function openDialog(dialogId) {
  const dialog = document.getElementById(dialogId);
  if (!dialog) {
    return;
  }
  dialog.classList.remove('hidden');
  dialog.setAttribute('aria-hidden', 'false');
  if (dialogId === 'settingsDialog') {
    const currentThemeOption = document.querySelector(`input[name="themeOption"][value="${state.theme}"]`);
    if (currentThemeOption) {
      currentThemeOption.checked = true;
    }
  }
  if (dialogId === 'todoDialog') {
    const target = elements.todoTitle;
    if (target) {
      setTimeout(() => target.focus(), 80);
    }
  }
}

function closeDialog(dialogId) {
  const dialog = document.getElementById(dialogId);
  if (!dialog) {
    return;
  }
  dialog.classList.add('hidden');
  dialog.setAttribute('aria-hidden', 'true');
  if (dialogId === 'confirmDialog') {
    elements.confirmPrimaryButton.classList.remove('hidden');
    elements.confirmSecondaryButton.classList.add('hidden');
    elements.confirmPrimaryButton.textContent = '削除';
    elements.confirmSecondaryButton.textContent = '追加';
    elements.confirmSecondaryButton.classList.remove('danger-button');
    elements.confirmPrimaryButton.classList.add('danger-button');
    state.pendingAction = null;
  }
}

function getOpenDialogName() {
  const names = ['todoDialog', 'settingsDialog', 'confirmDialog'];
  return names.find((name) => !document.getElementById(name).classList.contains('hidden')) || null;
}

function openConfirmationDialog({ title, message, confirmText, secondaryText = '', cancelText = 'キャンセル', destructiveConfirm = true }, onConfirm, onSecondary) {
  elements.confirmTitle.textContent = title;
  elements.confirmMessage.textContent = message;
  elements.confirmPrimaryButton.textContent = confirmText;
  elements.confirmCancelButton.textContent = cancelText;

  if (secondaryText) {
    elements.confirmSecondaryButton.textContent = secondaryText;
    elements.confirmSecondaryButton.classList.remove('hidden');
  } else {
    elements.confirmSecondaryButton.classList.add('hidden');
  }

  if (destructiveConfirm) {
    elements.confirmPrimaryButton.classList.add('danger-button');
    elements.confirmPrimaryButton.classList.remove('secondary-button');
    elements.confirmSecondaryButton.classList.remove('danger-button');
  } else {
    elements.confirmPrimaryButton.classList.remove('danger-button');
    elements.confirmPrimaryButton.classList.add('primary-button');
    elements.confirmSecondaryButton.classList.remove('danger-button');
  }

  state.pendingAction = { onConfirm, onSecondary };

  elements.confirmPrimaryButton.onclick = () => {
    closeDialog('confirmDialog');
    if (state.pendingAction && state.pendingAction.onConfirm) {
      state.pendingAction.onConfirm();
    }
  };

  elements.confirmSecondaryButton.onclick = () => {
    closeDialog('confirmDialog');
    if (state.pendingAction && state.pendingAction.onSecondary) {
      state.pendingAction.onSecondary();
    }
  };

  elements.confirmCancelButton.onclick = () => {
    closeDialog('confirmDialog');
  };

  openDialog('confirmDialog');
}

function deleteTodo(id) {
  const todo = state.todos.find((item) => item.id === id);
  if (!todo) {
    showToast('対象のTODOが見つかりませんでした。', 'warning');
    return;
  }

  openConfirmationDialog({
    title: 'TODOを削除',
    message: `「${todo.title}」を削除しますか？この操作は取り消せません。`,
    confirmText: '削除',
    cancelText: 'キャンセル',
    destructiveConfirm: true,
  }, () => {
    state.todos = state.todos.filter((item) => item.id !== id);
    saveTodos();
    renderAll();
    showToast('TODOを削除しました。', 'success');
    closeDialog('todoDialog');
  });
}

function saveTodoFromForm() {
  const title = elements.todoTitle.value.trim();
  const description = elements.todoDescription.value.trim();
  const dueDate = elements.todoDueDate.value;
  const priority = elements.todoPriority.value;
  const category = elements.todoCategory.value.trim();

  const validation = validateTodoDraft({
    title,
    description,
    dueDate,
    priority,
    category,
  });

  if (!validation.valid) {
    elements.todoError.textContent = validation.message;
    return;
  }

  const mode = elements.todoForm.dataset.mode || 'create';
  const currentId = elements.todoForm.dataset.todoId;

  if (mode === 'create') {
    const newTodo = {
      id: createTodoId(),
      title,
      description,
      dueDate,
      priority,
      category,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.todos.unshift(newTodo);
    showToast('TODOを追加しました。', 'success');
  } else {
    const todo = state.todos.find((item) => item.id === currentId);
    if (!todo) {
      showToast('対象のTODOが見つかりませんでした。', 'warning');
      return;
    }
    todo.title = title;
    todo.description = description;
    todo.dueDate = dueDate;
    todo.priority = priority;
    todo.category = category;
    todo.updatedAt = new Date().toISOString();
    showToast('TODOを更新しました。', 'success');
  }

  saveTodos();
  closeDialog('todoDialog');
  renderAll();
}

function validateTodoDraft({ title, description, dueDate, priority, category }) {
  if (!title || title.length === 0) {
    return { valid: false, message: 'タイトルは必須です。空白だけでは保存できません。' };
  }

  if (title.length > 100) {
    return { valid: false, message: 'タイトルは100文字以内で入力してください。' };
  }

  if (description.length > 1000) {
    return { valid: false, message: '詳細は1000文字以内で入力してください。' };
  }

  if (category.length > 30) {
    return { valid: false, message: 'カテゴリは30文字以内で入力してください。' };
  }

  if (dueDate) {
    const date = new Date(`${dueDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return { valid: false, message: '期限に不正な日付が含まれています。' };
    }
  }

  if (!['high', 'medium', 'low'].includes(priority)) {
    return { valid: false, message: '優先度が不正です。' };
  }

  return { valid: true };
}

function updateTitleCounter() {
  const count = elements.todoTitle.value.length;
  elements.titleCounter.textContent = `${count} / 100`;
}

function updateDescriptionCounter() {
  const count = elements.todoDescription.value.length;
  elements.descriptionCounter.textContent = `${count} / 1000`;
}

function toggleCompletion(id) {
  const todo = state.todos.find((item) => item.id === id);
  if (!todo) {
    showToast('対象のTODOが見つかりませんでした。', 'warning');
    return;
  }

  todo.completed = !todo.completed;
  todo.updatedAt = new Date().toISOString();
  saveTodos();
  renderAll();
}

function addSampleTasks() {
  const sampleTasks = [
    { title: '週次ミーティングの準備', description: '議題とスケジュールを確認して資料をまとめる', dueDate: getRelativeDate(1), priority: 'high', category: '仕事' },
    { title: '買い物リストを作成', description: '朝食用のパンと飲み物をメモする', dueDate: getRelativeDate(2), priority: 'medium', category: '生活' },
    { title: '学習内容を復習', description: '週末に見直すための短い復習メモを作成する', dueDate: getRelativeDate(0), priority: 'low', category: '学習' },
  ];

  sampleTasks.forEach((sample) => {
    const normalized = normalizeTodo({
      id: createTodoId(),
      title: sample.title,
      description: sample.description,
      dueDate: sample.dueDate,
      priority: sample.priority,
      category: sample.category,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (normalized) {
      state.todos.unshift(normalized);
    }
  });

  saveTodos();
  renderAll();
  showToast('サンプルデータを追加しました。', 'success');
}

function getRelativeDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function exportBackup() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    todos: state.todos,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `personal-task-board-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('JSONバックアップをダウンロードしました。', 'success');
}

function validateBackupPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, message: 'JSONの形式が正しくありません。' };
  }

  if (payload.version !== 1) {
    return { valid: false, message: '対応していないデータ形式です。' };
  }

  if (!Array.isArray(payload.todos)) {
    return { valid: false, message: 'TODO一覧が見つかりません。' };
  }

  const validTodos = payload.todos.map((todo) => normalizeTodo(todo)).filter(Boolean);
  if (validTodos.length !== payload.todos.length) {
    return { valid: false, message: 'TODOデータに不正な項目が含まれています。' };
  }

  return { valid: true, todos: validTodos };
}

function applyImportedTodos(importedTodos, mode) {
  if (mode === 'replace') {
    state.todos = importedTodos.map((task) => ({ ...task, id: ensureUniqueId(task.id) }));
    saveTodos();
    renderAll();
    showToast('JSONを復元して現在のTODOを置き換えました。', 'success');
    return;
  }

  const existingIds = new Set(state.todos.map((todo) => todo.id));
  const merged = [...state.todos];
  importedTodos.forEach((task) => {
    const safeTask = { ...task, id: ensureUniqueId(task.id, existingIds) };
    existingIds.add(safeTask.id);
    merged.push(safeTask);
  });

  state.todos = merged;
  saveTodos();
  renderAll();
  showToast('JSONを読み込み、現在のTODOへ追加しました。', 'success');
}

function ensureUniqueId(inputId, existingIds = new Set(state.todos.map((todo) => todo.id))) {
  const originalId = typeof inputId === 'string' && inputId.trim() ? inputId.trim() : createTodoId();
  if (!existingIds.has(originalId)) {
    existingIds.add(originalId);
    return originalId;
  }

  let nextId = createTodoId();
  while (existingIds.has(nextId)) {
    nextId = createTodoId();
  }
  existingIds.add(nextId);
  return nextId;
}

function createTodoId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTodo(candidate) {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const title = typeof candidate.title === 'string' ? candidate.title.trim() : '';
  if (!title) {
    return null;
  }

  const dueDate = typeof candidate.dueDate === 'string' ? candidate.dueDate : '';
  if (dueDate && Number.isNaN(new Date(`${dueDate}T00:00:00`).getTime())) {
    return null;
  }

  const priority = ['high', 'medium', 'low'].includes(candidate.priority) ? candidate.priority : 'medium';
  const completed = Boolean(candidate.completed);
  const createdAt = typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString();
  const updatedAt = typeof candidate.updatedAt === 'string' ? candidate.updatedAt : createdAt;

  return {
    id: typeof candidate.id === 'string' && candidate.id ? candidate.id : createTodoId(),
    title,
    description: typeof candidate.description === 'string' ? candidate.description : '',
    dueDate,
    priority,
    category: typeof candidate.category === 'string' ? candidate.category.trim() : '',
    completed,
    createdAt,
    updatedAt,
  };
}

function truncateText(value, limit) {
  if (value.length <= limit) {
    return value;
  }
  return `${value.slice(0, limit - 1)}…`;
}

function labelForStatus(value) {
  return {
    all: 'すべて',
    today: '今日',
    pending: '未完了',
    completed: '完了済み',
    overdue: '期限切れ',
  }[value] || 'すべて';
}

function labelForPriority(value) {
  return {
    all: 'すべて',
    high: '高',
    medium: '中',
    low: '低',
  }[value] || 'すべて';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (state.theme === 'system') {
    applyTheme();
  }
});

window.addEventListener('beforeunload', () => {
  saveSettings();
});
