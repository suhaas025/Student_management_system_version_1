package com.example.try2.controller;

import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/connection-pool-demo")
public class ConnectionPoolDemoController {
    private static final Logger logger = LoggerFactory.getLogger(ConnectionPoolDemoController.class);
    
    @Autowired
    private DataSource dataSource;

    private final Map<String, ConnectionHolder> holders = new ConcurrentHashMap<>();
    private final ExecutorService executor = Executors.newCachedThreadPool();

    private HikariDataSource hikariDataSource;
    private int maxPoolSize = 5; // Default, will be updated from actual config
    
    // Statistics
    private final AtomicInteger totalConnectionsCreated = new AtomicInteger(0);
    private final AtomicInteger totalConnectionsAcquired = new AtomicInteger(0);
    private final AtomicInteger maxConcurrentConnections = new AtomicInteger(0);
    private final AtomicInteger maxWaitingThreads = new AtomicInteger(0);
    private long maxWaitTime = 0;
    private long totalWaitTime = 0;
    private final Object statsLock = new Object();
    private final List<String> poolEvents = Collections.synchronizedList(new ArrayList<>());

    @PostConstruct
    public void init() {
        if (dataSource instanceof HikariDataSource) {
            hikariDataSource = (HikariDataSource) dataSource;
            maxPoolSize = hikariDataSource.getMaximumPoolSize();
            logger.info("Connection pool demo initialized with maximum pool size: {}", maxPoolSize);
            logger.info("HikariCP configuration: minimum-idle={}, connection-timeout={}ms, idle-timeout={}ms, max-lifetime={}ms",
                    hikariDataSource.getMinimumIdle(),
                    hikariDataSource.getConnectionTimeout(),
                    hikariDataSource.getIdleTimeout(),
                    hikariDataSource.getMaxLifetime());
            
            poolEvents.add(String.format("%s - Pool initialized with max size %d", 
                    new Date(), maxPoolSize));
        } else {
            logger.warn("DataSource is not HikariDataSource, some features may not work properly");
        }
    }
    
    /**
     * Log pool statistics every 5 seconds when there's activity
     */
    @Scheduled(fixedRate = 5000)
    public void logPoolStats() {
        if (hikariDataSource != null && holders.size() > 0) {
            HikariPoolMXBean poolMXBean = hikariDataSource.getHikariPoolMXBean();
            int active = poolMXBean.getActiveConnections();
            int idle = poolMXBean.getIdleConnections();
            int waiting = poolMXBean.getThreadsAwaitingConnection();
            int total = poolMXBean.getTotalConnections();
            
            logger.info("⏱️ POOL STATS: active={}, idle={}, waiting={}, total={}, max={}",
                active, idle, waiting, total, maxPoolSize);
            
            if (waiting > 0) {
                logger.warn("⚠️ THREADS WAITING: {} threads are waiting for a connection", waiting);
                String event = String.format("%s - ⚠️ %d threads waiting for connection", 
                        new Date(), waiting);
                poolEvents.add(event);
            }
            
            // Log our custom statistics
            logger.info("📊 CONNECTION METRICS: totalCreated={}, totalAcquired={}, maxConcurrent={}, maxWaiting={}, maxWaitTime={}ms, avgWaitTime={}ms",
                totalConnectionsCreated.get(),
                totalConnectionsAcquired.get(),
                maxConcurrentConnections.get(),
                maxWaitingThreads.get(),
                maxWaitTime,
                totalConnectionsAcquired.get() > 0 ? totalWaitTime / totalConnectionsAcquired.get() : 0);
            
            // Print visual representation of the pool
            StringBuilder poolVisualization = new StringBuilder("🔌 POOL VISUALIZATION: ");
            for (int i = 0; i < total; i++) {
                if (i < active) {
                    poolVisualization.append("■"); // Active connection
                } else {
                    poolVisualization.append("□"); // Idle connection
                }
            }
            // Add waiting threads
            for (int i = 0; i < waiting; i++) {
                poolVisualization.append("▢"); // Waiting thread
            }
            logger.info(poolVisualization.toString());
        }
    }

    @PostMapping("/acquire")
    public Map<String, Object> acquire(@RequestParam(defaultValue = "20000") long holdTimeMs) {
        String id = UUID.randomUUID().toString();
        logger.info("Requesting new connection: {} with hold time: {}ms", id, holdTimeMs);
        
        int activeConnections = 0;
        int waitingThreads = 0;
        if (hikariDataSource != null) {
            HikariPoolMXBean poolMXBean = hikariDataSource.getHikariPoolMXBean();
            activeConnections = poolMXBean.getActiveConnections();
            waitingThreads = poolMXBean.getThreadsAwaitingConnection();
            
            // Update statistics
            if (waitingThreads > maxWaitingThreads.get()) {
                maxWaitingThreads.set(waitingThreads);
            }
            
            logger.info("Current pool status before acquisition: active={}, waiting={}, max={}", 
                    activeConnections, waitingThreads, maxPoolSize);
                    
            if (activeConnections >= maxPoolSize) {
                logger.warn("⚠️ Pool at maximum capacity! Connection will wait for availability.");
                poolEvents.add(String.format("%s - ⚠️ Pool at maximum capacity for request %s! Will wait...", 
                        new Date(), id.substring(0, 8)));
            }
        }
        
        ConnectionHolder holder = new ConnectionHolder(id, holdTimeMs);
        holders.put(id, holder);
        executor.submit(() -> holder.run());
        
        return Map.of(
                "id", id,
                "status", holder.getStatus(),
                "startTime", holder.getStartTime(),
                "activeConnections", activeConnections,
                "waitingThreads", waitingThreads
        );
    }

