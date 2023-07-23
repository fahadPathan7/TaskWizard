
// Fetch tasks from the server and render them
function fetchTasks() {
    fetch('/tasks', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(response => response.json())
      .then(tasks => {
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '';

        tasks.forEach(task => {
          const li = document.createElement('li');
          const span = document.createElement('span');
          span.textContent = task.task;

          const editButton = document.createElement('button');
          editButton.textContent = 'Update';
          editButton.addEventListener('click', () => {
            editTask(task.id, task.task);
          });

          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete';
          deleteButton.addEventListener('click', () => {
            deleteTask(task.id);
          });

          li.appendChild(span);
          li.appendChild(editButton);
          li.appendChild(deleteButton);
          taskList.appendChild(li);
        });
      })
      .catch(error => console.error('Error fetching tasks:', error));
  }

  // Add a task
  function addTask(task) {
    fetch('/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ task })
    })
      .then(response => {
        if (response.status === 201) {
          fetchTasks();
        }
      })
      .catch(error => console.error('Error adding task:', error));
  }

  // Edit a task
  function editTask(taskId, task) {
    const updatedTask = prompt('Update the task:', task);
    if (updatedTask !== null && updatedTask.trim() !== '') {
      fetch(`/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ task: updatedTask })
      })
        .then(response => {
          if (response.status === 200) {
            fetchTasks();
          }
        })
        .catch(error => console.error('Error updating task:', error));
    }
  }

  // Delete a task
  function deleteTask(taskId) {
    fetch(`/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(response => {
        if (response.status === 200) {
          fetchTasks();
        }
      })
      .catch(error => console.error('Error deleting task:', error));
  }

  // Handle form submission
  const taskForm = document.getElementById('task-form');
  taskForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const taskInput = document.getElementById('task-input');
    const task = taskInput.value.trim();
    if (task !== '') {
      addTask(task);
      taskInput.value = '';
    }
  });

  // Fetch tasks when the page loads
  fetchTasks();