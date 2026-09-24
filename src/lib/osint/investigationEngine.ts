/**
 * Investigation Engine - Multi-Agent Backend Orchestration
 * Version 2.0 - Internet Archaeologist Platform
 *
 * Coordinates deep passive OSINT reconnaissance, temporal web archaeology,
 * and defensive vulnerability assessment via the Central Multi-Agent Orchestrator.
 */

import { Investigation } from '@/types/osint';
import { AuthorizationGateRecord } from '@/types/agent';
import { orchestrator } from '@/lib/agents/centralOrchestrator';
import { validateAndSanitizeDomain } from './validator';
import { logger } from './logger';

/**
 * Creates and executes a comprehensive Version 2.0 Investigation.
 * Leverages the Central Multi-Agent Orchestrator to execute the worker DAG
 * and synthesize all intelligence into an immutable, cryptographically verifiable record.
 */
export async function createInvestigation(
  domainInput: string,
  authorization?: AuthorizationGateRecord
): Promise<Investigation> {
  const validation = validateAndSanitizeDomain(domainInput);
  if (!validation.isValid || !validation.sanitizedDomain) {
    logger.warn('investigationEngine', `Rejected invalid domain target: ${domainInput}`, {
      error: validation.error,
      riskFlags: validation.riskFlags,
    });
    throw new Error(validation.error || 'Invalid target domain format');
  }

  const domain = validation.sanitizedDomain;
  logger.info('investigationEngine', `Executing multi-agent investigation for ${domain}`, {
    scope: authorization?.scope || 'passive_only',
  });

  return orchestrator.execute({
    domain,
    authorization,
  });
}
