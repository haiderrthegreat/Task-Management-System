# Postman Testing Guide

This guide provides step-by-step instructions to test all APIs using Postman. Follow these steps to set up and test the entire application flow.

## Prerequisites

1. **Install Postman**: Download from [postman.com](https://www.postman.com/downloads/)
2. **Backend Running**: Ensure the backend server is running on `http://localhost:3000` (or your configured port)
3. **Database Ready**: PostgreSQL with Prisma migrations applied

## Setup Instructions

### Step 1: Create Environment Variables in Postman

1. Open Postman
2. Click **Environments** (left sidebar)
3. Click **"+"** to create new environment
4. Name it: `TaskFlow API`
5. Add these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `baseUrl` | `http://localhost:3000` | `http://localhost:3000` |
| `accessToken` | (leave empty) | (will be populated by requests) |
| `refreshToken` | (leave empty) | (will be populated by requests) |
| `userId` | (leave empty) | (will be populated by signup) |
| `workspaceId` | (leave empty) | (will be populated by workspace create) |
| `taskId` | (leave empty) | (will be populated by task create) |
| `commentId` | (leave empty) | (will be populated by comment create) |
| `attachmentId` | (leave empty) | (will be populated by attachment upload) |

6. Click **Save**

### Step 2: Create Postman Collection

1. Click **Collections** (left sidebar)
2. Click **"+"** to create new collection
3. Name it: `TaskFlow API Tests`
4. Set the collection to use your `TaskFlow API` environment

---

## 🔐 Authentication Flow

### 1. Sign Up

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/auth/signup`  
**Auth:** None

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "ckz7x4u3p0000user001",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Post-response Script (Tests tab):**
```javascript
if (pm.response.code === 201) {
  let userData = pm.response.json().data;
  pm.environment.set("userId", userData.id);
}
```

---

### 2. Login

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/auth/login`  
**Auth:** None

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "ckz7x4u3p0000user001",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

**Post-response Script (Tests tab):**
```javascript
if (pm.response.code === 200) {
  let tokens = pm.response.json().data.tokens;
  pm.environment.set("accessToken", tokens.accessToken);
  pm.environment.set("refreshToken", tokens.refreshToken);
}
```

---

### 3. Refresh Token

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/auth/refresh`  
**Auth:** None

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Post-response Script (Tests tab):**
```javascript
if (pm.response.code === 200) {
  let tokens = pm.response.json().data;
  pm.environment.set("accessToken", tokens.accessToken);
  pm.environment.set("refreshToken", tokens.refreshToken);
}
```

---

### 4. Logout

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/auth/logout`  
**Auth:** Bearer Token

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 📂 Workspace Flow

### 5. Create Workspace

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/workspaces`  
**Auth:** Bearer Token

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "My First Workspace",
  "description": "Testing workspace for APIs"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Workspace created successfully",
  "data": {
    "id": "ckz7x4u3p0000work001",
    "name": "My First Workspace",
    "description": "Testing workspace for APIs",
    "ownerId": "ckz7x4u3p0000user001",
    "createdAt": "2025-04-22T10:30:00Z",
    "updatedAt": "2025-04-22T10:30:00Z"
  }
}
```

**Post-response Script (Tests tab):**
```javascript
if (pm.response.code === 201) {
  let workspace = pm.response.json().data;
  pm.environment.set("workspaceId", workspace.id);
}
```

---

### 6. Get All Workspaces

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/workspaces`  
**Auth:** Bearer Token

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Query Parameters:**
```
page=1
limit=10
```

**Response (200):**
```json
{
  "success": true,
  "message": "Workspaces fetched successfully",
  "data": [
    {
      "id": "ckz7x4u3p0000work001",
      "name": "My First Workspace",
      "description": "Testing workspace for APIs",
      "ownerId": "ckz7x4u3p0000user001",
      "role": "OWNER",
      "createdAt": "2025-04-22T10:30:00Z",
      "updatedAt": "2025-04-22T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

---

### 7. Get Workspace Details

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}`  
**Auth:** Bearer Token

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Workspace fetched successfully",
  "data": {
    "id": "ckz7x4u3p0000work001",
    "name": "My First Workspace",
    "description": "Testing workspace for APIs",
    "ownerId": "ckz7x4u3p0000user001",
    "role": "OWNER",
    "members": [
      {
        "id": "ckz7x4u3p0000user001",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "OWNER"
      }
    ],
    "createdAt": "2025-04-22T10:30:00Z",
    "updatedAt": "2025-04-22T10:30:00Z"
  }
}
```

---

### 8. Update Workspace

**Method:** `PATCH`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}`  
**Auth:** Bearer Token (Owner only)

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "Updated Workspace Name",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Workspace updated successfully",
  "data": {
    "id": "ckz7x4u3p0000work001",
    "name": "Updated Workspace Name",
    "description": "Updated description",
    "ownerId": "ckz7x4u3p0000user001",
    "createdAt": "2025-04-22T10:30:00Z",
    "updatedAt": "2025-04-22T10:35:00Z"
  }
}
```

---

### 9. Invite Member to Workspace

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/invite`  
**Auth:** Bearer Token (Owner only)

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "member@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Invite sent successfully"
}
```

---

### 10. Accept Workspace Invite

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/workspaces/invite/accept`  
**Auth:** Bearer Token

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "token": "eyJhbGc..." // Token from invite email
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Workspace invite accepted",
  "data": {
    "id": "ckz7x4u3p0000work001",
    "name": "My First Workspace"
  }
}
```

---

### 11. Add Member to Workspace

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/members`  
**Auth:** Bearer Token (Owner only)

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "userId": "ckz7x4u3p0000user002",
  "role": "MEMBER"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Member added successfully"
}
```

---

### 12. Change Member Role

**Method:** `PATCH`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/members/{{memberId}}`  
**Auth:** Bearer Token (Owner only)

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "role": "MEMBER"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Member role updated successfully"
}
```

---

### 13. Remove Member from Workspace

**Method:** `DELETE`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/members/{{memberId}}`  
**Auth:** Bearer Token (Owner only)

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

---

### 14. Delete Workspace

**Method:** `DELETE`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}`  
**Auth:** Bearer Token (Owner only)

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Workspace deleted successfully"
}
```

---

## ✅ Task Flow

### 15. Create Task

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/tasks`  
**Auth:** Bearer Token

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "title": "Implement Authentication",
  "description": "Set up JWT-based authentication system",
  "priority": "HIGH",
  "status": "TODO",
  "dueDate": "2025-05-15",
  "assignees": ["ckz7x4u3p0000user002"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "ckz7x4u3p0000task001",
    "title": "Implement Authentication",
    "description": "Set up JWT-based authentication system",
    "priority": "HIGH",
    "status": "TODO",
    "dueDate": "2025-05-15",
    "workspaceId": "ckz7x4u3p0000work001",
    "createdById": "ckz7x4u3p0000user001",
    "assignees": [
      {
        "id": "ckz7x4u3p0000user002",
        "email": "member@example.com",
        "firstName": "Jane",
        "lastName": "Smith"
      }
    ],
    "createdAt": "2025-04-22T11:00:00Z",
    "updatedAt": "2025-04-22T11:00:00Z"
  }
}
```

**Post-response Script (Tests tab):**
```javascript
if (pm.response.code === 201) {
  let task = pm.response.json().data;
  pm.environment.set("taskId", task.id);
}
```

---

### 16. Get All Tasks

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/tasks`  
**Auth:** Bearer Token

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Query Parameters:**
```
page=1
limit=10
status=TODO
priority=HIGH
sortBy=createdAt
sortOrder=desc
```

