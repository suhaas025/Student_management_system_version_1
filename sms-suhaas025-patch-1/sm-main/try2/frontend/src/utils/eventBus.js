// Simple event bus for application-wide events
const eventBus = {
  // Event listeners storage
  listeners: {},

  // Subscribe to an event
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners[event] = this.listeners[event].filter(
        listener => listener !== callback
      );
    };
  },

  // Emit an event with data
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        callback(data);
      });
    }
  },
  
  // Remove all listeners for an event
  off(event) {
    delete this.listeners[event];
  }
};

export default eventBus; 