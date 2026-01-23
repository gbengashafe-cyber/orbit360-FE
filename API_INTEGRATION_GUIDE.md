# Leave Management API Integration Guide

## Overview
The Leave Management module has been integrated with the backend API using a service-oriented architecture, following the same patterns established in the Recruitment and Onboarding modules.

## Architecture Pattern

### Service Layer (`src/api/leave.service.js`)
The service layer provides a clean interface for all leave-related API operations:

```javascript
export const leaveService = {
  async getLeaves(page = 1, rows = 10)
  async getLeaveById(id)
  async getLeavesByEmployee(employeeId, page = 1, rows = 10)
  async createLeave(data)
  async updateLeave(id, data)
  async deleteLeave(id)
  async getLeaveTypes()
  async getLeaveBalance(employeeId)
  async updateLeaveStatus(id, status)
}
```

### API Routes (`src/api/apiRoutes.js`)
Centralized endpoint definitions:

```javascript
// Leave Management Endpoints
static GetLeaves = '/v1/leaves';
static GetLeaveById = (id) => `/v1/leaves/${id}`;
static CreateLeave = '/v1/leaves';
static UpdateLeave = (id) => `/v1/leaves/${id}`;
static DeleteLeave = (id) => `/v1/leaves/${id}`;
static GetLeavesByEmployee = (employeeId) => `/v1/leaves/employee/${employeeId}`;
static GetLeaveTypes = '/v1/leaves/types';
static GetLeaveBalance = (employeeId) => `/v1/leaves/balance/${employeeId}`;
static UpdateLeaveStatus = (id) => `/v1/leaves/${id}/status`;
```

### API Client (`src/api/apiClient.js`)
Axios wrapper that handles:
- Base URL configuration
- JWT authentication (Bearer tokens)
- Request/response interceptors
- Automatic error handling
- FormData detection for file uploads

## Integrated Components

### 1. LeaveManagement.jsx (Main Page)
**Path**: `src/pages/LeaveManagement.jsx`

**API Integration Points**:

#### Load Base Data
```javascript
const loadBaseData = async () => {
  // Get current user
  const userResponse = await userService.getCurrentUser();
  const user = userResponse?.data || userResponse;

  // Get all employees
  const employeesResponse = await employeeService.getEmployees({ page: 1, rows: 100 });
  const allEmpsData = employeesResponse?.data || employeesResponse || [];

  // Get leaves pending approval
  const leavesResponse = await leaveService.getLeaves(1, 100);
  const allLeaves = leavesResponse?.data || leavesResponse || [];
}
```

#### Handle Leave Approval
```javascript
const handleApprovalAction = async (request, isApproved) => {
  const nextStatus = isApproved ? 'approved' : 'rejected';
  await leaveService.updateLeaveStatus(request.id, nextStatus);
  showToast.success(`Request has been successfully ${isApproved ? 'approved' : 'rejected'}.`);
}
```

**Features**:
- View pending leave requests requiring approval (HR/Manager only)
- Approve or reject leave requests
- Switch between employee portals (Admin feature)
- Real-time status updates with toast notifications

### 2. LeaveManagement.jsx (Component)
**Path**: `src/components/selfservice/LeaveManagement.jsx`

**API Integration Points**:

#### Load Leave Data
```javascript
const loadData = React.useCallback(async () => {
  // Fetch all leaves
  const leavesData = await leaveService.getLeaves(1, 100);
  
  // Fetch all employees
  const allEmployeesData = await employeeService.getEmployees({ page: 1, rows: 100 });
  
  // Filter and set requests for current employee
  const requests = allLeaves.filter(leave => leave.employeeId === employee.id);
}, [employee?.id, calculateLeaveBalance]);
```

#### Create Leave Request
```javascript
const handleSubmit = async (e) => {
  const leaveData = {
    employeeId: employee.id,
    type: formData.leave_type,
    startDate: formData.start_date,
    endDate: formData.end_date,
    reason: formData.reason
  };
  
  await leaveService.createLeave(leaveData);
  showToast.success('Leave request submitted successfully!');
}
```

#### Delete Leave Request
```javascript
const handleDelete = async (requestId) => {
  await leaveService.deleteLeave(requestId);
  showToast.success('Leave request deleted successfully');
}
```

