import pkg from '../../../package.json';

export const MISSION_CONTROL_WS_PATH = '/ws/mission-control';
export const SERVER_NAME = pkg.name || 'OneAgent MCP';
export const SERVER_VERSION = pkg.version || 'unknown';
// Increment when backward-incompatible protocol wire changes occur
export const MISSION_CONTROL_PROTOCOL_VERSION = 1;
