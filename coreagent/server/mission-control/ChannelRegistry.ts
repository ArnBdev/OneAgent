import type { MissionControlChannel } from './types';

export class ChannelRegistry {
  /**
   * ARCHITECTURAL EXCEPTION: This Map stores registered mission control channels.
   * It is used for runtime channel registry, not persistent state.
   * This usage is allowed for channel management infrastructure.
   */
  // eslint-disable-next-line oneagent/no-parallel-cache
  private channels = new Map<string, MissionControlChannel>();
  register(channel: MissionControlChannel) {
    this.channels.set(channel.name, channel);
  }
  get(name: string) {
    return this.channels.get(name);
  }
  list() {
    return Array.from(this.channels.keys());
  }
}