**Features**:
- Submit new leave requests
- View leave history and status
- Calculate remaining leave balance
- Delete pending leave requests
- Display leave type, dates, days requested, and status
- Real-time validations

## API Request/Response Examples

### Create Leave Request

**Request**:
```javascript
POST /api/v1/leaves
{
  "employeeId": 4,
  "startDate": "2026-02-01T00:00:00Z",
  "endDate": "2026-02-05T00:00:00Z",
  "type": "vacation",
  "reason": "Family vacation"
}
```

**Response**:
```javascript
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

### Get Leaves

**Request**:
```javascript
GET /api/v1/leaves?page=1&rows=20
```

**Response**:
```javascript
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

### Update Leave Status

**Request**:
```javascript
PATCH /api/v1/leaves/{id}/status
{
  "status": "approved"
}
```

**Response**:
```javascript
{
  "data": {
    "id": 4,
    "status": "approved",
    "updatedAt": "2026-01-22T18:00:00.000Z"
  },
  "message": "Leave status updated successfully"
}
```

## Available API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/leaves` | Create leave request | ✓ |
| GET | `/api/v1/leaves` | Get all leaves (HR only) | ✓ HR + MANAGE_LEAVES |
| GET | `/api/v1/leaves/employee/:employeeId` | Get leaves by employee | ✓ |
| GET | `/api/v1/leaves/types` | Get leave types | ✓ |
| GET | `/api/v1/leaves/balance/:employeeId` | Get leave balance | ✓ |
| GET | `/api/v1/leaves/:id` | Get leave by ID | ✓ |
| PATCH | `/api/v1/leaves/:id/status` | Approve/Decline leave | ✓ HR + APPROVE_LEAVES |
| DELETE | `/api/v1/leaves/:id` | Delete leave request | ✓ |

## Error Handling

All API calls are wrapped in try-catch blocks with proper error handling:

```javascript
try {
  // API call
  await leaveService.createLeave(leaveData);
  showToast.success('Success message');
} catch (error) {
  console.error('Error:', error);
  showToast.error(error.message || 'Failed to perform action');
}
```

### Authentication
- Automatically handled by apiClient interceptors
- Bearer token from LoginUtil.getAccessToken()
- Redirects to login on 401 Unauthorized

## Data Flow

```
LeaveManagement Page
├── User Authentication (userService.getCurrentUser)
├── Load Employees (employeeService.getEmployees)
├── Load Leaves (leaveService.getLeaves)
└── HR Admin Features
    ├── View all leaves
    ├── Approve/Reject leaves (leaveService.updateLeaveStatus)
    └── Switch employee view

LeaveManagement Component
├── Load Leave Data (leaveService.getLeaves)
├── Load Employees (employeeService.getEmployees)
├── Submit Leave Request (leaveService.createLeave)
├── Delete Leave Request (leaveService.deleteLeave)
└── Display Validation & Balance
```

## Best Practices Used

1. **Service Pattern**: All API calls go through service layer
2. **Centralized Routes**: Endpoint definitions in one place (ApiRoutes)
3. **Error Handling**: Consistent error handling with toast notifications
4. **Loading States**: Proper loading indicators during API calls
5. **Type Mapping**: Data transformation between API response and UI requirements
6. **Async/Await**: Modern async patterns for cleaner code
7. **Error Messages**: User-friendly error messages

## Common Issues & Solutions

### Issue: Response data structure varies
**Solution**: Use `response?.data || response` pattern to handle both wrapped and unwrapped responses

```javascript
const leavesData = leavesResponse?.data || leavesResponse || [];
```

### Issue: Pagination handling
**Solution**: Pass page and rows parameters to service methods

```javascript
const response = await leaveService.getLeaves(1, 100);
```

### Issue: Toast notifications
**Solution**: Import and use the showToast utility

```javascript
import { showToast } from '@/utils/toast';
showToast.success('Message', 'Title');
showToast.error('Message', 'Title');
```

## UI Structure Preserved

All API integrations maintain the original UI structure as specified. The component layout, styling, and user interface remain unchanged while only the data-fetching logic has been updated to use the API service layer.
