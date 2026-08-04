import { useEffect, useState } from 'react';
import { pb } from './pb.js';

/**
 * Current signed-in user, kept in sync with the PocketBase auth store.
 *
 * `company` is expanded because almost every screen needs the company record
 * for VAT defaults, bank details and the document header.
 */
export function useAuth() {
  const [user, setUser] = useState(pb.authStore.record ?? null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      if (pb.authStore.isValid) {
        try {
          // Re-validate the stored token and pull the company relation.
          const result = await pb.collection('users').authRefresh({ expand: 'company' });
          if (!cancelled) setUser(result.record);
        } catch {
          pb.authStore.clear();
          if (!cancelled) setUser(null);
        }
      }
      if (!cancelled) setReady(true);
    }

    refresh();

    const unsubscribe = pb.authStore.onChange((_token, record) => {
      if (!cancelled) setUser(record ?? null);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { user, ready, company: user?.expand?.company ?? null };
}

export async function login(email, password) {
  return pb.collection('users').authWithPassword(email, password, { expand: 'company' });
}

export function logout() {
  pb.authStore.clear();
}

export function isAuthenticated() {
  return pb.authStore.isValid;
}

/** Company id of the signed-in user — the tenant key for every query. */
export function currentCompanyId() {
  return pb.authStore.record?.company ?? null;
}

export function currentUserId() {
  return pb.authStore.record?.id ?? null;
}

export function hasRole(...roles) {
  const role = pb.authStore.record?.role;
  return roles.includes(role);
}
