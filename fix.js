const fs = require('fs');
const path = 'backend/services/projectService.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /async createProject[\s\S]*?const savedProject = await project\.save\(\);/;

const replacement = `async createProject(user, companyId, data) {
    const { title, description, team, strict, isPublic, startDate, dueDate, owner: dataOwner, department } = data;
    const owner = dataOwner || user.id || user._id;

    const project = new Project({
      title,
      description,
      team,
      owner,
      department,
      strict,
      isPublic,
      startDate,
      dueDate,
      company: companyId,
    });

    const savedProject = await project.save();`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
console.log('Fixed correctly!');
