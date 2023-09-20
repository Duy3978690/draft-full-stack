const express = require("express");
const app = express();
let btn = document.querySelector("#btn");
let sidebar = document.querySelector(".sidebar");
let searchBtn = document.querySelector(".fa-search");
btn.onclick=function(){
    sidebar.classList.toggle("active");
}
btn.onclick=function(){
    sidebar.classList.toggle("active");
}

//Sidebar JS
function openNav(){
    document.getElementById('mySidenav').style.width="250px";
}
function closeNav(){
    document.getElementById('mySidenav').style.width="0px";
}
