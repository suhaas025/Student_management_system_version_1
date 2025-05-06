package com.example.try2.config;

import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryUsage;
import java.text.NumberFormat;
import java.util.HashMap;
import java.util.Map;

/**
 * Connection pool monitor that periodically logs the status of the HikariCP connection pool
 * along with basic JVM memory usage metrics.
 * This implementation doesn't rely on Spring Boot Actuator.
 */
@Component
public class ConnectionPoolMonitor {

    private static final Logger logger = LoggerFactory.getLogger(ConnectionPoolMonitor.class);
    private static final NumberFormat FORMATTER = NumberFormat.getInstance();
    
    @Autowired
    private DataSource dataSource;

    /**
     * Logs connection pool metrics every 5 minutes
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    public void monitorConnectionPool() {
        try {
            // Log database connection pool stats
            logPoolMetrics();
            
            // Log JVM memory stats
            logMemoryMetrics();
        } catch (Exception e) {
            logger.error("Error in system monitoring", e);
        }
    }
    
    private void logPoolMetrics() {
        try {
            if (dataSource instanceof HikariDataSource) {
                HikariDataSource hikariDataSource = (HikariDataSource) dataSource;
                HikariPoolMXBean poolMXBean = hikariDataSource.getHikariPoolMXBean();
                
                if (poolMXBean != null) {
                    // Collect and log pool metrics
                    Map<String, Object> metrics = new HashMap<>();
                    metrics.put("active_connections", poolMXBean.getActiveConnections());
                    metrics.put("idle_connections", poolMXBean.getIdleConnections());
                    metrics.put("total_connections", poolMXBean.getTotalConnections());
                    metrics.put("threads_awaiting_connection", poolMXBean.getThreadsAwaitingConnection());
                    
                    metrics.put("pool_name", hikariDataSource.getPoolName());
                    metrics.put("max_pool_size", hikariDataSource.getMaximumPoolSize());
                    metrics.put("min_idle", hikariDataSource.getMinimumIdle());
                    
                    logger.info("Database connection pool metrics: {}", metrics);
                    
                    // Check pool health
                    if (poolMXBean.getThreadsAwaitingConnection() > 10) {
                        logger.warn("Connection pool health issue: Too many threads ({}) waiting for connection", 
                                poolMXBean.getThreadsAwaitingConnection());
                    }
                    
                    // Log if pool is getting close to capacity
                    int activeConnections = poolMXBean.getActiveConnections();
                    int maxConnections = hikariDataSource.getMaximumPoolSize();
                    if (activeConnections > (maxConnections * 0.8)) {
                        logger.warn("Connection pool near capacity: Using {} out of {} connections ({}%)", 
                                activeConnections,
                                maxConnections,
                                (activeConnections * 100 / maxConnections));
                    }
                }
            } else {
                logger.info("DataSource is not a HikariDataSource, actual type: {}", 
                        dataSource != null ? dataSource.getClass().getName() : "null");
            }
        } catch (Exception e) {
            logger.error("Error monitoring connection pool", e);
        }
    }
    
    private void logMemoryMetrics() {
        try {
            MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
            MemoryUsage heapMemory = memoryBean.getHeapMemoryUsage();
            MemoryUsage nonHeapMemory = memoryBean.getNonHeapMemoryUsage();
            
            // Format memory values into MB for easier reading
            Map<String, String> memoryMetrics = new HashMap<>();
            memoryMetrics.put("heap.used", formatMemory(heapMemory.getUsed()));
            memoryMetrics.put("heap.committed", formatMemory(heapMemory.getCommitted()));
            memoryMetrics.put("heap.max", formatMemory(heapMemory.getMax()));
            memoryMetrics.put("non-heap.used", formatMemory(nonHeapMemory.getUsed()));
            memoryMetrics.put("non-heap.committed", formatMemory(nonHeapMemory.getCommitted()));
            
            // Calculate heap usage percentage
            double heapUsagePercent = ((double) heapMemory.getUsed() / heapMemory.getMax()) * 100;
            memoryMetrics.put("heap.usage", String.format("%.2f%%", heapUsagePercent));
            
            logger.info("JVM memory metrics: {}", memoryMetrics);
            
            // Warn if heap usage is high
            if (heapUsagePercent > 80) {
                logger.warn("High heap memory usage: {}% of maximum heap size", 
                        String.format("%.2f", heapUsagePercent));
            }
        } catch (Exception e) {
            logger.error("Error monitoring JVM memory", e);
        }
    }
    
    private String formatMemory(long bytes) {
        return FORMATTER.format(bytes / (1024 * 1024)) + " MB";
    }
} 