# Leave Management API Integration - Quick Reference

## Key Service Methods

### leaveService
```javascript
import { leaveService } from '@/api';

// Get all leaves
await leaveService.getLeaves(page, rows)

// Get single leave
await leaveService.getLeaveById(id)

// Get leaves for employee
await leaveService.getLeavesByEmployee(employeeId, page, rows)

// Create new leave
await leaveService.createLeave({
  employeeId,
  startDate,
  endDate,
  type,
  reason
})

// Update leave
await leaveService.updateLeave(id, data)

// Delete leave
await leaveService.deleteLeave(id)

// Get leave types
await leaveService.getLeaveTypes()

// Get balance
await leaveService.getLeaveBalance(employeeId)

// Update status
await leaveService.updateLeaveStatus(id, status)
```

### userService
```javascript
import { userService } from '@/api';

// Get current user
const user = await userService.getCurrentUser();
```

### employeeService
```javascript
import { employeeService } from '@/api';

// Get all employees
const emps = await employeeService.getEmployees({ page: 1, rows: 100 });
```

---

## Common Patterns

### Loading Data
```javascript
try {
  const response = await leaveService.getLeaves(1, 100);
  const leaves = response?.data || response || [];
  setLeaves(leaves);
} catch (error) {
  showToast.error(error.message);
}
```

### Creating Record
```javascript
try {
  const result = await leaveService.createLeave(data);
  showToast.success('Created successfully');
  await loadData(); // Refresh
} catch (error) {
  showToast.error(error.message);
}
```

### Updating Status
```javascript
try {
  await leaveService.updateLeaveStatus(id, 'approved');
  showToast.success('Status updated');
  await loadData(); // Refresh
} catch (error) {
  showToast.error(error.message);
}
```

### Deleting Record
```javascript
try {
  await leaveService.deleteLeave(id);
  showToast.success('Deleted successfully');
  await loadData(); // Refresh
} catch (error) {
  showToast.error(error.message);
}
```

---

## API Endpoints Quick Reference

| Method | URL | Purpose |
|--------|-----|---------|
| GET | `/v1/leaves` | List all |
| POST | `/v1/leaves` | Create |
| GET | `/v1/leaves/:id` | Get one |
| PUT | `/v1/leaves/:id` | Update |
| DELETE | `/v1/leaves/:id` | Delete |
| PATCH | `/v1/leaves/:id/status` | Change status |
| GET | `/v1/leaves/employee/:id` | Employee leaves |
| GET | `/v1/leaves/balance/:id` | Leave balance |
| GET | `/v1/leaves/types` | Leave types |

---

## Common Tasks

### Task: Load Leaves for Current Employee
```javascript
const [leaves, setLeaves] = useState([]);

useEffect(() => {
  (async () => {
    const response = await leaveService.getLeavesByEmployee(employee.id);
    setLeaves(response?.data || []);
  })();
}, [employee.id]);
```

### Task: Submit Leave Request
```javascript
const handleSubmit = async (formData) => {
  const leaveData = {
    employeeId: employee.id,
    type: formData.type,
    startDate: formData.startDate,
    endDate: formData.endDate,
    reason: formData.reason
  };
  
  await leaveService.createLeave(leaveData);
  showToast.success('Leave request submitted');
};
```

### Task: Approve Leave
```javascript
const handleApprove = async (requestId) => {
  await leaveService.updateLeaveStatus(requestId, 'approved');
  showToast.success('Leave approved');
};
```

### Task: Get Employee Balance
```javascript
const [balance, setBalance] = useState(0);

useEffect(() => {
  (async () => {
    const result = await leaveService.getLeaveBalance(employee.id);
    setBalance(result?.data?.remainingBalance || 0);
  })();
}, [employee.id]);
```

---

## Response Format

All responses follow this structure:
```json
{
  "data": { /* actual data */ },
  "message": "Operation message",
  "pagination": { /* for list endpoints */ }
}
```

Always handle both formats:
```javascript
const data = response?.data || response || [];
```

---

## Error Handling

```javascript
try {
  // API call
} catch (error) {
  // Error properties
  error.message          // String message
  error.response?.status // HTTP status
  error.response?.data   // Error response
}
```

