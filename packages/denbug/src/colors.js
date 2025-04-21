import chalk from 'chalk';

export function colorize(text, color) {
    switch (color) {
        case 'red':
            return chalk.red(text);
        case 'green':
            return chalk.green(text);
        case 'blue':
            return chalk.blue(text);
        default:
            return text;
    }
}
