const STORAGE_KEY = 'simpleTodoApp.tasks';
const defaultTasks = [
  { id: 1, text: 'Buy groceries and plan cake ingredients', done: false },
  { id: 2, text: 'Go for a ride with my buddy', done: false },
];

const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const historyButton = document.getElementById('historyButton');
const historyPanel = document.getElementById('historyPanel');
const historyList = document.getElementById('historyList');
const closeHistory = document.getElementById('closeHistory');
const clearCompletedButton = document.getElementById('clearCompleted');
const filterButtons = Array.from(document.querySelectorAll('.filter-button'));
const activeCountEl = document.getElementById('activeCount');
const completedCountEl = document.getElementById('completedCount');
const historyEmpty = document.querySelector('.history-empty');

let tasks = loadTasks();
let currentFilter = 'all';

init();

function init() {
  renderTasks();
  updateStats();
  updateHistoryPanel();
  updateHistoryButton();

  taskForm.addEventListener('submit', (event) => {
    event.preventDefault();
    addTask(taskInput.value);
    taskInput.value = '';
    taskInput.focus();
  });

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => setFilter(button.dataset.filter));
  });

  historyButton.addEventListener('click', openHistoryPanel);
  closeHistory.addEventListener('click', closeHistoryPanel);
  historyPanel.addEventListener('click', (event) => {
    if (event.target === historyPanel) {
      closeHistoryPanel();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && historyPanel.classList.contains('visible')) {
      closeHistoryPanel();
    }
  });
  clearCompletedButton.addEventListener('click', clearCompletedTasks);
}

function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTasks));
    return [...defaultTasks];
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [...defaultTasks];
  } catch (error) {
    console.warn('Failed to parse saved tasks.', error);
    return [...defaultTasks];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getFilteredTasks() {
  return tasks.filter((task) => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'active') return !task.done;
    if (currentFilter === 'completed') return task.done;
    return true;
  });
}

function renderTasks() {
  const visibleTasks = getFilteredTasks();
  taskList.innerHTML = '';

  if (!tasks.length) {
    taskList.innerHTML = '<li class="task-placeholder">No tasks yet. Add your first task to get started.</li>';
    return;
  }

  if (!visibleTasks.length) {
    taskList.innerHTML = `<li class="task-placeholder">No ${currentFilter} tasks found.</li>`;
    return;
  }

  visibleTasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item${task.done ? ' completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.className = 'task-checkbox';
    checkbox.setAttribute('aria-label', `${task.done ? 'Mark incomplete' : 'Mark complete'}: ${task.text}`);
    checkbox.addEventListener('change', () => toggleTaskDone(task.id));

    const label = document.createElement('span');
    label.className = 'task-label';
    label.textContent = task.text;
    label.tabIndex = 0;
    label.setAttribute('role', 'button');
    label.addEventListener('click', () => startEditTask(task.id, label));
    label.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        startEditTask(task.id, label);
      }
    });

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'task-edit';
    editButton.textContent = '✎';
    editButton.title = 'Edit task';
    editButton.addEventListener('click', () => startEditTask(task.id, label));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'task-delete';
    deleteButton.textContent = '✕';
    deleteButton.title = 'Remove task';
    deleteButton.addEventListener('click', () => removeTask(task.id));

    actions.append(editButton, deleteButton);
    item.append(checkbox, label, actions);
    taskList.appendChild(item);
  });
}

function addTask(text) {
  const normalized = text.trim();
  if (!normalized) return;

  const nextId = tasks.length ? Math.max(...tasks.map((task) => task.id)) + 1 : 1;
  tasks.unshift({ id: nextId, text: normalized, done: false });
  saveTasks();
  renderTasks();
  updateStats();
  updateHistoryButton();
  updateHistoryPanel();
}

function toggleTaskDone(taskId) {
  tasks = tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task));
  saveTasks();
  renderTasks();
  updateStats();
  updateHistoryButton();
  updateHistoryPanel();
}

function removeTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderTasks();
  updateStats();
  updateHistoryButton();
  updateHistoryPanel();
}

function startEditTask(taskId, labelElement) {
  const task = tasks.find((entry) => entry.id === taskId);
  if (!task) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = task.text;
  input.className = 'task-edit-input';
  input.setAttribute('aria-label', `Edit task: ${task.text}`);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      finishEditTask(taskId, input.value);
    }
    if (event.key === 'Escape') {
      renderTasks();
    }
  });

  input.addEventListener('blur', () => finishEditTask(taskId, input.value));
  labelElement.replaceWith(input);
  input.focus();
  input.select();
}

function finishEditTask(taskId, value) {
  const trimmed = value.trim();
  if (!trimmed) {
    removeTask(taskId);
    return;
  }

  tasks = tasks.map((task) => (task.id === taskId ? { ...task, text: trimmed } : task));
  saveTasks();
  renderTasks();
}

function getCompletedTasks() {
  return tasks.filter((task) => task.done);
}

function updateStats() {
  const activeCount = tasks.filter((task) => !task.done).length;
  const completedCount = tasks.filter((task) => task.done).length;

  activeCountEl.textContent = `${activeCount} active`;
  completedCountEl.textContent = `${completedCount} completed`;
  clearCompletedButton.disabled = completedCount === 0;
}

function updateHistoryButton() {
  const completedCount = getCompletedTasks().length;
  historyButton.setAttribute('aria-label', `Show ${completedCount} completed ${completedCount === 1 ? 'task' : 'tasks'}`);
}

function updateHistoryPanel() {
  const completedTasks = getCompletedTasks();
  historyList.innerHTML = '';

  if (!completedTasks.length) {
    historyEmpty.style.display = 'block';
    return;
  }

  historyEmpty.style.display = 'none';
  completedTasks.forEach((task) => {
    const item = document.createElement('li');
    item.textContent = task.text;
    historyList.appendChild(item);
  });
}

function setFilter(filterName) {
  currentFilter = filterName;
  filterButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === filterName);
  });
  renderTasks();
}

function openHistoryPanel() {
  historyPanel.classList.add('visible');
  historyPanel.setAttribute('aria-hidden', 'false');
  updateHistoryPanel();
}

function closeHistoryPanel() {
  historyPanel.classList.remove('visible');
  historyPanel.setAttribute('aria-hidden', 'true');
}

function clearCompletedTasks() {
  tasks = tasks.filter((task) => !task.done);
  saveTasks();
  renderTasks();
  updateStats();
  updateHistoryButton();
  updateHistoryPanel();
}
