'use client';

import { useState } from 'react';
import { cookieStore } from '@/utils/cookieStore';

export interface BatchSubmitOptions<T> {
  /** Convert a single record to the API payload shape */
  createPayloadItem: (record: T) => Record<string, unknown>;
  /** API endpoint to POST batches to */
  endpoint: string;
  /** Number of records per batch (default: 100) */
  batchSize?: number;
  /** Called when a single item fails — returns a human-readable label */
  itemLabel?: (item: T) => string;
}

export interface BatchSubmitResult {
  successCount: number;
  failMessages: string[];
  successList: string[];
}

/**
 * Reusable batch-submit hook.
 * Handles batching, per-item retry on batch failure, and progress reporting.
 * Eliminates the identical submit logic copy-pasted across upload pages.
 */
export function useBatchSubmit<T>() {
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState('');

  const submit = async (data: T[], options: BatchSubmitOptions<T>): Promise<BatchSubmitResult> => {
    const { createPayloadItem, endpoint, batchSize = 100, itemLabel } = options;
    const totalRecords = data.length;
    let successCount = 0;
    const failMessages: string[] = [];
    const successList: string[] = [];

    setSubmitting(true);
    setSubmitProgress('Preparing data...');

    try {
      for (let i = 0; i < totalRecords; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const currentBatchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(totalRecords / batchSize);

        setSubmitProgress(
          `Submitting batch ${currentBatchNum}/${totalBatches} (${Math.min(i + batchSize, totalRecords)}/${totalRecords})...`
        );

        const batchSucceeded = await submitBatch(batch, createPayloadItem, endpoint);

        if (batchSucceeded.ok) {
          successCount += batch.length;
          if (batchSucceeded.data) successList.push(...batchSucceeded.data);
        } else {
          // Retry item-by-item
          setSubmitProgress(`Batch ${currentBatchNum} failed. Retrying individually...`);

          for (let j = 0; j < batch.length; j++) {
            const item = batch[j];
            setSubmitProgress(
              `Retrying batch ${currentBatchNum} (Item ${j + 1}/${batch.length})...`
            );

            const singleResult = await submitBatch([item], createPayloadItem, endpoint);
            if (singleResult.ok) {
              successCount++;
              if (singleResult.data) successList.push(...singleResult.data);
            } else {
              const label = itemLabel ? itemLabel(item) : `Item ${i + j + 1}`;
              failMessages.push(`${label}: ${singleResult.message}`);
            }
          }
        }
      }
    } finally {
      setSubmitting(false);
      setSubmitProgress('');
    }

    return { successCount, failMessages, successList };
  };

  return { submit, submitting, submitProgress };
}

// ─── Internal helper ──────────────────────────────────────────────────────────

async function submitBatch<T>(
  batch: T[],
  createPayloadItem: (record: T) => Record<string, unknown>,
  endpoint: string
): Promise<{ ok: boolean; data?: string[]; message?: string }> {
  try {
    // ⚡ Bolt Optimization: Use centralized and optimized CSRF token retrieval.
    const csrfToken = cookieStore.getCsrfToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ data: batch.map(createPayloadItem) }),
    });

    const result = await response.json();

    if (result.success) {
      return { ok: true, data: Array.isArray(result.data) ? result.data : [] };
    }
    return { ok: false, message: result.message || 'Batch failed' };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Unknown error' };
  }
}
