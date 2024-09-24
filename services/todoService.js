const API_URL = 'https://dummyjson.com/todos';

export const fetchTodos = async () => {
    try {
        const response = await fetch(API_URL); 
        if (!response.ok) throw new Error('Network response was not ok'); 
        const data = await response.json(); 
        return data.todos; 
    } catch (error) {
        console.error("Error fetching todos:", error); 
        throw error; 
    }
};

export const addTodo = async (newTodo) => {
    try {
        const response = await fetch(`${API_URL}/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTodo),
        });
        if (!response.ok) throw new Error('Failed to add todo');
        return await response.json();
    } catch (error) {
        console.error("Error adding todo:", error);
        throw error;
    }
};

export const updateTodo = async (id, updatedData) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedData),
        });
        if (!response.ok) throw new Error('Failed to update todo');
        return await response.json();
    } catch (error) {
        console.error("Error updating todo:", error);
        throw error;
    }
};

export const deleteTodo = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete todo');
        return await response.json(); 
    } catch (error) {
        console.error("Error deleting todo:", error);
        throw error;
    }
};