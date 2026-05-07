package io.ventureplatform.entity;

import io.ventureplatform.entity.enums.EvidenceType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

@Entity
@Table(name = "note_files")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class NoteFile extends BaseEntity {
  @Column(columnDefinition = "VARCHAR(500)")
  private String name;
  private String key;
  private Long size;
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
