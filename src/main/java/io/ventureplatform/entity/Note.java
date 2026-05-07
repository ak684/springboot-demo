package io.ventureplatform.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OrderBy;
import javax.persistence.Table;
import javax.persistence.Transient;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "notes")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Note extends BaseEntity {
  private String screen;
  @Column(columnDefinition = "VARCHAR(1000)")
  private String comment;
  @OneToMany(mappedBy = "note")
  @Fetch(FetchMode.SUBSELECT)
  @OrderBy("id")
  private List<NoteLink> links = new ArrayList<>();
  @OneToMany(mappedBy = "note")
  @Fetch(FetchMode.SUBSELECT)
  @OrderBy("id")
  private List<NoteFile> files = new ArrayList<>();
  @ManyToOne
  @JoinColumn(name = "impact_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Impact impact;
  @ManyToOne
  @JoinColumn(name = "indicator_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private ImpactIndicator indicator;
  private Boolean same;
  @Transient
  private List<NoteFile> newFiles = new ArrayList<>();
}
