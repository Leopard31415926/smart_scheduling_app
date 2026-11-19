import { CalendarEvent } from 'shared';
import { config } from '../config.js';
import { AssembledContext } from './context.service.js';
import { sampleCalendarEvents } from '../db/seed.js';

export interface AgentProcessResult {
  response: string;
  toolCalls?: any[];
  metadata?: any;
  proposedCourses?: CalendarEvent[];
}

export type AgentQueryResponse = AgentProcessResult;

export class AgentService {
  static async queryAgent(
    prompt: string,
    context: AssembledContext,
    sessionToken?: string
  ): Promise<AgentProcessResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

    const useMock =
      process.env.USE_MOCK_AGENT === 'true' ||
      process.env.AGENT_MODE === 'mock' ||
      process.env.NODE_ENV === 'test' ||
      Boolean(process.env.VITEST);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(useMock ? { 'X-Mock-Agent': 'true' } : {}),
      };
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const response = await fetch(`${config.DJANGO_AGENT_URL}/api/agent/process/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt,
          student: context.student,
          preferences: context.preferences,
          currentSchedule: context.currentSchedule,
          history: context.history,
          sessionToken,
          useMock,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(`Django agent returned status ${response.status}: ${errorBody}`);
      }

      const result: any = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Invalid response from agent service');
      }

      return {
        response: result.data.response,
        toolCalls: result.data.toolCalls || [],
        metadata: { model: result.data.model || 'slug-advisor' },
        proposedCourses: Array.isArray(result.data.proposedCourses)
          ? result.data.proposedCourses
          : [],
      };
    } catch (err: any) {
      clearTimeout(timeoutId);

      const isAbort = err.name === 'AbortError';
      const fallbackReason = isAbort ? 'Agent request timed out after 15 seconds' : err.message;

      // Graceful fallback response when Django service is unreachable or encounters an error
      const name = context.student.name || 'Slug';
      const standing = context.student.standing || 'Junior';
      const major = context.student.major || 'Computer Science';
      const credits = context.preferences.targetCredits || 15;

      const fallbackCourses: CalendarEvent[] = sampleCalendarEvents
        .filter((c) =>
          ['CSE 101', 'CSE 115A', 'PHIL 9'].some((code) => (c.code || c.title).includes(code))
        )
        .slice(0, 3);

      return {
        response:
          `Hey ${name}! 🐌 Based on your records as a **${standing}** in **\`${major}\`**, here is your recommended schedule for a **${credits}-credit** quarter.\n\n` +
          `### Recommended Courses:\n` +
          `- **\`CSE 115A\` (Software Engineering)** – Essential team project experience.\n` +
          `- **\`CSE 101\` (Algorithms & Data Structures)** – Core upper-division gateway.\n` +
          `- **\`PHIL 9\` (Logic)** – High-yield GE course satisfying foundational requirements.\n\n` +
          `*(Note: Live agent service at ${config.DJANGO_AGENT_URL} was unreachable: ${fallbackReason}. Displaying demo-ready recommended schedule.)*`,
        toolCalls: [],
        metadata: { fallback: true, error: fallbackReason },
        proposedCourses: fallbackCourses,
      };
    }
  }
}
