const allowedFields = ['title', 'description', 'status', 'priority', 'assignee'];
const allowedStatuses = ['pending', 'in_progress', 'completed'];
const allowedPriorities = ['low', 'medium', 'high'];

function validateTask(body, isUpdate = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'JSON nesnesi gönderin.' };
  }

  const fieldNames = Object.keys(body);
  if (fieldNames.length === 0) {
    return { error: 'En az bir görev alanı gönderin.' };
  }
  if (!isUpdate && body.title === undefined) {
    return { error: 'title alanı zorunludur.' };
  }

  const fields = {};
  for (const fieldName of fieldNames) {
    if (!allowedFields.includes(fieldName)) {
      return { error: `Desteklenen alanlar: ${allowedFields.join(', ')}.` };
    }
    if (typeof body[fieldName] !== 'string') {
      return { error: `${fieldName} metin olmalıdır.` };
    }
    fields[fieldName] = body[fieldName].trim();
  }

  if (fields.title === '') {
    return { error: 'title boş olamaz.' };
  }
  if (fields.status !== undefined && !allowedStatuses.includes(fields.status)) {
    return { error: 'status: pending, in_progress veya completed olmalıdır.' };
  }
  if (fields.priority !== undefined && !allowedPriorities.includes(fields.priority)) {
    return { error: 'priority: low, medium veya high olmalıdır.' };
  }

  return { fields };
}

module.exports = validateTask;
