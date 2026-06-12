import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import cycleRouter from "./cycle";
import requestsRouter from "./requests";
import donationsRouter from "./donations";
import articlesRouter from "./articles";
import adminRouter from "./admin";
import ngoRouter from "./ngo";
import publicRouter from "./public";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(cycleRouter);
router.use(requestsRouter);
router.use(donationsRouter);
router.use(articlesRouter);
router.use(adminRouter);
router.use(ngoRouter);
router.use(publicRouter);

export default router;
