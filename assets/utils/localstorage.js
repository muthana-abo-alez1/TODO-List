const TASKS_STORAGE_KEY = "newtasks";

export const setTasksToLocalStorage = (tasks) => {
    try {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error("Error saving tasks to localStorage:", error);
    }
};

export const getTasksFromLocalStorage = () => {
    try {
        const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
        return storedTasks ? JSON.parse(storedTasks) : [];
    } catch (error) {
        console.error("Error retrieving tasks from localStorage:", error);
        return [];
    }
};