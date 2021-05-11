// Function to display results
const displayResults = (result) => {
    const divElement = document.getElementById("output");
    // Reset output at each call
    divElement.innerHTML = "";

    if (result.trans === "Error") {
        divElement.innerHTML += `
        <h2>Application Error</h2><br>
        <p>${result.result}</p>
        `
    } else {
        if (result.result.length === 0) {
            divElement.innerHTML += `<h3>No records found!</h3>`;
        } else {
            var tdText = "";
            result.result.forEach(customer => {
                tdText += `
                <tr>
                    <td>${customer.cusid}</td>
                    <td>${customer.cusfname}</td>
                    <td>${customer.cuslname}</td>
                    <td>${customer.cusstate}</td>
                    <td>${customer.cussalesytd}</td>
                    <td>${customer.cussalesprev}</td>
                    <td class="d-print-none">
                    <a class="btn btn-sm btn-warning" href="/edit/<%= customer.cusid %>">Edit</a>
                    <a class="btn btn-sm btn-danger" href="/delete/<%= customer.cusid %>">Delete</a>
                    </td>
                </tr>
             `
            });
            //divElement.innerHTML = "Test";
            divElement.innerHTML += `
           <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>State</th>
                    <th>Sales YTD</th>
                    <th>Sales Prev</th>
                    <th class="d-print-none"> <a class="btn btn-sm btn-success" href="/create">Create Customer</a>
                    </th>
                </tr>
            </thead>
            <tbody>
                ${tdText}
            </tbody>
          </table>           
        `
        };
    };
};


// Handle form submission
document.querySelector("form").addEventListener("submit", e => {
    // Cancel default behavior of sending a synchronous POST request
    e.preventDefault();
    // Create a FormData object, passing the form as a parameter
    const formData = new FormData(e.target);
    fetch("/customersajax", {
        method: "POST",
        body: formData
    })
        .then(response => response.json())
        .then(result => {
            displayResults(result);
        })
        .catch(err => {
            console.error(err.message);
        });
});
