/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: System statistics and analytics
 */

/**
 * @swagger
 * /statistics:
 *   get:
 *     summary: Get system statistics (Government/Admin only)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering statistics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering statistics (YYYY-MM-DD)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [road, public_service, environment, other]
 *         description: Filter statistics by report category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, resolved, escalated]
 *         description: Filter statistics by report status
 *     responses:
 *       200:
 *         description: Statistics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reports:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     byStatus:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: integer
 *                         in_progress:
 *                           type: integer
 *                         resolved:
 *                           type: integer
 *                         escalated:
 *                           type: integer
 *                     byCategory:
 *                       type: object
 *                       properties:
 *                         road:
 *                           type: integer
 *                         public_service:
 *                           type: integer
 *                         environment:
 *                           type: integer
 *                         other:
 *                           type: integer
 *                     trend:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           count:
 *                             type: integer
 *                 users:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     byRole:
 *                       type: object
 *                       properties:
 *                         reporter:
 *                           type: integer
 *                         government:
 *                           type: integer
 *                         admin:
 *                           type: integer
 *                 responseTime:
 *                   type: object
 *                   properties:
 *                     average:
 *                       type: number
 *                       format: float
 *                     median:
 *                       type: number
 *                       format: float
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Server error
 *
 * /statistics/reports:
 *   get:
 *     summary: Get detailed report statistics (Government/Admin only)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering statistics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering statistics (YYYY-MM-DD)
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *         description: Time period to group statistics by
 *     responses:
 *       200:
 *         description: Detailed report statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalReports:
 *                   type: integer
 *                 reportsByStatus:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 reportsByCategory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 reportsOverTime:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       period:
 *                         type: string
 *                       count:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Server error
 *
 * /statistics/users:
 *   get:
 *     summary: Get user statistics (Admin only)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 usersByRole:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       role:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 usersOverTime:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       count:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Server error
 */
