package io.ventureplatform.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;

@Entity
@Table(name = "ai_toc_feedbacks")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class AiTocFeedback extends BaseEntity {
  private Integer rating;
  @Column(columnDefinition = "TEXT")
  private String comment;
  private boolean contact;
  private String name;
  private String email;
}