**Response (200):**
```json
{
  "success": true,
  "message": "Tasks fetched successfully",
  "data": [
    {
      "id": "ckz7x4u3p0000task001",
      "title": "Implement Authentication",
      "description": "Set up JWT-based authentication system",
      "priority": "HIGH",
      "status": "TODO",
      "dueDate": "2025-05-15",
      "workspaceId": "ckz7x4u3p0000work001",
      "createdById": "ckz7x4u3p0000user001",
      "assignees": [
        {
          "id": "ckz7x4u3p0000user002",
          "email": "member@example.com",
          "firstName": "Jane",
          "lastName": "Smith"
        }
      ],
      "createdAt": "2025-04-22T11:00:00Z",
      "updatedAt": "2025-04-22T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

---

### 17. Get Task Details

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/tasks/{{taskId}}`  
**Auth:** Bearer Token

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Task fetched successfully",
  "data": {
    "id": "ckz7x4u3p0000task001",
    "title": "Implement Authentication",
    "description": "Set up JWT-based authentication system",
    "priority": "HIGH",
    "status": "TODO",
    "dueDate": "2025-05-15",
    "workspaceId": "ckz7x4u3p0000work001",
    "createdById": "ckz7x4u3p0000user001",
    "assignees": [
      {
        "id": "ckz7x4u3p0000user002",
        "email": "member@example.com",
        "firstName": "Jane",
        "lastName": "Smith"
      }
    ],
    "createdAt": "2025-04-22T11:00:00Z",
    "updatedAt": "2025-04-22T11:00:00Z"
  }
}
```

---

### 18. Update Task

**Method:** `PATCH`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/tasks/{{taskId}}`  
**Auth:** Bearer Token

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "title": "Implement JWT Authentication",
  "status": "IN_PROGRESS",
  "priority": "MEDIUM"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "id": "ckz7x4u3p0000task001",
    "title": "Implement JWT Authentication",
    "description": "Set up JWT-based authentication system",
    "priority": "MEDIUM",
    "status": "IN_PROGRESS",
    "dueDate": "2025-05-15",
    "workspaceId": "ckz7x4u3p0000work001",
    "createdById": "ckz7x4u3p0000user001",
    "assignees": [
      {
        "id": "ckz7x4u3p0000user002",
        "email": "member@example.com",
        "firstName": "Jane",
        "lastName": "Smith"
      }
    ],
    "createdAt": "2025-04-22T11:00:00Z",
    "updatedAt": "2025-04-22T11:15:00Z"
  }
}
```

---

### 19. Assign User to Task

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/tasks/{{taskId}}/assignees`  
**Auth:** Bearer Token (Owner only)

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "userId": "ckz7x4u3p0000user003"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Assignee added successfully",
  "data": {
    "id": "ckz7x4u3p0000user003",
    "email": "another@example.com",
    "firstName": "Bob",
    "lastName": "Johnson"
  }
}
```

---

### 20. Remove Assignee from Task

**Method:** `DELETE`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/tasks/{{taskId}}/assignees`  
**Auth:** Bearer Token (Owner only)

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "userId": "ckz7x4u3p0000user003"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Assignee removed successfully"
}
```

---

### 21. Delete Task

**Method:** `DELETE`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/tasks/{{taskId}}`  
**Auth:** Bearer Token (Owner only)

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

