package io.ventureplatform.entity;

import io.ventureplatform.entity.enums.Geography;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;
import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import org.hibernate.annotations.Where;

import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OrderBy;
import javax.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "impacts")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class Impact extends BaseEntity {
  @ManyToOne
  @JoinColumn(name = "venture_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Venture venture;

  @OneToMany(mappedBy = "impact")
  @Fetch(FetchMode.SUBSELECT)
  @OrderBy("id")
  @Cascade(CascadeType.ALL)
  private List<ImpactIndicator> indicators = new ArrayList<>();

  private String name;
  private String statusQuo;
  private String innovation;
  private String stakeholders;
  private String change;
  private String outputUnits;
  @ElementCollection
  @Enumerated(EnumType.STRING)
  private List<Geography> geography = new ArrayList<>();
  @ElementCollection
  private List<String> geographyCustom = new ArrayList<>();

  @Column(name = "sort_order")
  private Integer sortOrder;

  @Column(columnDefinition = "BOOLEAN default TRUE")
  private Boolean positive = true;

  @OneToMany(mappedBy = "impact")
  @Fetch(FetchMode.SUBSELECT)
  @OrderBy("id")
  @Cascade(CascadeType.ALL)
  private List<ImpactGoal> goals = new ArrayList<>();

  @OneToMany(mappedBy = "impact")
  @Fetch(FetchMode.SUBSELECT)
  @OrderBy("id")
  @Cascade(CascadeType.ALL)
  private List<ImpactScore> scoring = new ArrayList<>();

  @Column(columnDefinition = "BOOLEAN default FALSE")
  private Boolean draft = false;

  @OneToMany(mappedBy = "impact")
  @Fetch(FetchMode.SUBSELECT)
  @OrderBy("year")
  @Where(clause = "type = 'PRODUCTS'")
  private List<QuantificationData> productsData = new ArrayList<>();
  @OneToMany(mappedBy = "impact")
  @Fetch(FetchMode.SUBSELECT)
  @OrderBy("year")
  @Where(clause = "type = 'PRODUCTS_ACTUAL'")
  private List<QuantificationData> productsDataActual = new ArrayList<>();
  @OneToMany(mappedBy = "impact")
  @Fetch(FetchMode.SUBSELECT)
  @OrderBy("year")
  @Where(clause = "type = 'STAKEHOLDERS'")
  private List<QuantificationData> stakeholdersData = new ArrayList<>();
  @OneToMany(mappedBy = "impact")
  @Fetch(FetchMode.SUBSELECT)
  @OrderBy("year")
  @Where(clause = "type = 'STAKEHOLDERS_ACTUAL'")
  private List<QuantificationData> stakeholdersDataActual = new ArrayList<>();
  private String image;
  @Column(columnDefinition = "TEXT")
  private String pitchDescription;
  @Column(columnDefinition = "TEXT")
  private String pitchInspiration;
  @Column(columnDefinition = "BOOLEAN default TRUE")
  private Boolean pitchEnabled = true;
  private Integer pitchOrder;
  @Column(columnDefinition = "BOOLEAN default TRUE")
  private Boolean publicEnabled = true;
  private Double publicOrder;
  @Column(columnDefinition = "BOOLEAN default FALSE")
  private Boolean impactCalculationTotal = false;
}
