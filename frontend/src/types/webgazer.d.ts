declare module "webgazer" {
  interface WebGazer {
    setRegression: (name: string) => WebGazer;
    setTracker: (name: string) => WebGazer;
    setGazeListener: (
      cb: (data: { x: number; y: number } | null, ts: number) => void,
    ) => WebGazer;
    saveDataAcrossSessions: (flag: boolean) => WebGazer;
    showVideoPreview: (flag: boolean) => WebGazer;
    showPredictionPoints: (flag: boolean) => WebGazer;
    showFaceOverlay: (flag: boolean) => WebGazer;
    showFaceFeedbackBox: (flag: boolean) => WebGazer;
    begin: () => Promise<WebGazer>;
    end: () => void;
    clearGazeListener: () => WebGazer;
    pause: () => void;
    resume: () => void;
    /** Feed a calibration sample mapping the current eye signal to (x, y). */
    recordScreenPosition: (x: number, y: number, eventType?: string) => void;
    clearData: () => void;
    params: Record<string, unknown>;
  }
  const webgazer: WebGazer;
  export default webgazer;
}
