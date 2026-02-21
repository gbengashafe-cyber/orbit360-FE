# Leave Management API Endpoints Reference

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Endpoints

### 1. Create Leave Request
**POST** `/v1/leaves`

**Description**: Submit a new leave request

**Request Body**:
```json
{
  "employeeId": 4,
  "startDate": "2026-02-01T00:00:00Z",
  "endDate": "2026-02-05T00:00:00Z",
  "type": "vacation",
  "reason": "Family vacation"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "id": 4,
    "employeeId": 4,
    "startDate": "2026-02-01T00:00:00.000Z",
    "endDate": "2026-02-05T00:00:00.000Z",
    "type": "vacation",
    "status": "pending",
    "reason": "Family vacation",
    "createdAt": "2026-01-22T17:28:18.000Z",
    "updatedAt": "2026-01-22T17:28:18.000Z",
    "employee": {
      "id": 4,
      "firstName": "John",
      "lastName": "DOE",
      "email": "john.doe@example.com"
    }
  },
  "message": "Leave request created successfully"
}
```

**Implementation**:
```javascript
await leaveService.createLeave({
  employeeId: employee.id,
  type: formData.leave_type,
  startDate: formData.start_date,
  endDate: formData.end_date,
  reason: formData.reason
});
```

---

### 2. Get All Leaves
**GET** `/v1/leaves?page=1&rows=20`

**Description**: Get all leave requests (paginated)

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| rows | number | 20 | Records per page |

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 4,
      "employeeId": 4,
      "startDate": "2026-02-01T00:00:00.000Z",
      "endDate": "2026-02-05T00:00:00.000Z",
      "type": "vacation",
      "status": "pending",
      "reason": "Family vacation",
      "createdAt": "2026-01-22T17:28:18.000Z",
      "updatedAt": "2026-01-22T17:28:18.000Z",
      "employee": {
        "id": 4,
        "firstName": "John",
        "lastName": "DOE",
        "email": "john.doe@example.com"
      }
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "rows": 20,
    "pages": 1
  }
}
```

**Implementation**:
```javascript
const response = await leaveService.getLeaves(1, 100);
const leaves = response?.data || response || [];
```

---

### 3. Get Leave by ID
**GET** `/v1/leaves/:id`

**Description**: Get a specific leave request by ID

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Leave request ID |

**Response** (200 OK):
```json
{
  "data": {
    "id": 4,
    "employeeId": 4,
    "startDate": "2026-02-01T00:00:00.000Z",
    "endDate": "2026-02-05T00:00:00.000Z",
    "type": "vacation",
    "status": "pending",
    "reason": "Family vacation",
    "createdAt": "2026-01-22T17:28:18.000Z",
    "updatedAt": "2026-01-22T17:28:18.000Z"
  },
  "message": "Leave request retrieved successfully"
}
```

**Implementation**:
```javascript
const leave = await leaveService.getLeaveById(4);
```

---

### 4. Get Leaves by Employee
**GET** `/v1/leaves/employee/:employeeId?page=1&rows=20`

**Description**: Get all leave requests for a specific employee

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| employeeId | number | Employee ID |

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| rows | number | 20 | Records per page |

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 4,
      "employeeId": 4,
      "startDate": "2026-02-01T00:00:00.000Z",
      "endDate": "2026-02-05T00:00:00.000Z",
      "type": "vacation",
      "status": "pending",
      "reason": "Family vacation",
      "createdAt": "2026-01-22T17:28:18.000Z",
      "updatedAt": "2026-01-22T17:28:18.000Z",
      "employee": {
        "id": 4,
        "firstName": "John",
        "lastName": "DOE",
        "email": "john.doe@example.com"
      }
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "rows": 20,
    "pages": 1
  }
}
```

**Implementation**:
```javascript
const leaves = await leaveService.getLeavesByEmployee(employeeId, 1, 100);
```

---

### 5. Get Leave Types
**GET** `/v1/leaves/types`

**Description**: Get available leave types

**Response** (200 OK):
```json
{
  "data": [
    { "id": 1, "name": "Annual", "code": "annual" },
    { "id": 2, "name": "Sick", "code": "sick" },
    { "id": 3, "name": "Maternity", "code": "maternity" },
    { "id": 4, "name": "Paternity", "code": "paternity" },
    { "id": 5, "name": "Compassionate", "code": "compassionate" },
    { "id": 6, "name": "Study", "code": "study" },
    { "id": 7, "name": "Unpaid", "code": "unpaid" }
  ],
  "message": "Leave types retrieved successfully"
}
```

**Implementation**:
```javascript
const types = await leaveService.getLeaveTypes();
```

---

