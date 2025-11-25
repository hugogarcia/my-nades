import { Notyf } from "notyf";
import "notyf/notyf.min.css";

const notyf = new Notyf({ duration: 3000, position: { x: "right", y: "top" } });

export const notify = {
  success: (msg: string) => notyf.success(msg),
  error: (msg: string) => notyf.error(msg),
};
