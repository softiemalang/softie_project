#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { packetContentSha256, INTERPRETATION_PACKET_SCHEMA } from '../src/astrology/interpretationPacket.js'

const path = process.argv[2] || 'artifacts/astrology-interpretation-packet-v1/complete.json'
const bytes = await readFile(path)
const evidence = JSON.parse(bytes)
const packet = evidence.packet
if (packet?.schemaVersion !== INTERPRETATION_PACKET_SCHEMA) throw new Error('packet schema mismatch')
if (packet.packetStatus !== 'complete' || packet.usable !== false) throw new Error('complete packet status or usable boundary invalid')
if (packet.activation.availableForInterpretation !== false || packet.activation.integrationStatus !== 'not_connected' || packet.activation.serviceEligibility !== 'blocked') throw new Error('activation boundary promoted')
if (packetContentSha256(packet) !== evidence.packetContentSha256) throw new Error('packet content hash mismatch')
if (!evidence.cases || Object.keys(evidence.cases).length < 9) throw new Error('negative evidence cases incomplete')
if (evidence.cases.complete.packetStatus !== 'complete' || Object.entries(evidence.cases).some(([name, item]) => name !== 'complete' && item.packetStatus !== 'blocked')) throw new Error('negative evidence not fail-closed')
const sourceRefs = new Set(['rawChart', 'ruleChart', 'goldenEvidence', 'activation', 'compatibility.legacyPrep', 'orchestration.input', 'orchestration.providerBundle', 'orchestration.runtime', 'orchestration.rawChart', 'orchestration.ruleChart', 'orchestration.adapter', 'orchestration.readiness', 'readiness.input', 'readiness.timeScale', 'readiness.ephemeris', 'readiness.runtime', 'readiness.documents', 'readiness.contamination'])
const claims = []
const walk = value => { if (!value || typeof value !== 'object') return; if (value.claimType && Array.isArray(value.sourceRefs)) claims.push(value); for (const child of Object.values(value)) walk(child) }
walk(packet)
if (!claims.length || claims.some(item => !item.sourceRefs.length || item.sourceRefs.some(ref => !sourceRefs.has(ref) && !ref.startsWith('rawChart.') && !ref.startsWith('ruleChart.')))) throw new Error('claim/sourceRefs resolution failure')
if (!packet.unsupportedFeatures.length || !packet.blockedFeatures.length) throw new Error('unsupported or blocked features missing')
console.log(JSON.stringify({ pass: true, claims: claims.length, artifactByteSha256: createHash('sha256').update(bytes).digest('hex'), packetContentSha256: evidence.packetContentSha256, activation: packet.activation }, null, 2))
