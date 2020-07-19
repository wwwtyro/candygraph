import { CandyGraph } from "../../..";
import doc_00100 from "./doc-00100";
import doc_00200 from "./doc-00200";
import doc_00300 from "./doc-00300";
import doc_00400 from "./doc-00400";

const cg = new CandyGraph();
cg.canvas.width = cg.canvas.height = 2048;
doc_00100(cg);
doc_00200(cg);
doc_00300(cg);
doc_00400(cg);
