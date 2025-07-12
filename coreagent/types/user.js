"use strict";
/**
 * User types and interfaces for CoreAgent
 * Defines user structure and session management with UUID standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidUUID = isValidUUID;
exports.generateUUID = generateUUID;
/**
 * UUID validation utility - ensures UUID v4 format
 */
function isValidUUID(uuid) {
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidV4Regex.test(uuid);
}
/**
 * Generate UUID v4 compatible string
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
