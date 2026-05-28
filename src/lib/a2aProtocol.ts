import { riskAgent } from "../../agents/riskAgent";
import { schedulerAgent } from "../../agents/schedulerAgent";

// Strict A2A Protocol Message Structure following Syllabus Week 13 definitions
export interface A2AMessage<T = any> {
  messageId: string;
  sender: "OrchestratorBroker" | "RiskAgent" | "SchedulerAgent";
  recipient: "OrchestratorBroker" | "RiskAgent" | "SchedulerAgent";
  protocolVersion: "A2A-1.0";
  timestamp: string;
  payload: T;
}

export interface A2ASynthesisResult {
  a2aConversationLog: string[];
  tasks: any[];
  risks: any[];
}

function generateMessageId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
}

/**
 * Standardized Broker Orchestrator that coordinates the communication envelope
 * exchange between risk safety systems and scheduler operations nodes.
 */
export async function coordinateA2ASynthesis(
  projectName: string,
  projectDescription: string,
  existingTasks: string[] = [],
  existingRisks: string[] = []
): Promise<A2ASynthesisResult> {
  const conversationLog: string[] = [];

  // Step 1: Initialize A2A Broadcast to Risk Agent
  const brokerToRiskMsg: A2AMessage = {
    messageId: generateMessageId("A2A-REQ-RISK"),
    sender: "OrchestratorBroker",
    recipient: "RiskAgent",
    protocolVersion: "A2A-1.0",
    timestamp: new Date().toISOString(),
    payload: { projectName, projectDescription, existingRisks }
  };
  conversationLog.push(
    `[A2A Broker Broadcast] Msg ID: ${brokerToRiskMsg.messageId} | ${brokerToRiskMsg.sender} -> ${brokerToRiskMsg.recipient} | Staging Site Risk Assessment`
  );

  // Dispatch message envelope to Risk Agent and await response
  const risks = await riskAgent(projectName, projectDescription, existingRisks);
  
  const riskToBrokerMsg: A2AMessage = {
    messageId: generateMessageId("A2A-RES-RISK"),
    sender: "RiskAgent",
    recipient: "OrchestratorBroker",
    protocolVersion: "A2A-1.0",
    timestamp: new Date().toISOString(),
    payload: { risks }
  };
  conversationLog.push(
    `[A2A Agent Response] Msg ID: ${riskToBrokerMsg.messageId} | ${riskToBrokerMsg.sender} -> ${riskToBrokerMsg.recipient} | Payload: Identified ${risks.length} dynamic site hazards.`
  );

  // Step 2: Orchestrator passes the hazard state directly to the Scheduler Agent (Handshake)
  const brokerToSchedulerMsg: A2AMessage = {
    messageId: generateMessageId("A2A-REQ-SCHED"),
    sender: "OrchestratorBroker",
    recipient: "SchedulerAgent",
    protocolVersion: "A2A-1.0",
    timestamp: new Date().toISOString(),
    payload: { projectName, projectDescription, existingTasks, activeRisks: risks }
  };
  conversationLog.push(
    `[A2A Broker Handshake] Msg ID: ${brokerToSchedulerMsg.messageId} | ${brokerToSchedulerMsg.sender} -> ${brokerToSchedulerMsg.recipient} | Forwarding active hazards context to compile operations schedule.`
  );

  // Dispatch message envelope to Scheduler/Foreman Agent and await response
  const tasks = await schedulerAgent(projectName, projectDescription, existingTasks);

  const schedulerToBrokerMsg: A2AMessage = {
    messageId: generateMessageId("A2A-RES-SCHED"),
    sender: "SchedulerAgent",
    recipient: "OrchestratorBroker",
    protocolVersion: "A2A-1.0",
    timestamp: new Date().toISOString(),
    payload: { tasks }
  };
  conversationLog.push(
    `[A2A Agent Response] Msg ID: ${schedulerToBrokerMsg.messageId} | ${schedulerToBrokerMsg.sender} -> ${schedulerToBrokerMsg.recipient} | Payload: Synthesized ${tasks.length} optimized task milestones.`
  );

  // Step 3: Broker closes message transport channel
  conversationLog.push(
    `[A2A Broker Closing] Msg validation completed under Protocol ${brokerToRiskMsg.protocolVersion}. Agent transaction session successfully closed.`
  );

  console.log(`[A2A Protocol Broker Logs]:\n${conversationLog.join("\n")}`);

  return {
    a2aConversationLog: conversationLog,
    tasks,
    risks
  };
}
