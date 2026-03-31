"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";

const SESSION_ID_STORAGE_KEY = "devroast_session_id_storage";

// Initialize sessionId OUTSIDE component - runs on import, guaranteed before render
let cachedSessionId: string | null = null;

function initializeSessionId(): string {
  if (!cachedSessionId) {
    if (typeof window !== "undefined") {
      try {
        cachedSessionId = localStorage.getItem(SESSION_ID_STORAGE_KEY);
        if (!cachedSessionId) {
          cachedSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem(SESSION_ID_STORAGE_KEY, cachedSessionId);
        }
      } catch (e) {
        // Fallback if localStorage fails
        cachedSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
    }
  }
  return cachedSessionId || "";
}

export function useUserTracking() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestCount, setRequestCount] = useState(0);

  const trpc = useTRPC();
  const trackRequest = useMutation(trpc.roast.trackRequest.mutationOptions());
  const decrementRequest = useMutation(trpc.roast.decrementRequestCount.mutationOptions());

  const trackRoastRequest = async () => {
    const sessionId = initializeSessionId();
    
    if (!sessionId) return { shouldShowForm: false, requestCount: 0 };

    try {
      const result = await trackRequest.mutateAsync({ sessionId });
      setRequestCount(result.requestCount);

      if (result.shouldShowForm) {
        setIsModalOpen(true);
      }

      return result;
    } catch (error) {
      console.error("trackRoastRequest error:", error);
      return { shouldShowForm: false, requestCount: 0 };
    }
  };

  const handleCancelModal = async () => {
    const sessionId = initializeSessionId();
    if (!sessionId) return;

    try {
      const result = await decrementRequest.mutateAsync({ sessionId });
      setRequestCount(result.requestCount);
      setIsModalOpen(false);
    } catch (error) {
      console.error("handleCancelModal error:", error);
      setIsModalOpen(false);
    }
  };

  return {
    // IMPORTANT: sessionId should ONLY be used for logic/API calls, NOT rendered in JSX
    // This avoids hydration mismatches where server renders empty string but client renders a value
    sessionId: initializeSessionId(),
    requestCount,
    isModalOpen,
    setIsModalOpen,
    trackRoastRequest,
    handleCancelModal,
  };
}
