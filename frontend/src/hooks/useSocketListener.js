import { useEffect } from 'react';

const useSocketListener = (socket, user, eventName, callback, dependencies = []) => {
  useEffect(() => {
    if (user?.companyId && socket && typeof socket.on === 'function') {
      const fullEventName = `company-${user.companyId}-${eventName}`;
      
      console.log(`Registrando listener: ${fullEventName}`);
      socket.on(fullEventName, callback);

      return () => {
        if (socket && typeof socket.off === 'function') {
          console.log(`Removendo listener: ${fullEventName}`);
          socket.off(fullEventName, callback);
        }
      };
    }
  }, [socket, user?.companyId, ...dependencies]);
};

export default useSocketListener;