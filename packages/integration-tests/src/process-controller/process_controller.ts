import * as pty from 'node-pty';
import { PredicatedActionBuilder } from './predicated_action_queue_builder.js';
import { ActionType } from './predicated_action.js';
import { killExecaProcess } from './execa_process_killer.js';
import { EOL } from 'os';
/**
 * Provides an abstractions for sending and receiving data on stdin/out of a child process
 *
 * The general strategy is to read stdout of the child process line by line and consume a queue of actions as output is ingested.
 *
 * When .run() is called, the child process is spawned and the actions are awaited and executed one by one
 *
 * Each action is essentially a condition to wait for stdout to satisfy and some data to send on stdin once the wait condition is met
 *
 * For example `.waitForLineIncludes('Do you like M&Ms').sendLine('yes')`
 * will wait until a line that includes "Do you like M&Ms" is printed on stdout of the child process,
 * then send "yes" on stdin of the process
 */
export class ProcessController {
  private readonly interactions: PredicatedActionBuilder =
    new PredicatedActionBuilder();
  /**
   * Initialize a process controller for the specified command and args.
   *
   * The command is not executed until .run() is awaited
   *
   * To define actions that the controller should perform on the child process, use .do() before calling .run()
   */
  constructor(
    private readonly command: string,
    private readonly args: string[] = [],
    private readonly options?: Pick<pty.IPtyForkOptions, 'cwd' | 'env'>
  ) {}

  do = (interactions: PredicatedActionBuilder) => {
    this.interactions.append(interactions);
    return this;
  };

  /**
   * Execute the sequence of actions queued on the process
   */
  run = async () => {
    const interactionQueue = this.interactions.getPredicatedActionQueue();
    const ptyProcess = PtyProcess.spawn(this.command, this.args, {
      ...this.options,
    });
    let errorThrownFromActions = undefined;
    let expectKilled = false;

    for await (const line of ptyProcess.output) {
      const currentInteraction = interactionQueue[0];
      if (currentInteraction) {
        console.log(
          `[pid=${ptyProcess.pid}] Current interaction: ${currentInteraction?.description}`
        );
      }
      console.log(`[pid=${ptyProcess.pid}] Current line: ${line}`);
      try {
        // For now we only have one predicate type. If we add more predicate types in the future, we will have to
        // turn this into a predicate executor (Similar to the switch-case for actions below)
        if (currentInteraction?.ifThis.predicate(line)) {
          switch (currentInteraction.then?.actionType) {
            case ActionType.SEND_INPUT_TO_PROCESS:
              await currentInteraction.then.action(ptyProcess);
              break;
            case ActionType.KILL_PROCESS:
              expectKilled = true;
              await currentInteraction.then.action(ptyProcess);
              break;
            case ActionType.UPDATE_FILE_CONTENT:
              await currentInteraction.then.action();
              break;
            case ActionType.ASSERT_ON_PROCESS_OUTPUT:
              currentInteraction.then.action(line);
              break;
            default:
              break;
          }
        } else {
          continue;
        }
      } catch (error) {
        // TODO revisit this
        ptyProcess.kill('SIGKILL');
        await killExecaProcess(ptyProcess);
        ptyProcess.write('N');
        errorThrownFromActions = error;
      }
      // advance the queue
      interactionQueue.shift();
    }

    const result = await ptyProcess.processCompletion;

    if (errorThrownFromActions) {
      throw errorThrownFromActions;
    } else if (result.failed && !expectKilled) {
      throw new Error(result.output);
    }
  };
}

export type PtyProcessResult = {
  failed: boolean;
  output: string;
};

export class PtyProcessOutput implements AsyncIterableIterator<string> {
  private hasFinished = false;
  private currentResolve: ((value: IteratorResult<string>) => void) | undefined;
  private outputQueue: Array<string> = [];
  readonly allOutput: Array<string> = [];

  [Symbol.asyncIterator] = (): AsyncIterableIterator<string> => {
    return this;
  };

  onData = (data: string) => {
    const lines = data.split(/\r\n|\r|\n/);
    for (const line of lines) {
      this.outputQueue.push(line);
      this.allOutput.push(line);
    }
    this.tryConsume();
  };

  onExit = () => {
    this.hasFinished = true;
    this.tryConsume();
  };

  private tryConsume = () => {
    if (this.hasFinished && this.outputQueue.length === 0) {
      if (this.currentResolve) {
        this.currentResolve({
          done: true,
          value: '',
        });
        this.currentResolve = undefined;
      }
    } else if (this.outputQueue.length > 0) {
      if (this.currentResolve) {
        const line = this.outputQueue.shift();
        if (line !== undefined) {
          this.currentResolve({
            done: false,
            value: line,
          });
        }
        this.currentResolve = undefined;
      }
    }
  };

  next(): Promise<IteratorResult<string>> {
    const nextPromise: Promise<IteratorResult<string>> = new Promise(
      (resolve) => {
        this.currentResolve = resolve;
      }
    );
    // TODO this is hacky for now
    const timeoutPromise: Promise<IteratorResult<string>> = new Promise(
      (resolve, reject) => {
        setTimeout(reject, 5 * 60 * 1000, 'one');
      }
    );
    this.tryConsume();
    return Promise.race([nextPromise, timeoutPromise]);
  }
}

export class PtyProcess {
  static spawn = (
    command: string,
    args: Array<string>,
    options?: pty.IPtyForkOptions
  ) => {
    const ptyOptions: pty.IPtyForkOptions = {
      ...options,
      cols: 160,
    };
    ptyOptions.env = {
      ...process.env,
      ...ptyOptions.env,
    };
    const ptyProcess = pty.spawn(command, args, ptyOptions);
    console.log(
      `Spawned ${ptyProcess.pid.toString()} , ${command} ${args.join(' ')}`
    );
    return new PtyProcess(ptyProcess);
  };

  readonly processCompletion: Promise<PtyProcessResult>;
  readonly output: PtyProcessOutput;
  readonly pid: number;

  constructor(private readonly ptyProcess: pty.IPty) {
    this.pid = ptyProcess.pid;
    this.output = new PtyProcessOutput();
    this.processCompletion = new Promise((resolve) => {
      this.ptyProcess.onExit((exitProps) => {
        console.log(`[pid=${this.pid}] exitProps ${JSON.stringify(exitProps)}`);
        this.output.onExit();
        resolve({
          failed: exitProps.exitCode !== 0,
          output: this.output.allOutput.join(EOL),
        });
      });
    });
    this.ptyProcess.onData((data) => {
      if (typeof data === 'string') {
        console.log(`[pid=${this.pid}] onData ${data}`);
      }
      this.output.onData(data);
    });
  }

  write = (line: string) => {
    this.ptyProcess.write(line);
  };

  kill = (signal: string) => {
    this.ptyProcess.kill(signal);
  };
}

/**
 * Factory function that returns a ProcessController for the Amplify CLI
 */
export const amplifyCli = (
  args: string[] = [],
  dir: string,
  options?: {
    installationType?: 'global' | 'local';
    env?: Record<string, string>;
  }
): ProcessController => {
  let command: string;
  if (options?.installationType === 'local') {
    if (process.platform.includes('win32')) {
      command = 'npx.cmd';
    } else {
      command = 'npx';
    }
    args = ['amplify'].concat(args);
  } else {
    // command = 'amplify';
    if (process.platform.includes('win32')) {
      command = 'npx.cmd';
    } else {
      command = 'npx';
    }
    args = ['amplify'].concat(args);
  }
  return new ProcessController(command, args, {
    cwd: dir,
    env: options?.env,
  });
};
