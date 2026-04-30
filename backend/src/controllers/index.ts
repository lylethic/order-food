import { Router } from 'express';
import authRouter from './auth.js';
import healthRouter from './health.js';
import categoriesRouter from './categories.js';
import menuItemsRouter from './menuItems.js';
import ordersRouter from './orders.js';
import roleRouter from './role.js';
import userRouter from './user.js';
import staticFilesRouter from './staticFiles.js';

const apiRouter = Router();

// Group them all here
// NOTE: each controller already contains the full path prefix in its route
// definitions (e.g. router.get('/users', ...)), so all routers are mounted at '/'.
apiRouter.use('/', authRouter);
apiRouter.use('/', healthRouter);
apiRouter.use('/', categoriesRouter);
apiRouter.use('/', menuItemsRouter);
apiRouter.use('/', ordersRouter);
apiRouter.use('/', roleRouter);
apiRouter.use('/', userRouter);
apiRouter.use('/', staticFilesRouter);

export default apiRouter;
