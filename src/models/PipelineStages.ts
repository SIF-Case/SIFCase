import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPipelineStage {
  key: string;
  label: string;
}

export interface IPipelineStages extends Document {
  stages: IPipelineStage[];
}

const PipelineStageSchema = new Schema<IPipelineStage>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false },
);

export const DEFAULT_PIPELINE_STAGES: IPipelineStage[] = [
  { key: "lead", label: "Lead" },
  { key: "call_req", label: "Call Req" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal", label: "Proposal" },
  { key: "onboarded", label: "Onboarded" },
  { key: "lost", label: "Lost" },
];

const PipelineStagesSchema = new Schema<IPipelineStages>(
  {
    stages: { type: [PipelineStageSchema], default: DEFAULT_PIPELINE_STAGES },
  },
  { timestamps: true },
);

const PipelineStages: Model<IPipelineStages> =
  mongoose.models.PipelineStages || mongoose.model<IPipelineStages>("PipelineStages", PipelineStagesSchema);

export default PipelineStages;
