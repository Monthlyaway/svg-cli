import type { Command } from '../application/Command.js';
import { NumberValue } from '../domain/NumberValue.js';
import { Tokenizer } from './Tokenizer.js';
import { CreateCommand } from '../application/commands/CreateCommand.js';
import { DeleteCommand } from '../application/commands/DeleteCommand.js';
import { MoveCommand } from '../application/commands/MoveCommand.js';
import { ScaleCommand } from '../application/commands/ScaleCommand.js';
import { SetCommand } from '../application/commands/SetCommand.js';
import { GroupCommand } from '../application/commands/GroupCommand.js';
import { UngroupCommand } from '../application/commands/UngroupCommand.js';
import { AddToCommand } from '../application/commands/AddToCommand.js';
import { OrderCommand } from '../application/commands/OrderCommand.js';
import { InitCommand } from '../application/commands/InitCommand.js';
import { ReadCommand } from '../application/commands/ReadCommand.js';
import { SaveCommand } from '../application/commands/SaveCommand.js';
import { CanvasCommand } from '../application/commands/CanvasCommand.js';
import { HistoryCommand } from '../application/commands/HistoryCommand.js';
import { TreeCommand } from '../application/commands/TreeCommand.js';
import { ShowCommand } from '../application/commands/ShowCommand.js';
import { HelpCommand } from '../application/commands/HelpCommand.js';

export class CommandParser {
  // Phase 1's one command-name dispatch point; command implementations contain behavior.
  private readonly commands = new Map<string, { min: number; max: number; make: (args: string[]) => Command }>([
    ['init', { min: 0, max: 2, make: a => new InitCommand(a[0] === undefined ? 800 : NumberValue.parse(a[0]), a[1] === undefined ? 600 : NumberValue.parse(a[1])) }],
    ['read', { min: 1, max: 1, make: a => new ReadCommand(a[0]!) }],
    ['save', { min: 0, max: 1, make: a => new SaveCommand(a[0]) }],
    ['canvas', { min: 0, max: 2, make: a => { if (a.length === 1) throw new Error('usage: canvas [w h]'); return new CanvasCommand(a[0] === undefined ? undefined : NumberValue.parse(a[0]), a[1] === undefined ? undefined : NumberValue.parse(a[1])); } }],
    ['create', { min: 2, max: 10, make: a => { const parent = a.length >= 4 && a.at(-2) === 'in' ? a.pop() : undefined; if (parent !== undefined) a.pop(); return new CreateCommand(a[0]!, a[1]!, a.slice(2), parent); } }],
    ['delete', { min: 1, max: 1, make: a => new DeleteCommand(a[0]!) }],
    ['move', { min: 3, max: 3, make: a => new MoveCommand(a[0]!, NumberValue.parse(a[1]!), NumberValue.parse(a[2]!)) }],
    ['scale', { min: 2, max: 2, make: a => new ScaleCommand(a[0]!, NumberValue.positive(a[1]!, 'scale factor')) }],
    ['set', { min: 3, max: 3, make: a => new SetCommand(a[0]!, a[1]!, a[2]!) }],
    ['group', { min: 2, max: 10001, make: a => new GroupCommand(a[0]!, a.slice(1)) }],
    ['ungroup', { min: 1, max: 1, make: a => new UngroupCommand(a[0]!) }],
    ['addto', { min: 2, max: 2, make: a => new AddToCommand(a[0]!, a[1]!) }],
    ['front', { min: 1, max: 1, make: a => new OrderCommand(a[0]!, true) }],
    ['back', { min: 1, max: 1, make: a => new OrderCommand(a[0]!, false) }],
    ['tree', { min: 0, max: 1, make: a => new TreeCommand(a[0]) }],
    ['show', { min: 1, max: 1, make: a => new ShowCommand(a[0]!) }],
    ['help', { min: 0, max: 0, make: () => new HelpCommand() }],
    ['undo', { min: 0, max: 0, make: () => new HistoryCommand(true) }],
    ['redo', { min: 0, max: 0, make: () => new HistoryCommand(false) }],
  ]);
  parse(line: string): Command | 'exit' | undefined {
    const [name, ...args] = new Tokenizer().tokenize(line);
    if (!name) return undefined;
    if (name === 'exit') { if (args.length) throw new Error('usage: exit'); return 'exit'; }
    const definition = this.commands.get(name);
    if (!definition) throw new Error(`unknown command: ${name}`);
    if (args.length < definition.min || args.length > definition.max) throw new Error(`invalid arguments for ${name}; use 'help'`);
    return definition.make(args);
  }
}
