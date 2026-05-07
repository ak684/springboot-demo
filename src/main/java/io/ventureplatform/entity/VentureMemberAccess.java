package io.ventureplatform.entity;

import io.ventureplatform.entity.enums.AccessType;
import io.ventureplatform.entity.enums.InvitationStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.Accessors;

import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;

@Entity
@Table(
  name = "venture_member_access",
  uniqueConstraints = @UniqueConstraint(columnNames = {"member_id", "venture_id"}))
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class VentureMemberAccess extends BaseEntity {
  @ManyToOne
  @JoinColumn(name = "venture_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Venture venture;

  @ManyToOne
  @JoinColumn(name = "member_id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private User member;

  @Enumerated(EnumType.STRING)
  private AccessType access;

  @Enumerated(EnumType.STRING)
  private InvitationStatus status;
}
