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

let taskscount = 0;
let taskscountSearch = 0;
let flag = false;
let sortDirection = true;

const mainSearchDiv = document.getElementById("main-search-div");
const searchPlaceholder = document.getElementById("search-placeholder");
const smallSearchFields = document.querySelector(".small-search-fields");

mainSearchDiv.addEventListener("click", function () {
  smallSearchFields.style.display = "flex";
  searchPlaceholder.style.display = "none";
});

document.querySelectorAll("th").forEach((header, index) => {
  if (index < document.querySelectorAll("th").length - 1) {
    header.addEventListener("click", () => sortTable(index));
  }
});

function updateTaskCount() {
  const taskCountElement = document.getElementById("task-count");
  taskCountElement.textContent = taskscount;
}
function updateTaskCountSearch(taskscountSearch) {
  const taskCountElement = document.getElementById("task-count");
  taskCountElement.textContent = taskscountSearch;
}

export function populateTable(todos) {
  const tableBody = document.getElementById("todo-body");
  tableBody.innerHTML = "";
  taskscount = 0;

  todos.forEach((todo) => {
    const row = createTableRow(todo);
    taskscount++;
    tableBody.appendChild(row);
  });

  updateTaskCount();
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
        <td class="task-action">
            <button class="delete-btn">Delete</button>
            <button class="done-btn">${
              todo.completed ? "Undo" : "Done"
            }</button>
        </td>
`;
  const deleteButton = row.querySelector(".delete-btn");
  deleteButton.addEventListener("click", (event) => {
    event.stopPropagation();
    deleteTask(todo.id);
  });

  const doneButton = row.querySelector(".done-btn");
  doneButton.addEventListener("click", (event) => {
    event.stopPropagation();
    doneTask(todo.id);
  });

  row.addEventListener("click", () => makeRowEditable(row, todo));
  return row;
}

function makeRowEditable(row, todo) {
  if (row.classList.contains("editing")) {
    return;
  }
  row.classList.add("editing");
  if (flag) {
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
          <td class="task-action">
          <button class="cancel-btn">Cancel</button>
              <button class="save-btn">Save</button>
          </td>
      `;
  flag = true;
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
    flag = false;
  });
}
export async function saveTaskEdit(row, taskId) {
  const editedTaskValue = row.querySelector(".edit-task-input").value;
  const editedUserIdValue = row.querySelector(".edit-user-id-input").value;
  const editedStatusValue =
    row.querySelector(".edit-status-select").value === "Completed";

  const tasks = getTasksFromLocalStorage();
  const taskIndex = tasks.findIndex((task) => task.id === taskId);
  flag = false;

  if (taskIndex !== -1) {
    tasks[taskIndex].todo = editedTaskValue;
    tasks[taskIndex].userId = editedUserIdValue;
    tasks[taskIndex].completed = editedStatusValue;

    setTasksToLocalStorage(tasks);
    try {
      const updatedTaskData = {
        todo: editedTaskValue,
        userId: editedUserIdValue,
        completed: editedStatusValue,
      };
      await updateTodo(taskId, updatedTaskData);
      console.log(`Task ID ${taskId} updated successfully!`);
    } catch (error) {
      console.error(`Failed to update task ID ${taskId} on the server:`, error);
      alert("Failed to update the task on the server.");
    }
    populateTable(tasks);
  }
}

function deleteTask(id) {
  const tableBody = document.getElementById("todo-body");
  const rowToDelete = tableBody.querySelector(`tr[data-id="${id}"]`);

  if (rowToDelete) {
    const confirmed = confirm(`Are you sure you want to delete task ID ${id}?`);

    if (confirmed) {
      tableBody.removeChild(rowToDelete);
      taskscount--;
      deleteTodo(id);
      updateTaskCount();
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
      };
      const tableBody = document.getElementById("todo-body");
      const row = createTableRow(newTask);
      if (tableBody.firstChild) {
        tableBody.insertBefore(row, tableBody.firstChild);
      } else {
        tableBody.appendChild(row);
      }
      taskscount++;
      updateTaskCount();
      addTodo(newTask);
      setTasksToLocalStorage([...currentTasks, newTask]);
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
      smallSearchFields.style.display = "none";
      mainSearchDiv.style.display = "flex";
      searchPlaceholder.style.display = "block";
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
  const idInput = document.getElementById("search-id").value.toLowerCase();
  const taskInfoInput = document
    .getElementById("search-task-info")
    .value.toLowerCase();
  const userIdInput = document
    .getElementById("search-user-id")
    .value.toLowerCase();
  const statusInput = document
    .getElementById("search-status")
    .value.toLowerCase();
  taskscountSearch = 0;
  const tableBody = document.getElementById("todo-body");
  const rows = tableBody.getElementsByTagName("tr");

  for (let row of rows) {
    const id = row.cells[0].textContent.toLowerCase();
    const taskInfo = row.cells[1].textContent.toLowerCase();
    const userId = row.cells[2].textContent.toLowerCase();
    const status = row.cells[3].textContent.toLowerCase();

    const matchesId = id.includes(idInput);
    const matchesTaskInfo = taskInfo.includes(taskInfoInput);
    const matchesUserId = userId.includes(userIdInput);
    const matchesStatus = status.includes(statusInput);

    if (matchesId && matchesTaskInfo && matchesUserId && matchesStatus) {
      row.style.display = "";
      taskscountSearch++;
    } else {
      row.style.display = "none";
    }
    updateTaskCountSearch(taskscountSearch);
  }
}

function addSearchListeners() {
  const debouncedSearchTasks = debounce(searchTasks, 300);
  document.querySelectorAll(".small-input").forEach((input) => {
    input.addEventListener("keyup", debouncedSearchTasks);
  });
}

async function init() {
  const loader = document.getElementById("loader");
  loader.style.display = "block";

  try {
    let todos = getTasksFromLocalStorage();
    if (todos.length === 0) {
      todos = await fetchTodos();
    }
    populateTable(todos);
    addTask();
    addSearchListeners();
  } catch (error) {
    console.error("Failed to initialize table:", error);
  } finally {
    loader.style.display = "none";
  }
}

window.onload = init;
