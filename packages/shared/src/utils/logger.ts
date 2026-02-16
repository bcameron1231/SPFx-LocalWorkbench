/**
 * Log levels for controlling verbosity
 */
export enum LogLevel {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3,
    None = 4
}

/**
 * Logger class for consistent, level-controlled logging
 */
class Logger {
    private level: LogLevel = LogLevel.Info;
    private prefix: string = '';

    /**
     * Set the minimum log level to display
     */
    setLevel(level: LogLevel): void {
        this.level = level;
    }

    /**
     * Set a prefix for all log messages
     */
    setPrefix(prefix: string): void {
        this.prefix = prefix;
    }

    /**
     * Log debug information (verbose)
     */
    debug(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.Debug) {
            console.log(`[DEBUG]${this.prefix} ${message}`, ...args);
        }
    }

    /**
     * Log informational messages
     */
    info(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.Info) {
            console.log(`[INFO]${this.prefix} ${message}`, ...args);
        }
    }

    /**
     * Log warning messages
     */
    warn(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.Warn) {
            console.warn(`[WARN]${this.prefix} ${message}`, ...args);
        }
    }

    /**
     * Log error messages
     */
    error(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.Error) {
            console.error(`[ERROR]${this.prefix} ${message}`, ...args);
        }
    }

    /**
     * Create a child logger with an additional prefix
     */
    createChild(prefix: string): Logger {
        const child = new Logger();
        child.setLevel(this.level);
        child.setPrefix(`${this.prefix} [${prefix}]`);
        return child;
    }
}

/** Global logger instance */
export const logger = new Logger();
