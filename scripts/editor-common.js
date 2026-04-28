// COMMON LOGIC FOR ALL EDITORS

const urlParams = new URLSearchParams(window.location.search);
const selectedTemplate = urlParams.get("template");

const projectId =
  urlParams.get("projectId") ||
  window.location.pathname.split("/").pop();

console.log("Template:", selectedTemplate);
console.log("Project ID:", projectId);