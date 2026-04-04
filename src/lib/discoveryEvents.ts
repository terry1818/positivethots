type Listener = () => void;
const listeners = new Set<Listener>();

export const onDiscoveryRefresh = (fn: Listener) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};

export const triggerDiscoveryRefresh = () => {
  listeners.forEach(fn => fn());
};
