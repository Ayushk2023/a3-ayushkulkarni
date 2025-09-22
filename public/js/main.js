// FRONT-END (CLIENT) JAVASCRIPT HERE

const submit = async function( event ) {
  // stop form submission from trying to load
  // a new .html page for displaying results...
  // this was the original browser behavior and still
  // remains to this day
  event.preventDefault()
  
  // const input = document.querySelector( "#yourname" ),
  //       json = { "yourname": input.value },
  //       body = JSON.stringify( json )

  const name = document.querySelector( "#name").value;
  const task = document.querySelector("#task").value;
  const priority = document.querySelector("input[name='priority']:checked")?.value;
  const createdDate = document.querySelector("#date").value;

  const json = {"name": name, "task": task, "priority": priority, "createdDate": createdDate}
  const body = JSON.stringify(json);

  const response = await fetch( "/submit", {
    method:"POST",
    headers: { "Content-Type": "application/json" },
    body
  })

  const text = await response.text()

  console.log( "text:", text )

  displayData();
}

const displayData = async function() {
  
  const response = await fetch("/data");

  const contentType = response.headers.get("content-type") || ""
  if (!contentType.includes("application/json")) {
    window.location.href = "/login.html"
    return
  }

  const data = await response.json()
  
  let tasks = document.getElementById("result");
  if (!tasks) {
    tasks = document.createElement("div");
    tasks.id = "result"
    document.body.appendChild(tasks);
  }

  let html = 
  `
  <div class="table-responsive small">
  <table class="table table-striped table-sm">
    <thead>
      <tr>
        <th scope="col">Name</th>
        <th scope="col">Task</th>
        <th scope="col">Priority</th>
        <th scope="col">Created Date</th>
        <th scope="col">Due Date</th>
        <th scope="col">Edit</th>
        <th scope="col">Delete</th>
      </tr>
    </thead>
    <tbody>
            ${data.map((element, index) => `
          <tr>
            <td>${element.name}</td>
            <td>${element.task}</td>
            <td>${element.priority}</td>
            <td>${element.createdDate}</td>
            <td>${element.dueDate}</th>
            <td><button class="update-btn" data-id="${element._id}">🔧</button></td>
            <td><button class="delete-btn" data-id="${element._id}">❌</button></td>
          </tr>
        `).join("")}
  </tbody>
  </table>
  </div>
  `
  tasks.innerHTML = html;

  document.querySelectorAll(".update-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;

      const name = prompt("Enter new name:");
      const task = prompt("Enter new task:");
      const priority = prompt("Enter new priority (high, medium, low):");
      const createdDate = prompt("Enter new created date (YYYY-MM-DD):");
  
      if (!name || !task || !priority || !createdDate) return;
  
      const updatedData = { name, task, priority, createdDate };

      await updateTask(id,updatedData);
    });
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      await deleteTask(id);
    });
  });
};

const deleteTask = async function(id) {
  await fetch( `/delete/${id}`, {
    method:"DELETE"
  });
  displayData();
}

const updateTask = async function(id, updatedData) {
  const response = await fetch(`/update/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedData)
  })
  const data = await response.json()
  displayData()
}

window.onload = function() {
  document.querySelector("form").onsubmit = submit;
  displayData();
}