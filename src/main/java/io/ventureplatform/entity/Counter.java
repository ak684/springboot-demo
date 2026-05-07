package io.ventureplatform.entity;

import io.ventureplatform.entity.enums.CounterType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.Id;
import javax.persistence.PrePersist;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "counters")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@EntityListeners(AuditingEntityListener.class)
public class Counter {
  @Id
  @Column(nullable = false, updatable = false, length = 36)
  private String id; // UUID string (serves as API key)
  
  @Column(nullable = false)
  private String name;
  
  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  private CounterType type;
  
  @Column(nullable = false, precision = 19, scale = 2)
  private BigDecimal startValue;
  
  // Optional fields - usage depends on counter type
  @Column(nullable = true, precision = 19, scale = 2)
  private BigDecimal targetValue;
  
  @Column(nullable = true)
  private LocalDateTime targetDate;
  
  @Column(nullable = true)
  private Double ratePerSecond;
  
  // Formatting options
  @Column(nullable = false, columnDefinition = "BOOLEAN default FALSE")
  private Boolean showDecimals = false;
  
  @Column(nullable = true, length = 20)
  private String numberFormat; // "US" for 1,234.56 or "EU" for 1.234,56 or null for browser locale
  
  @Column(nullable = false, columnDefinition = "BOOLEAN default TRUE")
  private Boolean isActive = true;
  
  @Column(name = "portfolio_id")
  private Long portfolioId;
  
  @Temporal(TemporalType.TIMESTAMP)
  @CreatedDate
  @Column(nullable = false, updatable = false, name = "created_at")
  private Date createdAt;

  @Temporal(TemporalType.TIMESTAMP)
  @LastModifiedDate
  @Column(name = "last_modified_at")
  private Date lastModifiedAt;
  
  @PrePersist
  public void generateId() {
    if (this.id == null) {
      this.id = UUID.randomUUID().toString();
    }
  }
}
