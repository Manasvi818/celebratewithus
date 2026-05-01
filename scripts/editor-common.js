// COMMON LOGIC FOR ALL EDITORS

const urlParams = new URLSearchParams(window.location.search);
const selectedTemplate = urlParams.get("template");



console.log("Template:", selectedTemplate);
console.log("Project ID:", projectId);