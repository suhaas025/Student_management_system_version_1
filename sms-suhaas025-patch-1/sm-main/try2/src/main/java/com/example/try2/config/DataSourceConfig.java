package com.example.try2.config;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.util.Arrays;

/**
 * DataSource configuration that uses HikariCP connection pool.
 * This configuration is optimized for H2 database.
 */
@Configuration
public class DataSourceConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(DataSourceConfig.class);
    
    @Autowired
    private Environment env;

    /**
     * DataSource properties configuration from application properties
     */
    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties dataSourceProperties() {
        return new DataSourceProperties();
    }

    /**
     * Primary DataSource bean configuration
     */
    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource.hikari")
    public DataSource dataSource(DataSourceProperties properties) {
        logger.info("Initializing custom HikariCP DataSource for H2");
        
        // Display active profiles
        if (env.getActiveProfiles().length > 0) {
            logger.info("Active profiles: {}", Arrays.toString(env.getActiveProfiles()));
        } else {
            logger.info("No active profiles set, using default");
        }
        
        // Create HikariCP DataSource with configured properties
        HikariDataSource dataSource = properties.initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
        
        // Set some H2-specific properties
        String jdbcUrl = dataSource.getJdbcUrl();
        
        // Check if the connection is using file-based storage or in-memory
        boolean isFileBasedH2 = jdbcUrl != null && jdbcUrl.contains(":file:");
        boolean isInMemoryH2 = jdbcUrl != null && jdbcUrl.contains(":mem:");
        
        // Configure pool differently based on H2 mode
        if (isInMemoryH2) {
            // In-memory databases can be more aggressive with connection handling
            // as there's less overhead connecting to an in-memory database
            logger.info("Configuring pool for in-memory H2 database");
            
            // Ensure DB_CLOSE_DELAY=-1 is set to keep in-memory DB alive as long as VM is running
            if (!jdbcUrl.contains("DB_CLOSE_DELAY=-1")) {
                logger.warn("It's recommended to add DB_CLOSE_DELAY=-1 to your JDBC URL for in-memory H2 databases");
            }
        } else if (isFileBasedH2) {
            logger.info("Configuring pool for file-based H2 database");
            
            // For file-based H2, ensure these parameters are set
            if (!jdbcUrl.contains("DB_CLOSE_ON_EXIT=FALSE")) {
                logger.warn("It's recommended to add DB_CLOSE_ON_EXIT=FALSE to your JDBC URL for file-based H2 databases");
            }
        }
        
        // Log pool configuration details
        logger.info("Database URL: {}", dataSource.getJdbcUrl());
        logger.info("Connection pool configuration: minimum-idle={}, maximum-pool-size={}, connection-timeout={}ms",
                dataSource.getMinimumIdle(), 
                dataSource.getMaximumPoolSize(),
                dataSource.getConnectionTimeout());
        
        // Set Hikari pool name if not already set
        if (dataSource.getPoolName() == null) {
            String environment = env.getActiveProfiles().length > 0 ? 
                    env.getActiveProfiles()[0] : "default";
            dataSource.setPoolName(environment + "HikariPool");
            logger.info("Set pool name to: {}", dataSource.getPoolName());
        }
        
        return dataSource;
    }
} 