import {
  fetchTodos,
  addTodo,
  deleteTodo,
  updateTodo,
} from "../../services/todoService.js";
import { debounce } from "../utils/debounce.js";
import {
  setTasksToLocalStorage,
  getTasksFromLocalStorage,
} from "../utils/localstorage.js";

let tasksCount = 0;
let tasksCountSearch = 0;
let isEditing = false;
let sortDirection = true;

const mainSearchDiv = document.getElementById("main-search-div");
const searchPlaceholder = document.getElementById("search-placeholder");
const smallSearchFields = document.querySelector(".small-search-fields");

mainSearchDiv.addEventListener("click", function () {
  smallSearchFields.classList.remove("hidden")
  smallSearchFields.classList.add("flex")
  searchPlaceholder.classList.add("hidden")
  searchPlaceholder.classList.remove("block")

});

const table = document.querySelector("table");

table.addEventListener("click", (event) => {
  const header = event.target.closest("th"); 
  const headers = Array.from(table.querySelectorAll("th"));

  if (header && headers.includes(header)) {
    const index = headers.indexOf(header);
    if (index < headers.length - 1) {
      sortTable(index); 
    }
  }
});

function updateTaskCount(tasksCount) {
  const taskCountElement = document.getElementById("task-count");
  taskCountElement.textContent = tasksCount;
}


export function populateTable(todos) {
  const tableBody = document.getElementById("todo-body");
  tableBody.innerHTML = "";
  tasksCount = 0;

  todos.forEach((todo) => {
    const row = createTableRow(todo);
    tasksCount++;
    tableBody.appendChild(row);
  });

  updateTaskCount(tasksCount);
  setTasksToLocalStorage(todos);
}

function createTableRow(todo) {
  const row = document.createElement("tr");
  row.setAttribute("data-id", todo.id);

  row.innerHTML = `
        <td>${todo.id}</td>
        <td>${todo.todo}</td>
        <td>${todo.userId}</td>
        <td>${todo.completed ? "Completed" : "Pending"}</td>
        <td>${todo.priority ? todo.priority : 1}</td>
        <td class="task-action">
            <button class="delete-btn">Delete</button>
            <button class="done-btn">${
              todo.completed ? "Undo" : "Done"
            }</button>
        </td>
  `;

  row.addEventListener("click", (event) => {
    const target = event.target;
    event.stopPropagation();

    if (target.classList.contains("delete-btn")) {
      deleteTask(todo.id);
    }
    if (target.classList.contains("done-btn")) {
      doneTask(todo.id);
    }
    if (!target.classList.contains("delete-btn") && !target.classList.contains("done-btn")) {
      makeRowEditable(row, todo);
    }
  });

  return row;
}


function makeRowEditable(row, todo) {
  if (row.classList.contains("editing")) {
    return;
  }
  row.classList.add("editing");
  if (isEditing) {
    alert(
      "You need to save or cancel the current edit before editing another row."
    );
    return;
  }
  row.innerHTML = `
          <td>${todo.id}</td>
          <td><input type="text" value="${
            todo.todo
          }" class="edit-task-input"></td>
          <td><input type="number" value="${
            todo.userId
          }" class="edit-user-id-input"></td>
          <td>
              <select class="edit-status-select">
                  <option value="Pending" ${
                    todo.completed ? "" : "selected"
                  }>Pending</option>
                  <option value="Completed" ${
                    todo.completed ? "selected" : ""
                  }>Completed</option>
              </select>
          </td>
          <td>
            <input 
              type="number" 
              min="1" 
              max="5" 
              value="${todo.priority}" 
              class="edit-priority-input"
              >
          </td>
          <td class="task-action">
          <button class="cancel-btn">Cancel</button>
              <button class="save-btn">Save</button>
          </td>
      `;
  isEditing = true;
  const saveButton = row.querySelector(".save-btn");
  saveButton.addEventListener("click", (event) => {
    event.stopPropagation();
    saveTaskEdit(row, todo.id);
  });
  row.addEventListener("click", () => makeRowEditable(row, todo));
  const cancelButton = row.querySelector(".cancel-btn");
  cancelButton.addEventListener("click", (event) => {
    event.stopPropagation();
    populateTable(getTasksFromLocalStorage());
    isEditing = false;
  });
}
function getEditedTaskValues(row) {
  const editedTaskValue = row.querySelector(".edit-task-input").value;
  const editedUserIdValue = row.querySelector(".edit-user-id-input").value;
  const editedStatusValue = row.querySelector(".edit-status-select").value === "Completed";
  const editedPriorityValue = row.querySelector(".edit-priority-input").value;

  return {
    todo: editedTaskValue,
    userId: editedUserIdValue,
    completed: editedStatusValue,
    priority: editedPriorityValue,
  };
}