Common errors:
- **400**: Validation error
- **401**: Unauthorized (redirects to login)
- **403**: Forbidden
- **404**: Not found
- **500**: Server error

---

## Toast Notifications

```javascript
import { showToast } from '@/utils/toast';

// Success
showToast.success('Message', 'Title');

// Error
showToast.error('Message', 'Title');

// Info
showToast.info('Message', 'Title');

// Warning
showToast.warning('Message', 'Title');
```

---

## State Variables Pattern

```javascript
const [leaves, setLeaves] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

const loadData = async () => {
  setLoading(true);
  try {
    const response = await leaveService.getLeaves();
    setLeaves(response?.data || []);
    setError(null);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

---

## Form Data Mapping

```javascript
// UI form → API payload
{
  leave_type: 'vacation'        → type: 'vacation'
  start_date: '2026-02-01'      → startDate: '2026-02-01T00:00:00Z'
  end_date: '2026-02-05'        → endDate: '2026-02-05T00:00:00Z'
  reason: 'Vacation'            → reason: 'Vacation'
}
```

---

## Response Data Access

```javascript
// API Response
{
  "data": {
    "id": 1,
    "type": "vacation",
    "startDate": "2026-02-01T00:00:00Z",
    "status": "pending",
    "employee": { /* ... */ }
  }
}

// Access in component
leave.id              // 1
leave.type            // 'vacation'
leave.startDate       // ISO date string
leave.status          // 'pending'
leave.employee.name   // Employee name
```

---

## Files to Know

| File | Purpose |
|------|---------|
| `src/api/leave.service.js` | Leave API calls |
| `src/api/user.service.js` | User API calls |
| `src/api/employee.service.js` | Employee API calls |
| `src/api/apiClient.js` | Axios wrapper |
| `src/api/apiRoutes.js` | Endpoint definitions |
| `src/pages/LeaveManagement.jsx` | Main page |
| `src/components/selfservice/LeaveManagement.jsx` | Form component |

---

## Debugging Tips

### Check API Response
```javascript
const response = await leaveService.getLeaves();
console.log('API Response:', response);
```

### Check Token
```javascript
import { LoginUtil } from '@/pages/login/local-storage.util';
const token = LoginUtil.getAccessToken();
console.log('Token:', token);
```

### Test API Call
```javascript
import { apiClient } from '@/api';
const result = await apiClient.get('/v1/leaves?page=1&rows=10');
console.log('Result:', result);
```

---

## Import Statements

```javascript
// Services
import { leaveService, userService, employeeService } from '@/api';

// Toast
import { showToast } from '@/utils/toast';

// Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Icons
import { Calendar, Plus, CheckCircle, XCircle, Loader2 } from 'lucide-react';
```

---

## Performance Notes

- Pagination default: page=1, rows=100
- Consider using page=1, rows=10-20 for better performance
- Cache employee list to avoid repeated calls
- Debounce search inputs if adding search feature
- Use useCallback for callbacks to prevent re-renders

---

## Security Notes

- All requests automatically include Bearer token
- Tokens automatically refreshed by interceptor
- 401 responses auto-redirect to login
- No sensitive data in logs
- Form inputs validated before sending
- CORS configured on backend

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API 401 | Token expired, login again |
| API 403 | Missing permissions, check role |
| API 404 | Record not found, verify ID |
| API 400 | Invalid input, check form data |
| Toast not showing | Check toast container in DOM |
| No data loading | Check API response format |
| Infinite loop | Check useEffect dependencies |

---

## Links to Full Documentation

- **API_INTEGRATION_GUIDE.md** - Detailed docs
- **LEAVE_API_ENDPOINTS.md** - All endpoints
- **INTEGRATION_CHECKLIST.md** - Testing guide
- **LEAVE_API_INTEGRATION_SUMMARY.md** - Overview
- **IMPLEMENTATION_COMPLETE.md** - Status report

---

## Version Info

- **Implementation Date**: January 22, 2026
- **Status**: Complete ✅
- **API Version**: v1
- **Backend**: Node.js/Express
- **Frontend**: React 18+
