package io.ventureplatform.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import javax.persistence.Entity;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "organizations")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Organization extends BaseEntity {
  @OneToMany(mappedBy = "organization")
  @Fetch(FetchMode.SUBSELECT)
  @EqualsAndHashCode.Exclude
  private List<Venture> ventures = new ArrayList<>();

  @OneToMany(mappedBy = "organization")
  @Fetch(FetchMode.SUBSELECT)
  @EqualsAndHashCode.Exclude
  private List<Portfolio> portfolios = new ArrayList<>();

  @OneToMany(mappedBy = "organization")
  @Fetch(FetchMode.SUBSELECT)
  @EqualsAndHashCode.Exclude
  private List<User> users = new ArrayList<>();
}
