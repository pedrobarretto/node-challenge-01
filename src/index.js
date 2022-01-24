const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find(x => x.username === username);

  if (!username)
    return response.status(400).send({ error: 'Must provide a valid username' });

  if (!user)
    return response.status(400).send({ error: 'not-found' });

  request.username = username;

  return next();
}

app.post('/users', (request, response) => {
  const { username, name } = request.body;

  const customerAlreadyExists = users.some(x => x.username === username);

  if (customerAlreadyExists)
    return response.status(401).json({ error: 'User already exists' });

  const payload = {
    id: uuidv4(),
    username,
    name,
    todos: []
  };

  users.push(payload);
  return response.status(201).json(payload);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request;
  const { todos } = users.find(x => x.username === username);
  return response.json(todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request;
  const { title, deadline } = request.body;
  const user = users.find(x => x.username === username);

  const todo = {
    title,
    deadline: new Date(deadline),
    done: false,
    id: uuidv4(),
    created_at: new Date()
  }

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { username } = request;
  const { title, deadline } = request.body;
  const { id } = request.params;
  
  const { todos } = users.find(x => x.username === username);
  
  if (!todos)
    return response.status(400).send({ error: 'not-found' });

  todos.forEach(todo => {
    if (todo.id === id) {
      todo.title = title;
      todo.deadline = new Date(deadline);

      return response.status(201).json(todo);
    };
  });
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { username } = request;

  const { todos } = users.find(x => x.username === username);

  if (!todos)
    return response.status(400).send({ error: 'not-found' });

  todos.forEach(todo => {
    if (todo.id === id) {
      todo.done = true;

      return response.status(201).json(todo);
    }
  })
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { username } = request;

  const user = users.find(x => x.username === username);

  if (!user.todos)
    return response.status(400).send({ error: 'not-found' });

  const filteredTodos = user.todos.filter(x => x.id !== id);
  user.todos = filteredTodos;

  return response.status(201).json(user.todos);
});

module.exports = app;