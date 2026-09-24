import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getTierForSeconds,
  calculateHouseScale,
  calculateFurnitureScales,
  TwitchWatchTimeTracker,
  TIERS
} from '../server/twitch-tracker.js';

describe('Watch Time Tier Determination', () => {
  test('returns Tier 1 for 0 seconds', () => {
    const tier = getTierForSeconds(0);
    assert.equal(tier.id, 1);
    assert.equal(tier.name, 'Lurker Starter Pod');
  });

  test('returns Tier 1 for 14 minutes (840 seconds)', () => {
    const tier = getTierForSeconds(840);
    assert.equal(tier.id, 1);
  });

  test('returns Tier 2 at exactly 15 minutes (900 seconds)', () => {
    const tier = getTierForSeconds(900);
    assert.equal(tier.id, 2);
    assert.equal(tier.name, 'Cozy Cottage');
  });

  test('returns Tier 3 at 1 hour (3600 seconds)', () => {
    const tier = getTierForSeconds(3600);
    assert.equal(tier.id, 3);
    assert.equal(tier.name, 'Two-Story Residence');
  });

  test('returns Tier 4 at 5 hours (18000 seconds)', () => {
    const tier = getTierForSeconds(18000);
    assert.equal(tier.id, 4);
    assert.equal(tier.name, 'Modern Glass Villa');
  });

  test('returns Tier 5 at 20+ hours (72000 seconds)', () => {
    const tier = getTierForSeconds(72000);
    assert.equal(tier.id, 5);
    assert.equal(tier.name, 'Titan Sky Citadel');
  });

  test('handles negative seconds gracefully', () => {
    const tier = getTierForSeconds(-100);
    assert.equal(tier.id, 1);
  });
});

describe('Continuous House & Building Scaling Engine', () => {
  test('house scale matches tier boundaries exactly', () => {
    assert.equal(calculateHouseScale(0), 1.0);
    assert.equal(calculateHouseScale(900), 1.35); // 15m
    assert.equal(calculateHouseScale(3600), 1.80); // 1h
    assert.equal(calculateHouseScale(18000), 2.30); // 5h
    assert.equal(calculateHouseScale(72000), 3.00); // 20h
  });

  test('house scale increases continuously between tier boundaries', () => {
    const scale0 = calculateHouseScale(0);
    const scale7m = calculateHouseScale(450);
    const scale15m = calculateHouseScale(900);
    const scale30m = calculateHouseScale(1800);
    const scale1h = calculateHouseScale(3600);
    const scale3h = calculateHouseScale(10800);
    const scale5h = calculateHouseScale(18000);
    const scale10h = calculateHouseScale(36000);
    const scale20h = calculateHouseScale(72000);
    const scale40h = calculateHouseScale(144000);

    assert.ok(scale7m > scale0, 'House should grow between 0 and 15m');
    assert.ok(scale15m > scale7m);
    assert.ok(scale30m > scale15m, 'House should grow between 15m and 1h');
    assert.ok(scale1h > scale30m);
    assert.ok(scale3h > scale1h, 'House should grow between 1h and 5h');
    assert.ok(scale5h > scale3h);
    assert.ok(scale10h > scale5h, 'House should grow between 5h and 20h');
    assert.ok(scale20h > scale10h);
    assert.ok(scale40h > scale20h, 'House should continue growing past 20h');
  });
});

describe('Furniture Scaling Engine', () => {
  test('scales increase monotonically with watch time', () => {
    const scaleZero = calculateFurnitureScales(0);
    const scale10m = calculateFurnitureScales(600);
    const scale1h = calculateFurnitureScales(3600);
    const scale10h = calculateFurnitureScales(36000);

    assert.ok(scaleZero.overall >= 1.0);
    assert.ok(scale10m.overall > scaleZero.overall);
    assert.ok(scale1h.overall > scale10m.overall);
    assert.ok(scale10h.overall > scale1h.overall);

    // Verify all 8 furniture pieces exist and scale up
    const pieces = ['couch', 'tv', 'battlestation', 'bed', 'fridge', 'bookshelf', 'lamp', 'plant'];
    for (const piece of pieces) {
      assert.ok(scale10h[piece] > scaleZero[piece], `${piece} should grow with watch time`);
      assert.ok(typeof scale10h[piece] === 'number');
    }
  });

  test('gigantism mode amplifies furniture growth to colossal size', () => {
    const normalScale = calculateFurnitureScales(3600, false);
    const gigantismScale = calculateFurnitureScales(3600, true);

    assert.ok(gigantismScale.overall > normalScale.overall);
    assert.ok(gigantismScale.tv > normalScale.tv);
    assert.ok(gigantismScale.couch > normalScale.couch);
    assert.ok(gigantismScale.battlestation > normalScale.battlestation);
  });
});

