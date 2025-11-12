import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ModelRequest, ModelResponse } from '@echo/shared/types';
import { calculateCost, retry } from '@echo/shared/utils';
import { config } from '../config';

export class ModelAdapter {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private google: GoogleGenerativeAI;

  constructor(private apiKeys?: Partial<Record<string, string>>) {
    this.openai = new OpenAI({
      apiKey: apiKeys?.openai || config.openai.apiKey,
    });

    this.anthropic = new Anthropic({
      apiKey: apiKeys?.anthropic || config.anthropic.apiKey,
    });

    this.google = new GoogleGenerativeAI(
      apiKeys?.gemini || config.google.apiKey
    );
  }

  async chat(request: ModelRequest): Promise<ModelResponse> {
    const startTime = Date.now();

    try {
      const response = await retry(
        () => this.executeRequest(request),
        {
          retries: 3,
          delay: 1000,
          backoff: 2,
          onRetry: (error, attempt) => {
            console.log(`[ModelAdapter] Retry attempt ${attempt}:`, error.message);
          },
        }
      );

      const latency = Date.now() - startTime;
      const cost = calculateCost(
        request.provider,
        request.model,
        response.usage.promptTokens,
        response.usage.completionTokens
      );

      return {
        ...response,
        latency,
        cost,
      };
    } catch (error) {
      console.error('[ModelAdapter] Error:', error);
      throw new Error(`Model request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async executeRequest(request: ModelRequest): Promise<Omit<ModelResponse, 'latency' | 'cost'>> {
    switch (request.provider) {
      case 'openai':
        return this.chatOpenAI(request);
      case 'anthropic':
        return this.chatAnthropic(request);
      case 'gemini':
        return this.chatGemini(request);
      case 'grok':
        return this.chatGrok(request);
      default:
        throw new Error(`Unsupported provider: ${request.provider}`);
    }
  }

  private async chatOpenAI(request: ModelRequest): Promise<Omit<ModelResponse, 'latency' | 'cost'>> {
    const response = await this.openai.chat.completions.create({
      model: request.model,
      messages: request.messages.map((m) => ({
        role: m.role === 'user' ? 'user' : m.role === 'assistant' ? 'assistant' : 'system',
        content: m.content,
      })),
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens,
      stream: false,
    });

    const choice = response.choices[0];
    if (!choice || !choice.message.content) {
      throw new Error('No response from OpenAI');
    }

    return {
      content: choice.message.content,
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      cost: 0,
      latency: 0,
    };
  }

  private async chatAnthropic(request: ModelRequest): Promise<Omit<ModelResponse, 'latency' | 'cost'>> {
    const systemMessage = request.messages.find((m) => m.role === 'system');
    const userMessages = request.messages.filter((m) => m.role !== 'system');

    const response = await this.anthropic.messages.create({
      model: request.model,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0.7,
      system: systemMessage?.content,
      messages: userMessages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Anthropic');
    }

    return {
      content: textContent.text,
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      cost: 0,
      latency: 0,
    };
  }

  private async chatGemini(request: ModelRequest): Promise<Omit<ModelResponse, 'latency' | 'cost'>> {
    const model = this.google.getGenerativeModel({ model: request.model });

    const chat = model.startChat({
      history: request.messages.slice(0, -1).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature: request.temperature || 0.7,
        maxOutputTokens: request.maxTokens,
      },
    });

    const lastMessage = request.messages[request.messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;
    const text = response.text();

    return {
      content: text,
      model: request.model,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      cost: 0,
      latency: 0,
    };
  }

  private async chatGrok(request: ModelRequest): Promise<Omit<ModelResponse, 'latency' | 'cost'>> {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKeys?.grok || config.grok.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.statusText}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      content: choice.message.content,
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      cost: 0,
      latency: 0,
    };
  }
}

export async function getTenantAPIKeys(tenantId: string): Promise<Partial<Record<string, string>>> {
  return {};
}
