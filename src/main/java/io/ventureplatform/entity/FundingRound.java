package io.ventureplatform.entity;

import io.ventureplatform.entity.enums.FundingRoundType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;

import javax.persistence.CollectionTable;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "funding_rounds")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class FundingRound extends BaseEntity {
  @Enumerated(EnumType.STRING)
  private FundingRoundType type;
  private LocalDate date;
  private Double amount;
  @ElementCollection
  @CollectionTable(name = "funding_round_investors", joinColumns = @JoinColumn(name = "funding_round_id"))
  private List<Investor> investors = new ArrayList<>();

  @ManyToOne
  @JoinColumn(name = "venture_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Venture venture;
}