## 💬 Comment Flow

### 22. Create Comment on Task

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/tasks/{{taskId}}/comments`  
**Auth:** Bearer Token

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "content": "Great progress on this task! Keep up the good work."
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Comment created successfully",
  "data": {
    "id": "ckz7x4u3p0000comm001",
    "content": "Great progress on this task! Keep up the good work.",
    "taskId": "ckz7x4u3p0000task001",
    "createdById": "ckz7x4u3p0000user001",
    "createdAt": "2025-04-22T11:30:00Z",
    "updatedAt": "2025-04-22T11:30:00Z",
    "createdBy": {
      "id": "ckz7x4u3p0000user001",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

**Post-response Script (Tests tab):**
```javascript
if (pm.response.code === 201) {
  let comment = pm.response.json().data;
  pm.environment.set("commentId", comment.id);
}
```

---

### 23. Get All Comments on Task

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/tasks/{{taskId}}/comments`  
**Auth:** Bearer Token

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Comments fetched successfully",
  "data": [
    {
      "id": "ckz7x4u3p0000comm001",
      "content": "Great progress on this task! Keep up the good work.",
      "taskId": "ckz7x4u3p0000task001",
      "createdById": "ckz7x4u3p0000user001",
      "createdAt": "2025-04-22T11:30:00Z",
      "updatedAt": "2025-04-22T11:30:00Z",
      "createdBy": {
        "id": "ckz7x4u3p0000user001",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ]
}
```

---

### 24. Update Comment

**Method:** `PATCH`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/tasks/{{taskId}}/comments/{{commentId}}`  
**Auth:** Bearer Token (Comment author only)

**Headers:**
```
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "content": "Excellent progress! Please continue with the next steps."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Comment updated successfully",
  "data": {
    "id": "ckz7x4u3p0000comm001",
    "content": "Excellent progress! Please continue with the next steps.",
    "taskId": "ckz7x4u3p0000task001",
    "createdById": "ckz7x4u3p0000user001",
    "createdAt": "2025-04-22T11:30:00Z",
    "updatedAt": "2025-04-22T11:35:00Z",
    "createdBy": {
      "id": "ckz7x4u3p0000user001",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

---

### 25. Delete Comment

**Method:** `DELETE`  
**URL:** `{{baseUrl}}/api/workspaceId}}/tasks/{{taskId}}/comments/{{commentId}}`  
**Auth:** Bearer Token (Comment author or workspace owner)

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

## 📎 Attachment Flow

### 26. Upload File Attachment

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/tasks/{{taskId}}/attachments`  
**Auth:** Bearer Token

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Body (form-data):**
- Key: `file`
- Type: `File`
- Value: Select any file from your computer