    @GetMapping("/active")
    public List<Map<String, Object>> active() {
        List<Map<String, Object>> list = new ArrayList<>();
        for (ConnectionHolder h : holders.values()) {
            list.add(h.toMap());
        }
        return list;
    }

    @PostMapping("/release/{id}")
    public Map<String, Object> release(@PathVariable String id) {
        ConnectionHolder holder = holders.get(id);
        if (holder != null) {
            logger.info("Manually releasing connection: {}, current status: {}", id, holder.getStatus());
            poolEvents.add(String.format("%s - 🔓 Manual release of connection %s", 
                    new Date(), id.substring(0, 8)));
            holder.releaseEarly();
            return Map.of("status", "released");
        }
        return Map.of("status", "not_found");
    }

    @PostMapping("/release-all")
    public Map<String, Object> releaseAll() {
        int count = 0;
        logger.info("🧹 Releasing all connections...");
        poolEvents.add(String.format("%s - 🧹 Releasing all connections", new Date()));
        for (ConnectionHolder holder : holders.values()) {
            if (!"released".equals(holder.getStatus())) {
                holder.releaseEarly();
                count++;
            }
        }
        logger.info("Released all connections: {} active connections released", count);
        return Map.of("released", count);
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        if (hikariDataSource == null) return Map.of("error", "Not HikariCP");
        
        HikariPoolMXBean poolMXBean = hikariDataSource.getHikariPoolMXBean();
        int active = poolMXBean.getActiveConnections();
        int idle = poolMXBean.getIdleConnections();
        int total = poolMXBean.getTotalConnections();
        int threadsWaiting = poolMXBean.getThreadsAwaitingConnection();
        
        Map<String, Object> result = new HashMap<>();
        result.put("active", active);
        result.put("idle", idle);
        result.put("total", total);
        result.put("threads_waiting", threadsWaiting);
        result.put("max_pool_size", maxPoolSize);
        
        // Add additional metrics
        result.put("connections_created", totalConnectionsCreated.get());
        result.put("connections_acquired", totalConnectionsAcquired.get());
        result.put("max_concurrent", maxConcurrentConnections.get());
        result.put("max_waiting", maxWaitingThreads.get());
        result.put("max_wait_time_ms", maxWaitTime);
        result.put("avg_wait_time_ms", totalConnectionsAcquired.get() > 0 ? totalWaitTime / totalConnectionsAcquired.get() : 0);
        
        return result;
    }

    @GetMapping("/events")
    public List<String> getPoolEvents() {
        // Return the last 50 events or fewer if there are fewer events
        int startIndex = Math.max(0, poolEvents.size() - 50);
        return new ArrayList<>(poolEvents.subList(startIndex, poolEvents.size()));
    }

