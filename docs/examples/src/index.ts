import { CandyGraph } from "../../..";
import RelativeTime from "./relative-time";
import TimeAndState from "./time-and-state";
import LinearLog from "./linear-log";
import HealthAndWealth from "./health-and-wealth";
import InterleavedLineSegments from "./interleaved-line-segments";
import MultiViewport from "./multi-viewport";
import SimplePlot from "./simple-plot";

const cg = new CandyGraph();
cg.canvas.width = cg.canvas.height = 1024;
MultiViewport(cg);
TimeAndState(cg);
LinearLog(cg);
InterleavedLineSegments(cg);
SimplePlot(cg);
HealthAndWealth(cg);
RelativeTime(cg);