**Example:** Upload a PDF document

**Response (201):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": "ckz7x4u3p0000atch001",
    "originalName": "project-spec.pdf",
    "mimeType": "application/pdf",
    "fileSize": 2048576,
    "taskId": "ckz7x4u3p0000task001",
    "uploadedById": "ckz7x4u3p0000user001",
    "createdAt": "2025-04-22T11:45:00Z",
    "uploadedBy": {
      "id": "ckz7x4u3p0000user001",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

**Post-response Script (Tests tab):**
```javascript
if (pm.response.code === 201) {
  let attachment = pm.response.json().data;
  pm.environment.set("attachmentId", attachment.id);
}
```

---

### 27. Get All Attachments on Task

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/tasks/{{taskId}}/attachments`  
**Auth:** Bearer Token

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Attachments fetched successfully",
  "data": [
    {
      "id": "ckz7x4u3p0000atch001",
      "originalName": "project-spec.pdf",
      "mimeType": "application/pdf",
      "fileSize": 2048576,
      "taskId": "ckz7x4u3p0000task001",
      "uploadedById": "ckz7x4u3p0000user001",
      "createdAt": "2025-04-22T11:45:00Z",
      "uploadedBy": {
        "id": "ckz7x4u3p0000user001",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ]
}
```

---

### 28. Download Attachment

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/tasks/{{taskId}}/attachments/{{attachmentId}}/download`  
**Auth:** Bearer Token

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Response (200):**
- File downloads automatically
- Content-Type: Application-specific (e.g., `application/pdf`)
- Header: `Content-Disposition: attachment; filename="project-spec.pdf"`

---

### 29. Delete Attachment

**Method:** `DELETE`  
**URL:** `{{baseUrl}}/api/workspaces/{{workspaceId}}/tasks/{{taskId}}/attachments/{{attachmentId}}`  
**Auth:** Bearer Token (Uploader or workspace owner)

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Attachment deleted successfully"
}
```

---

## 🧪 Testing Checklist

Use this checklist to verify all features work correctly:

### Authentication
- [ ] Sign up with new user
- [ ] Login and verify tokens are set
- [ ] Refresh token and verify new access token
- [ ] Logout successfully

### Workspace Management
- [ ] Create workspace
- [ ] List workspaces
- [ ] Get workspace details
- [ ] Update workspace
- [ ] Invite member (send email)
- [ ] Accept invite
- [ ] Add member directly
- [ ] Change member role
- [ ] Remove member
- [ ] Delete workspace

### Task Management
- [ ] Create task with assignees
- [ ] List tasks with filters
- [ ] Get task details
- [ ] Update task
- [ ] Assign user to task
- [ ] Remove assignee
- [ ] Delete task

### Comments
- [ ] Create comment on task
- [ ] Get all comments on task
- [ ] Update comment (as author)
- [ ] Delete comment (as author/owner)

### Attachments
- [ ] Upload file to task
- [ ] Get all attachments
- [ ] Download attachment
- [ ] Delete attachment

### Error Cases
- [ ] Try to create task without auth → 401
- [ ] Try to access workspace as non-member → 403
- [ ] Try to delete workspace as non-owner → 403
- [ ] Submit invalid email format → 422
- [ ] Try to update other user's comment → 403

---

## 📝 Notes

- **Access Token Expiry**: 15 minutes. Use refresh token to get new access token.
- **Refresh Token Expiry**: 7 days.
- **File Upload**: Supports any file type. Max size depends on server configuration.
- **Pagination**: Use `page` and `limit` query parameters. Defaults: page=1, limit=10.
- **Filtering**: Use `status`, `priority`, `sortBy`, `sortOrder` for tasks.
- **RBAC**: Only workspace owners can manage members and delete tasks.
- **Comments & Attachments**: Scoped to tasks within workspaces.

---

## 🚀 Quick Test Sequence

To test the entire flow end-to-end:

1. **Sign Up** → Get userId
2. **Login** → Get accessToken & refreshToken
3. **Create Workspace** → Get workspaceId
4. **Invite/Add Member** → Add another user
5. **Create Task** → Get taskId (assign member)
6. **Update Task** → Change status to IN_PROGRESS
7. **Create Comment** → Add feedback
8. **Upload Attachment** → Add supporting file
9. **List All** → Verify data

If all these steps succeed, your API is working correctly! 🎉

