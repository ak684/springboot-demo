package io.ventureplatform.entity;

import io.ventureplatform.entity.enums.EvidenceType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

@Entity
@Table(name = "note_links")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class NoteLink extends BaseEntity {
  private String text;
  @Column(columnDefinition = "VARCHAR(500)")
  private String link;
  @Enumerated(EnumType.STRING)
  private EvidenceType evidenceType;
  @Column(columnDefinition = "VARCHAR(1000)")
  private String comment;
  private Integer risk;
  @ManyToOne
  @JoinColumn(name = "note_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Note note;
}
