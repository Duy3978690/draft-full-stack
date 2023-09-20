// document.getElementById("myinput").addEventListener("keyup", function() {
//     let text = this.value.toLowerCase();

//     // Send a GET request to /filter-gallery with the search text
//     fetch(`/filter-gallery?text=${text}`)
//         .then(response => response.text())
//         .then(data => {
//             // Replace the card container with the filtered gallery
//             const cardContainer = document.getElementById("card");
//             if (data.trim() === "") {
//                 // Show "Not Found" message if data is empty
//                 document.getElementById("para").style.display = "block";
//                 cardContainer.innerHTML = "";
//             } else {
//                 // Hide "Not Found" message if data is not empty
//                 document.getElementById("para").style.display = "none";
//                 cardContainer.innerHTML = data;
//             }
//         })
//         .catch(error => console.error(error));
// });