    @GetMapping("/connection-info")
    public Map<String, Object> getConnectionInfo() {
        Map<String, Object> info = new HashMap<>();
        Connection conn = null;
        try {
            // Get a connection from the pool
            long startTime = System.currentTimeMillis();
            conn = dataSource.getConnection();
            long endTime = System.currentTimeMillis();
            info.put("acquisition_time_ms", endTime - startTime);
            
            // Get database metadata
            DatabaseMetaData metaData = conn.getMetaData();
            info.put("database_product_name", metaData.getDatabaseProductName());
            info.put("database_product_version", metaData.getDatabaseProductVersion());
            info.put("driver_name", metaData.getDriverName());
            info.put("driver_version", metaData.getDriverVersion());
            info.put("connection_class", conn.getClass().getName());
            
            // Check if autocommit is on
            info.put("auto_commit", conn.getAutoCommit());
            
            // Add any proxy information if available
            if (conn.getClass().getName().contains("Proxy")) {
                info.put("is_proxy", true);
            }
            
            logger.info("Retrieved connection info: {}", info);
        } catch (SQLException e) {
            logger.error("Error getting connection info", e);
            info.put("error", e.getMessage());
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                    logger.info("Connection returned to pool after inspection");
                } catch (SQLException e) {
                    logger.error("Error closing connection", e);
                }
            }
        }
        return info;
    }

    class ConnectionHolder {
        private final String id;
        private final long holdTimeMs;
        private volatile String status = "waiting";
        private volatile long startTime = System.currentTimeMillis();
        private volatile long acquiredTime = 0;
        private volatile long releasedTime = 0;
        private volatile Connection connection;
        private final CountDownLatch latch = new CountDownLatch(1);
        private String connectionDetails = "unknown";

        ConnectionHolder(String id, long holdTimeMs) {
            this.id = id;
            this.holdTimeMs = holdTimeMs;
        }

        public void run() {
            try {
                status = "waiting";
                logger.info("🔄 Connection {} waiting to be acquired from pool", id);
                poolEvents.add(String.format("%s - 🔄 Request %s waiting for connection", 
                        new Date(), id.substring(0, 8)));
                
                // Get current thread to identify waiting state
                Thread currentThread = Thread.currentThread();
                String threadName = currentThread.getName();
                
                // Log thread state before acquisition
                logger.debug("Thread {} state before acquisition: {}", 
                        threadName, currentThread.getState());
                
                // Attempt to get connection
                long waitStartTime = System.currentTimeMillis();
                connection = dataSource.getConnection();
                totalConnectionsCreated.incrementAndGet();
                
                // Extract connection details
                try {
                    DatabaseMetaData metaData = connection.getMetaData();
                    connectionDetails = String.format("DB: %s, Driver: %s, Class: %s", 
                            metaData.getDatabaseProductName(),
                            metaData.getDriverName(),
                            connection.getClass().getName());
                    logger.debug("Connection details: {}", connectionDetails);
                } catch (SQLException e) {
                    connectionDetails = "Could not retrieve details: " + e.getMessage();
                }
                
                acquiredTime = System.currentTimeMillis();
                long waitTime = acquiredTime - startTime;
                totalConnectionsAcquired.incrementAndGet();
                
                // Update statistics
                synchronized (statsLock) {
                    totalWaitTime += waitTime;
                    if (waitTime > maxWaitTime) {
                        maxWaitTime = waitTime;
                    }
                    
                    int activeCount = 0;
                    if (hikariDataSource != null) {
                        activeCount = hikariDataSource.getHikariPoolMXBean().getActiveConnections();
                        if (activeCount > maxConcurrentConnections.get()) {
                            maxConcurrentConnections.set(activeCount);
                        }
                    }
                }
                
                // Log with appropriate emoji based on wait time
                String waitEmoji = waitTime < 10 ? "⚡" : (waitTime < 100 ? "⏱️" : "🕒");
                logger.info("{} Connection {} acquired after {}ms", waitEmoji, id, waitTime);
                
                // Add event to pool events with appropriate emoji
                if (waitTime < 10) {
                    poolEvents.add(String.format("%s - ⚡ Request %s acquired connection instantly", 
                            new Date(), id.substring(0, 8)));
                } else if (waitTime < 100) {
                    poolEvents.add(String.format("%s - ⏱️ Request %s acquired after short wait (%dms)", 
                            new Date(), id.substring(0, 8), waitTime));
                } else {
                    poolEvents.add(String.format("%s - 🕒 Request %s acquired after LONG wait (%dms)", 
                            new Date(), id.substring(0, 8), waitTime));
                }
                
                status = "holding";
                
                // Wait for hold time or early release
                boolean released = latch.await(holdTimeMs, TimeUnit.MILLISECONDS);
                if (released) {
                    logger.info("👋 Connection {} was manually released early", id);
                } else {
                    logger.info("⏲️ Connection {} released after normal hold time of {}ms", id, holdTimeMs);
                    poolEvents.add(String.format("%s - ⏲️ Request %s released after normal hold time", 
                            new Date(), id.substring(0, 8)));
                }
            } catch (Exception e) {
                logger.error("❌ Error in connection {}: {}", id, e.getMessage(), e);
                poolEvents.add(String.format("%s - ❌ Error for request %s: %s", 
                        new Date(), id.substring(0, 8), e.getMessage()));
                status = "error: " + e.getMessage();
            } finally {
                try {
                    if (connection != null && !connection.isClosed()) {
                        connection.close();
                        logger.info("✅ Connection {} closed and returned to pool", id);
                    }
                } catch (Exception e) {
                    logger.error("Error closing connection {}: {}", id, e.getMessage(), e);
                }
                releasedTime = System.currentTimeMillis();
                status = "released";
                holders.remove(id);
            }
        }

        public void releaseEarly() {
            latch.countDown();
        }

        public String getStatus() { return status; }
        public long getStartTime() { return startTime; }
        public Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("id", id);
            map.put("status", status);
            map.put("startTime", startTime);
            map.put("acquiredTime", acquiredTime);
            map.put("releasedTime", releasedTime);
            map.put("holdTimeMs", holdTimeMs);
            map.put("connectionDetails", connectionDetails);
            if (acquiredTime > 0 && startTime > 0) {
                map.put("waitTimeMs", acquiredTime - startTime);
            } else {
                map.put("waitTimeMs", 0);
            }
            return map;
        }
    }
} 