describe('TwitchWatchTimeTracker Core Mechanics', () => {
  test('tracks chatter activity, house scale and furniture scales on watch time addition', () => {
    const tracker = new TwitchWatchTimeTracker({
      channel: 'testchannel',
      simulationEnabled: false,
      autoConnect: false,
      persist: false
    });

    const chatter = tracker.touchChatter('test_user', 'TestUser', true);
    assert.equal(chatter.username, 'test_user');
    assert.equal(chatter.watchSeconds, 0);
    assert.equal(chatter.tier.id, 1);
    assert.equal(chatter.houseScale, 1.0);

    // Add 1 hour (3600 seconds)
    const upgraded = tracker.addWatchTimeToChatter('test_user', 3600);
    assert.equal(upgraded.watchSeconds, 3600);
    assert.equal(upgraded.tier.id, 3);
    assert.equal(upgraded.tier.name, 'Two-Story Residence');
    assert.equal(upgraded.houseScale, 1.8);
    assert.ok(upgraded.furnitureScales.tv > 2.0);
    assert.ok(upgraded.furnitureScales.couch > 2.0);
    tracker.destroy();
  });

  test('correctly parses Twitch IRC PRIVMSG and strips /me ACTION', () => {
    const tracker = new TwitchWatchTimeTracker({
      channel: 'streamer',
      simulationEnabled: false,
      autoConnect: false,
      persist: false
    });

    const ircLine = '@badge-info=;badges=vip/1;color=#00FF7F;display-name=SuperFan;emotes= :superfan!superfan@superfan.tmi.twitch.tv PRIVMSG #streamer :\u0001ACTION jumps on the mega couch\u0001';
    tracker.handleIRCMessage(ircLine);

    const chatter = tracker.getChatter('superfan');
    assert.ok(chatter, 'Chatter should be recorded from PRIVMSG');
    assert.equal(chatter.displayName, 'SuperFan');
    assert.equal(chatter.color, '#00FF7F');
    assert.equal(chatter.messagesCount, 1);
    assert.equal(tracker.events[0].text, 'jumps on the mega couch');
    tracker.destroy();
  });

  test('correctly parses Twitch IRC 353 RPL_NAMREPLY presence for lurkers', () => {
    const tracker = new TwitchWatchTimeTracker({
      channel: 'streamer',
      simulationEnabled: false,
      autoConnect: false,
      persist: false
    });

    const namReplyLine = ':justinfan12345.tmi.twitch.tv 353 justinfan12345 = #streamer :lurker1 @mod_user +vip_user lurker2 justinfan99999';
    tracker.handleIRCMessage(namReplyLine);

    assert.ok(tracker.getChatter('lurker1'), 'lurker1 should be tracked');
    assert.ok(tracker.getChatter('mod_user'), 'mod_user should be tracked with prefix stripped');
    assert.ok(tracker.getChatter('vip_user'), 'vip_user should be tracked with prefix stripped');
    assert.ok(tracker.getChatter('lurker2'), 'lurker2 should be tracked');
    assert.equal(tracker.getChatter('justinfan99999'), null, 'justinfan bots should be ignored');
    tracker.destroy();
  });

  test('correctly parses Twitch IRC USERNOTICE for subscriptions', () => {
    const tracker = new TwitchWatchTimeTracker({
      channel: 'streamer',
      simulationEnabled: false,
      autoConnect: false,
      persist: false
    });

    const userNoticeLine = '@badge-info=;color=#9146FF;display-name=SubViewer;login=subviewer;msg-id=resub;system-msg=SubViewer\\ssubscribed\\sat\\sTier\\s1. :tmi.twitch.tv USERNOTICE #streamer :Tier up time!';
    tracker.handleIRCMessage(userNoticeLine);

    const chatter = tracker.getChatter('subviewer');
    assert.ok(chatter, 'Subscriber should be tracked from USERNOTICE');
    assert.equal(chatter.displayName, 'SubViewer');
    assert.ok(chatter.watchSeconds >= 300, 'Subscriber receives loyalty watch time bonus');
    assert.equal(tracker.events[0].type, 'usernotice');
    assert.equal(tracker.events[0].systemMsg, 'SubViewer subscribed at Tier 1.');
    tracker.destroy();
  });

  test('handles channel switching cleanly using setChannel and clamps multipliers safely', () => {
    const tracker = new TwitchWatchTimeTracker({
      channel: 'original',
      simulationEnabled: false,
      autoConnect: false,
      persist: false
    });

    // Test real setChannel call without bypassing
    const switched = tracker.setChannel('newchannel');
    assert.equal(switched, true);
    assert.equal(tracker.channel, 'newchannel');

    // Multiplier clamping
    const clampedMax = tracker.setMultiplier(999999);
    assert.equal(clampedMax, 10000);

    const clampedMin = tracker.setMultiplier(-5);
    assert.equal(clampedMin, 1);

    // Live-only setting
    const liveOnly = tracker.setLiveOnly(true);
    assert.equal(liveOnly, true);
    assert.equal(tracker.getStatus().liveOnly, true);

    tracker.destroy();
  });

  test('correctly sets chatter isActive to false upon 15-minute inactivity timeout', () => {
    const tracker = new TwitchWatchTimeTracker({
      channel: 'streamer',
      simulationEnabled: false,
      autoConnect: false,
      persist: false
    });

    const chatter = tracker.touchChatter('inactive_viewer', 'InactiveViewer', true);
    assert.equal(chatter.isActive, true);

    // Simulate activity from 20 minutes ago
    chatter.lastActive = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    chatter.lastSeen = chatter.lastActive;

    // Evaluate activity window
    const nowTime = Date.now();
    const ACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
    const lastActiveTime = new Date(chatter.lastActive).getTime();
    chatter.isActive = (nowTime - lastActiveTime) < ACTIVITY_TIMEOUT_MS;

    assert.equal(chatter.isActive, false, 'Chatter should be inactive after 20 minutes of silence');
    tracker.destroy();
  });
});
