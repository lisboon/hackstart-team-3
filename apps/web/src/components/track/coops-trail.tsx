import { ProgressRing } from "@/components/ui/progress-ring";
import { STAGE_LABEL } from "@/components/journey/coops-presentation";
import type { TrackResponse } from "@/schemas/track";

const CheckIcon = () => (
  <svg
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-[18px] h-[18px]"
  >
    <path d="M4 9l3.4 3.4L14 5.8" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 18 18" fill="currentColor" className="w-[18px] h-[18px]">
    <path d="M6.5 4l6.5 5-6.5 5Z" />
  </svg>
);

const LockIcon = () => (
  <svg
    viewBox="0 0 18 18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    className="w-[18px] h-[18px]"
  >
    <rect x="4.5" y="7.8" width="9" height="6.6" rx="2" />
    <path d="M6.6 7.8V6.3a2.4 2.4 0 0 1 4.8 0v1.5" />
  </svg>
);

export function CoopsTrail({ data }: { data: TrackResponse }) {
  const firstUnfinishedIndex = data.stages.findIndex(
    (stage) => stage.answered < stage.total || (stage.total === 0 && stage.answered === 0)
  );

  const nodes = data.stages.map((stage, i) => {
    let state: "done" | "now" | "lock";
    if (stage.answered >= stage.total && stage.total > 0) {
      state = "done";
    } else if (i === firstUnfinishedIndex) {
      state = "now";
    } else {
      state = "lock";
    }

    const coreClass =
      state === "done"
        ? "border-primary text-primary"
        : state === "now"
          ? "bg-foreground border-foreground text-background"
          : "border-muted-foreground/30 text-muted-foreground bg-background";

    const isRight = i % 2 !== 0;

    return (
      <div key={stage.stage}>
        {i > 0 && (
          <div
            className={`w-[1px] h-3 bg-border flex-none ${
              isRight ? "ml-auto mr-[29px]" : "ml-[29px]"
            }`}
          />
        )}
        <div
          className={`flex items-center gap-3 py-1 ${
            isRight ? "flex-row-reverse text-right" : "flex-row"
          }`}
        >
          <div className="relative w-[58px] h-[58px] flex-none grid place-items-center">
            <ProgressRing
              ratio={stage.total > 0 ? stage.answered / stage.total : 0}
              size={58}
              stroke={2}
              label={`Etapa ${STAGE_LABEL[stage.stage]}, ${stage.answered} de ${
                stage.total > 0 ? stage.total : "trancada"
              }`}
            />
            <div className="absolute inset-0 grid place-items-center">
              <div
                className={`w-10 h-10 rounded-full grid place-items-center border ${coreClass}`}
              >
                {state === "done" && <CheckIcon />}
                {state === "now" && <PlayIcon />}
                {state === "lock" && <LockIcon />}
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <b
              className={`font-serif text-base font-normal block ${
                state === "lock" ? "text-muted-foreground" : ""
              }`}
            >
              {STAGE_LABEL[stage.stage]}
            </b>
            <span className="text-[0.68rem] text-muted-foreground block">
              {stage.total === 0 ? "trancada" : `${stage.answered} de ${stage.total}`}
            </span>
          </div>
        </div>
      </div>
    );
  });

  return <div className="flex flex-col gap-0.5 overflow-hidden">{nodes}</div>;
}