### 6. Get Leave Balance
**GET** `/v1/leaves/balance/:employeeId`

**Description**: Get remaining leave balance for an employee

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| employeeId | number | Employee ID |

**Response** (200 OK):
```json
{
  "data": {
    "employeeId": 4,
    "totalEntitlement": 21,
    "usedDays": 5,
    "remainingBalance": 16,
    "pendingDays": 5
  },
  "message": "Leave balance retrieved successfully"
}
```

**Implementation**:
```javascript
const balance = await leaveService.getLeaveBalance(employeeId);
```

---

### 7. Update Leave Status (Approve/Reject)
**PATCH** `/v1/leaves/:id/status`

**Description**: Update leave request status (approve or reject)

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Leave request ID |

**Request Body**:
```json
{
  "status": "approved"
}
```

**Valid Status Values**:
- `approved` - Approve the leave request
- `rejected` - Reject the leave request

**Response** (200 OK):
```json
{
  "data": {
    "id": 4,
    "employeeId": 4,
    "startDate": "2026-02-01T00:00:00.000Z",
    "endDate": "2026-02-05T00:00:00.000Z",
    "type": "vacation",
    "status": "approved",
    "reason": "Family vacation",
    "createdAt": "2026-01-22T17:28:18.000Z",
    "updatedAt": "2026-01-22T18:00:00.000Z"
  },
  "message": "Leave status updated successfully"
}
```

**Implementation**:
```javascript
await leaveService.updateLeaveStatus(requestId, 'approved');
// or
await leaveService.updateLeaveStatus(requestId, 'rejected');
```

---

### 8. Update Leave
**PUT** `/v1/leaves/:id`

**Description**: Update an existing leave request

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Leave request ID |

**Request Body**:
```json
{
  "startDate": "2026-02-01T00:00:00Z",
  "endDate": "2026-02-05T00:00:00Z",
  "reason": "Updated reason"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "id": 4,
    "employeeId": 4,
    "startDate": "2026-02-01T00:00:00.000Z",
    "endDate": "2026-02-05T00:00:00.000Z",
    "type": "vacation",
    "status": "pending",
    "reason": "Updated reason",
    "updatedAt": "2026-01-22T18:05:00.000Z"
  },
  "message": "Leave request updated successfully"
}
```

**Implementation**:
```javascript
await leaveService.updateLeave(requestId, {
  startDate: newStartDate,
  endDate: newEndDate,
  reason: newReason
});
```

---

### 9. Delete Leave
**DELETE** `/v1/leaves/:id`

**Description**: Delete a leave request

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Leave request ID |

**Response** (200 OK):
```json
{
  "data": null,
  "message": "Leave request deleted successfully"
}
```

**Implementation**:
```javascript
await leaveService.deleteLeave(requestId);
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error",
  "message": "Start date must be before end date"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Leave request with ID 999 not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Server error",
  "message": "An unexpected error occurred. Please try again later."
}
```

---

## Rate Limiting

- Rate limit: 1000 requests per hour per IP
- Headers returned:
  - `X-RateLimit-Limit: 1000`
  - `X-RateLimit-Remaining: 999`
  - `X-RateLimit-Reset: 1642856400`

---

## Implementation Examples

### Submit Leave Request
```javascript
try {
  const leaveData = {
    employeeId: currentEmployee.id,
    type: 'vacation',
    startDate: '2026-02-01T00:00:00Z',
    endDate: '2026-02-05T00:00:00Z',
    reason: 'Family vacation'
  };
  
  const response = await leaveService.createLeave(leaveData);
  showToast.success('Leave request submitted successfully!');
  await loadLeaveData();
} catch (error) {
  showToast.error(error.message);
}
```

### Load Employee Leaves
```javascript
try {
  const response = await leaveService.getLeavesByEmployee(employeeId, 1, 50);
  const leaves = response?.data || [];
  
  leaves.forEach(leave => {
    console.log(`${leave.type}: ${leave.startDate} - ${leave.endDate}`);
  });
} catch (error) {
  console.error('Failed to load leaves:', error);
}
```

### Approve/Reject Leave
```javascript
try {
  await leaveService.updateLeaveStatus(requestId, isApproved ? 'approved' : 'rejected');
  showToast.success(`Request ${isApproved ? 'approved' : 'rejected'}`);
  await refreshPendingApprovals();
} catch (error) {
  showToast.error(`Failed to process request: ${error.message}`);
}
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Date fields accept format: `YYYY-MM-DDTHH:mm:ssZ`
- Pagination is zero-indexed from page 1
- Maximum rows per request: 100
- Leave balances are calculated automatically
- Status transitions are enforced (e.g., can't go from approved back to pending)