function updateTaskInLocalStorage(taskId, updatedTaskData) {
  const tasks = getTasksFromLocalStorage();
  const taskIndex = tasks.findIndex((task) => task.id === taskId);

  if (taskIndex !== -1) {
    tasks[taskIndex] = { ...tasks[taskIndex], ...updatedTaskData };
    setTasksToLocalStorage(tasks);
    return tasks;
  }
  return null;
}

async function sendUpdateToServer(taskId, updatedTaskData) {
  try {
    await updateTodo(taskId, updatedTaskData);
    console.log(`Task ID ${taskId} updated successfully on the server!`);
  } catch (error) {
    console.error(`Failed to update task ID ${taskId} on the server:`, error);
    alert("Failed to update the task on the server.");
  }
}

function refreshTaskTable(tasks) {
  populateTable(tasks);
}

export async function saveTaskEdit(row, taskId) {
  isEditing = false;
  const updatedTaskData = getEditedTaskValues(row);
  const tasks = updateTaskInLocalStorage(taskId, updatedTaskData);

  if (tasks) {
    refreshTaskTable(tasks);
    await sendUpdateToServer(taskId, updatedTaskData);
    
  }
}

function deleteTask(id) {
  const tableBody = document.getElementById("todo-body");
  const rowToDelete = tableBody.querySelector(`tr[data-id="${id}"]`);

  if (rowToDelete) {
    const confirmed = confirm(`Are you sure you want to delete task ID ${id}?`);

    if (confirmed) {
      tableBody.removeChild(rowToDelete);
      tasksCount--;
      deleteTodo(id);
      updateTaskCount(tasksCount);
      const currentTasks = getTasksFromLocalStorage().filter(
        (task) => task.id !== id
      );
      setTasksToLocalStorage(currentTasks);
    }
  } else {
    alert(`Task with ID ${id} not found.`);
  }
}

async function doneTask(id) {
  const tableBody = document.getElementById("todo-body");
  const rowToDone = tableBody.querySelector(`tr[data-id="${id}"]`);

  if (rowToDone) {
    const currentStatusCell = rowToDone.cells[3];
    const currentStatus = currentStatusCell.textContent;
    const newStatus = currentStatus === "Pending" ? "Completed" : "Pending";
    const confirmed = confirm(
      `Are you sure you want to change task ID ${id} to ${newStatus}?`
    );

    if (confirmed) {
      try {
        currentStatusCell.textContent = newStatus;
        const doneButton = rowToDone.querySelector(".done-btn");
        doneButton.textContent = newStatus === "Completed" ? "Undo" : "Done";
        const tasks = getTasksFromLocalStorage().map((task) =>
          task.id === id
            ? { ...task, completed: newStatus === "Completed" }
            : task
        );
        const updatedTodo = await updateTodo(id, {
          completed: newStatus === "Completed",
        });
        setTasksToLocalStorage(tasks);
      } catch (error) {
        alert(`Failed to update task ID ${id}: ${error.message}`);
      }
    }
  } else {
    alert(`Task with ID ${id} not found.`);
  }
}

function addTask() {
  const form = document.querySelector(".add-task-form");
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const taskInput = document.querySelector(".add-task-input");
    const taskValue = taskInput.value;

    if (taskValue) {
      const currentTasks = getTasksFromLocalStorage();
      const newId =
        currentTasks.length > 0
          ? Math.max(...currentTasks.map((task) => task.id)) + 1
          : 1;

      const newTask = {
        id: newId,
        todo: taskValue,
        userId: 1,
        completed: false,
        priority: 1,
      };
      const tableBody = document.getElementById("todo-body");
      const row = createTableRow(newTask);
      if (tableBody.firstChild) {
        tableBody.insertBefore(row, tableBody.firstChild);
      } else {
        tableBody.appendChild(row);
      }
      tasksCount++;
      updateTaskCount(tasksCount);
      addTodo(newTask);
      setTasksToLocalStorage([newTask, ...currentTasks]);
      taskInput.value = "";
    }
  });
}

