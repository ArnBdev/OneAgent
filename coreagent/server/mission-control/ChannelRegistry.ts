import type { MissionControlChannel } from './types';

export class ChannelRegistry {
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
