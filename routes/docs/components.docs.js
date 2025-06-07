/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: >-
 *         Enter the token with the `Bearer ` prefix, e.g. "Bearer abcde12345"
 *
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the user
 *         name:
 *           type: string
 *           description: The user's full name
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email address (must be unique)
 *         role:
 *           type: string
 *           enum: [reporter, government, admin]
 *           description: The user's role in the system
 *         status:
 *           type: string
 *           enum: [pending, active, suspended]
 *           default: active
 *           description: The user's account status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date when the user was last updated
 *       example:
 *         _id: 5f8d0f4d7f4f3d3e3c3b3a39
 *         name: John Doe
 *         email: john@example.com
 *         role: reporter
 *         status: active
 *         createdAt: 2023-10-25T10:00:00.000Z
 *         updatedAt: 2023-10-25T10:00:00.000Z
 *
 *     Report:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the report
 *         title:
 *           type: string
 *           description: The title of the report
 *         description:
 *           type: string
 *           description: Detailed description of the issue
 *         location:
 *           type: string
 *           description: The location where the issue was reported
 *         category:
 *           type: string
 *           enum: [road, public_service, environment, other]
 *           description: The category of the report
 *         status:
 *           type: string
 *           enum: [pending, in_progress, resolved, escalated]
 *           default: pending
 *           description: The current status of the report
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: Array of image URLs related to the report
 *         reporter:
 *           $ref: '#/components/schemas/User'
 *         assignedTo:
 *           $ref: '#/components/schemas/User'
 *         comments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
 *         votes:
 *           type: integer
 *           default: 0
 *           description: Number of votes this report has received
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the report was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date when the report was last updated
 *       example:
 *         _id: 5f8d0f4d7f4f3d3e3c3b3a40
 *         title: Pothole on Main Street
 *         description: Large pothole causing traffic issues
 *         location: "9.0054° N, 38.7636° E"
 *         category: road
 *         status: pending
 *         images: ["https://example.com/images/pothole1.jpg"]
 *         reporter: {_id: "5f8d0f4d7f4f3d3e3c3b3a39", name: "John Doe"}
 *         assignedTo: null
 *         comments: []
 *         votes: 5
 *         createdAt: 2023-10-25T10:05:00.000Z
 *         updatedAt: 2023-10-25T10:05:00.000Z
 *
 *     Comment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the comment
 *         text:
 *           type: string
 *           description: The comment text
 *         user:
 *           $ref: '#/components/schemas/User'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the comment was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date when the comment was last updated
 *       example:
 *         _id: 5f8d0f4d7f4f3d3e3c3b3a41
 *         text: This has been reported before
 *         user: {_id: "5f8d0f4d7f4f3d3e3c3b3a39", name: "John Doe"}
 *         createdAt: 2023-10-25T10:10:00.000Z
 *         updatedAt: 2023-10-25T10:10:00.000Z
 *
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the notification
 *         title:
 *           type: string
 *           description: The notification title
 *         message:
 *           type: string
 *           description: The notification message
 *         type:
 *           type: string
 *           enum: [status_update, new_comment, report_assigned, user_registered, system]
 *           description: The type of notification
 *         isRead:
 *           type: boolean
 *           default: false
 *           description: Whether the notification has been read
 *         user:
 *           $ref: '#/components/schemas/User'
 *           description: The user who should receive the notification
 *         relatedTo:
 *           type: string
 *           description: ID of the related entity (e.g., report ID)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the notification was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date when the notification was last updated
 *       example:
 *         _id: 5f8d0f4d7f4f3d3e3c3b3a42
 *         title: Report Status Updated
 *         message: 'Your report "Pothole on Main Street" has been marked as in progress.'
 *         type: status_update
 *         isRead: false
 *         user: {_id: "5f8d0f4d7f4f3d3e3c3b3a39", name: "John Doe"}
 *         relatedTo: "5f8d0f4d7f4f3d3e3c3b3a40"
 *         createdAt: 2023-10-25T10:15:00.000Z
 *         updatedAt: 2023-10-25T10:15:00.000Z
 *
 *   responses:
 *     UnauthorizedError:
 *       description: Unauthorized - Authentication token is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Not authorized, token failed
 *
 *     ForbiddenError:
 *       description: Forbidden - User doesn't have permission to access this resource
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Not authorized as an admin
 *
 *     NotFound:
 *       description: The requested resource was not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: User not found
 *
 *     ValidationError:
 *       description: Validation error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: Validation error
 *               errors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                     message:
 *                       type: string
 */
