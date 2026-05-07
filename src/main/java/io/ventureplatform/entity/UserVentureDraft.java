package io.ventureplatform.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import lombok.experimental.Accessors;

import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ManyToOne;
import javax.persistence.MapsId;
import javax.persistence.Table;

@Entity
@Table(name = "user_venture_drafts")
@Data
@Accessors(chain = true)
public class UserVentureDraft {
  @EmbeddedId
  private UserVentureDraftId id;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("id")
  @EqualsAndHashCode.Exclude
  @ToString.Exclude
  private Venture venture;
}