document.addEventListener("click", function (event) {
  if (
    !mainSearchDiv.contains(event.target) &&
    !smallSearchFields.contains(event.target)
  ) {
    const idInput = document.getElementById("search-id").value.trim();
    const taskInfoInput = document
      .getElementById("search-task-info")
      .value.trim();
    const userIdInput = document.getElementById("search-user-id").value.trim();
    const statusInput = document.getElementById("search-status").value.trim();

    const anyInputHasValue =
      idInput || taskInfoInput || userIdInput || statusInput;
    if (!anyInputHasValue) {
      console.log(1)
      
      smallSearchFields.classList.remove('flex');
      smallSearchFields.classList.remove('block');
      smallSearchFields.classList.add('hidden');
      searchPlaceholder.classList.add('block');
      searchPlaceholder.classList.remove('hidden');

    }
  }
});

function sortTable(columnIndex) {
  const tableBody = document.getElementById("todo-body");
  const rowsArray = Array.from(tableBody.rows);
  sortDirection = !sortDirection;

  rowsArray.sort((rowA, rowB) => {
    const cellA = rowA.cells[columnIndex].textContent.trim().toLowerCase();
    const cellB = rowB.cells[columnIndex].textContent.trim().toLowerCase();

    if (columnIndex === 0 || columnIndex === 2) {
      return sortDirection
        ? parseInt(cellA) - parseInt(cellB)
        : parseInt(cellB) - parseInt(cellA);
    }

    if (cellA < cellB) {
      return sortDirection ? -1 : 1;
    }

    if (cellA > cellB) {
      return sortDirection ? 1 : -1;
    }

    return 0;
  });

  tableBody.innerHTML = "";
  rowsArray.forEach((row) => tableBody.appendChild(row));
}
function searchTasks() {
  const searchValues = {
    id: document.getElementById("search-id").value.toLowerCase(),
    taskInfo: document.getElementById("search-task-info").value.toLowerCase(),
    userId: document.getElementById("search-user-id").value.toLowerCase(),
    status: document.getElementById("search-status").value.toLowerCase(),
    priority: document.getElementById("search-priority").value.toLowerCase(),
  };

  tasksCountSearch = 0;
  const tableBody = document.getElementById("todo-body");
  const rows = tableBody.getElementsByTagName("tr");

  for (let row of rows) {
    const rowValues = {
      id: row.cells[0].textContent.toLowerCase(),
      taskInfo: row.cells[1].textContent.toLowerCase(),
      userId: row.cells[2].textContent.toLowerCase(),
      status: row.cells[3].textContent.toLowerCase(),
      priority: row.cells[4].textContent.toLowerCase(),
    };

    const matches = {
      id: rowValues.id.includes(searchValues.id),
      taskInfo: rowValues.taskInfo.includes(searchValues.taskInfo),
      userId: rowValues.userId.includes(searchValues.userId),
      status: rowValues.status.includes(searchValues.status),
      priority: rowValues.priority.includes(searchValues.priority),
    };

    if (matches.id && matches.taskInfo && matches.userId && matches.status && matches.priority) {
      row.style.display = "";
      tasksCountSearch++;
    } else {
      row.style.display = "none";
    }
  }
  
  updateTaskCount(tasksCountSearch);
}
function addSearchListeners() {
  const debouncedSearchTasks = debounce(searchTasks, 300);
  document.querySelectorAll(".small-input").forEach((input) => {
    input.addEventListener("keyup", debouncedSearchTasks);
  });
}

async function init() {
  const loader = document.getElementById("loader");
  loader.classList.add('block');


  try {
    let todos = getTasksFromLocalStorage();

    if (todos.length === 0) {
      todos = await fetchTodos();
      todos = todos.map((todo) => ({
        ...todo,
        priority: todo.priority || 1,
      }));
    }

    populateTable(todos);
    addTask();
    addSearchListeners();
  } catch (error) {
    console.error("Failed to initialize table:", error);
  } finally {
    loader.classList.remove('block');
    loader.classList.add('hidden');
  }
}

window.onload = init;
