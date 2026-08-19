import "server-only";
import { spawn } from "child_process";

// 자식 프로세스 실행 공용 헬퍼 (ffmpeg/ffprobe/piper/PowerShell 전부 이걸로 부른다).
export function runProcess(cmd: string, args: string[], stdin?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => (stdout += d.toString()));
    child.stderr?.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${cmd} exited with code ${code}: ${stderr || stdout}`));
    });
    if (stdin !== undefined) {
      child.stdin.write(stdin, "utf8");
      child.stdin.end();
    }
  });
}
