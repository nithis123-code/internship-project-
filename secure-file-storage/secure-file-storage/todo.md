# Secure File Storage - Project TODO

## Database & Schema
- [x] Create files table (id, userId, fileName, fileSize, mimeType, s3Key, s3Url, encryptionKeyId, uploadedAt, updatedAt)
- [x] Create encryption_keys table (id, userId, keyName, keyHash, createdAt, isActive)
- [x] Create file_shares table (id, fileId, shareToken, expiresAt, createdAt, createdBy)
- [x] Create activity_logs table (id, userId, action, fileId, details, timestamp)
- [x] Create storage_quotas table (id, userId, totalQuotaBytes, usedBytes, updatedAt)

## Backend API - Encryption & Key Management
- [x] Implement AES-256 encryption/decryption utilities
- [x] Create tRPC procedure: files.generateKey (create new user encryption key)
- [x] Create tRPC procedure: files.listKeys (get user's encryption keys)
- [x] Create tRPC procedure: files.deleteKey (remove encryption key)
- [x] Create tRPC procedure: files.setActiveKey (set default encryption key)

## Backend API - File Operations
- [x] Create tRPC procedure: files.upload (handle file upload, encrypt, store in S3)
- [x] Create tRPC procedure: files.list (get user's files with metadata)
- [x] Create tRPC procedure: files.download (retrieve and decrypt file from S3)
- [x] Create tRPC procedure: files.delete (remove file from S3 and database)
- [x] Create tRPC procedure: files.getMetadata (get single file info)

## Backend API - Sharing & Access
- [x] Create tRPC procedure: files.createShare (generate shareable encrypted link with expiration)
- [x] Create tRPC procedure: files.getShared (access shared file without authentication)
- [x] Create tRPC procedure: files.listShares (get user's active shares)
- [x] Create tRPC procedure: files.deleteShare (revoke share link)

## Backend API - Storage & Activity
- [x] Create tRPC procedure: files.getQuota (get user's storage usage)
- [x] Create tRPC procedure: files.getActivityLog (get user's file activity history)
- [x] Implement activity logging for upload/download/delete operations

## Frontend - Design System & Layout
- [ ] Create neon-noir color palette in Tailwind (midnight navy, hot pink, electric blue, cyan, magenta)
- [ ] Set up global styles with glow effects and accent lines
- [ ] Create DashboardLayout component with sidebar navigation
- [ ] Implement responsive design for mobile/tablet/desktop

## Frontend - Authentication & Navigation
- [ ] Update Home page with login/signup flow
- [ ] Create Dashboard page (main hub after login)
- [ ] Implement navigation between Dashboard, Files, Keys, Activity pages
- [ ] Add user profile menu with logout

## Frontend - File Management Dashboard
- [ ] Create Files page with file list table/grid view
- [ ] Implement file metadata display (name, size, upload date, encryption status)
- [ ] Add file action buttons (download, share, delete, info)
- [ ] Create file deletion confirmation dialog
- [ ] Implement file search and filtering

## Frontend - File Upload
- [ ] Create file upload component with drag-and-drop support
- [ ] Implement file type validation and size checking
- [ ] Add upload progress indicator
- [ ] Display upload success/error messages
- [ ] Show storage quota before upload

## Frontend - Encryption Key Management
- [ ] Create Keys page to view and manage encryption keys
- [ ] Implement key generation interface
- [ ] Add ability to set active encryption key
- [ ] Create key deletion with confirmation
- [ ] Display key creation date and usage info

## Frontend - File Sharing
- [ ] Create share dialog with link generation
- [ ] Implement expiration date picker for shares
- [ ] Add copy-to-clipboard for share links
- [ ] Create share management page to view/revoke shares
- [ ] Implement shared file access page (no auth required)

## Frontend - Activity & Quotas
- [ ] Create Activity Log page showing file operations
- [ ] Display activity with timestamps and details
- [ ] Add storage quota display with usage bar
- [ ] Show quota percentage and remaining space

## Integration & Testing
- [ ] Test AES-256 encryption/decryption with various file types
- [ ] Test S3 upload/download functionality
- [ ] Test file sharing with expiration
- [ ] Test storage quota calculations
- [ ] Verify role-based access control (admin vs user)
- [ ] Test activity logging accuracy
- [ ] Write vitest tests for critical functions

## Deployment & Polish
- [ ] Verify all error handling and user feedback
- [ ] Test responsive design on multiple devices
- [ ] Optimize performance (lazy loading, caching)
- [ ] Add loading states and skeleton screens
- [ ] Finalize neon-noir visual polish
- [ ] Create checkpoint before publishing
